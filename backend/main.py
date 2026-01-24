from fastapi import FastAPI, Request, Form, Depends, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime, timedelta
import os
import shutil
import random
from typing import Optional

from db.database import engine, get_db, Base
from db.models import User, Baby, SleepEvent, CryEvent, Task, NightRecording, OTP
from .auth import router as auth_router

# Create Tables
Base.metadata.create_all(bind=engine)

# App Setup
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session Middleware
app.add_middleware(SessionMiddleware, secret_key="super-secret-random-key")

# Include Auth Router
app.include_router(auth_router, prefix="/api")

@app.get("/api")
async def root_api():
    return {"status": "success", "message": "BabyTracker API is running"}

# Mount Uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Utility Functions
async def get_dashboard_data(db: Session, user: User):
    baby = user.baby
    if not baby:
        return {"baby": None}
        
    # Get baby status
    ongoing_sleep = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id, SleepEvent.end_time == None).first()
    recent_cries = db.query(CryEvent).filter(CryEvent.baby_id == baby.id).order_by(CryEvent.timestamp.desc()).limit(5).all()
    
    # Stats
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    cry_count_today = db.query(CryEvent).filter(CryEvent.baby_id == baby.id, CryEvent.timestamp >= today_start).count()
    
    # Sleep Stats
    sleeps_today = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id, SleepEvent.start_time >= today_start).all()
    sleep_count_today = len(sleeps_today)
    
    total_sleep_seconds = 0
    for s in sleeps_today:
        if s.end_time:
            total_sleep_seconds += (s.end_time - s.start_time).total_seconds()
        elif s.is_sleeping:
            total_sleep_seconds += (datetime.now() - s.start_time).total_seconds()
            
    # Format Duration
    hours = int(total_sleep_seconds // 3600)
    minutes = int((total_sleep_seconds % 3600) // 60)
    sleep_duration_today = f"{hours}h {minutes}m"

    # Tasks
    tasks = db.query(Task).filter(Task.baby_id == baby.id).all()
    
    night_recordings = db.query(NightRecording).filter(NightRecording.baby_id == baby.id).order_by(NightRecording.timestamp.desc()).limit(10).all()

    return {
        "baby": {
            "id": baby.id,
            "name": baby.name,
            "gender": baby.gender,
            "birth_date": baby.birth_date,
            "weight": baby.weight,
            "photo_url": baby.photo_url
        },
        "ongoing_sleep": ongoing_sleep.id if ongoing_sleep else None,
        "recent_cries": [{"id": c.id, "intensity": c.intensity, "timestamp": c.timestamp.isoformat(), "audio_url": c.audio_url} for c in recent_cries],
        "cry_count_today": cry_count_today,
        "sleep_count_today": sleep_count_today,
        "sleep_duration_today": sleep_duration_today,
        "tasks": [{
            "id": t.id, 
            "title": t.title, 
            "is_completed": t.is_completed, 
            "due_time": t.due_time, 
            "category": t.category,
            "action_type": t.action_type,
            "interval_minutes": t.interval_minutes,
            "interval_count": t.interval_count,
            "photo_url": t.photo_url
        } for t in tasks],
        "night_recordings": [{"id": n.id, "timestamp": n.timestamp.isoformat(), "audio_url": n.audio_url, "duration": n.duration} for n in night_recordings]
    }

@app.get("/api/dashboard")
async def dashboard(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.baby:
        return JSONResponse({"status": "no_baby"})
        
    data = await get_dashboard_data(db, user)
    return JSONResponse(data)

@app.post("/api/task/create")
async def create_task(
    request: Request,
    title: str = Form(...),
    action_type: str = Form("Daily"),
    due_time: Optional[str] = Form(None),
    interval_minutes: int = Form(0),
    interval_count: int = Form(1),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        raise HTTPException(status_code=401, detail="Unauthorized")

    photo_url = None
    if photo and photo.filename:
        upload_dir = "uploads/tasks"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"task_{random.randint(1000,9999)}_{photo.filename}"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/uploads/tasks/{filename}"

    new_task = Task(
        baby_id=user.baby.id,
        title=title,
        action_type=action_type,
        due_time=due_time,
        interval_minutes=interval_minutes,
        interval_count=interval_count,
        photo_url=photo_url
    )
    db.add(new_task)
    db.commit()
    return JSONResponse({"status": "success", "task_id": new_task.id})

@app.get("/api/analysis")
async def analysis(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    baby = user.baby
    # Last 7 days sleep data
    today = datetime.now()
    sleep_history = []
    for i in range(7):
        date = (today - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = date + timedelta(days=1)
        
        sleeps = db.query(SleepEvent).filter(
            SleepEvent.baby_id == baby.id, 
            SleepEvent.start_time >= date,
            SleepEvent.start_time < end_date
        ).all()
        
        total_sec = 0
        for s in sleeps:
            if s.end_time:
                total_sec += (s.end_time - s.start_time).total_seconds()
        
        sleep_history.append({"date": date.strftime("%a"), "hours": round(total_sec/3600, 1)})
    
    return JSONResponse({
        "sleep_history": sleep_history[::-1],
        "total_cries": db.query(CryEvent).filter(CryEvent.baby_id == baby.id).count(),
        "completion_rate": 85 # Dummy static logic for now
    })

@app.post("/api/register-baby")
async def register_baby(
    request: Request,
    name: str = Form(...),
    gender: str = Form("Girl"),
    birth_date: str = Form(...),
    weight: Optional[str] = Form(None),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    baby = user.baby
    
    photo_url = baby.photo_url if baby else None
    if photo and photo.filename:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{user_id}_{random.randint(1000,9999)}_{photo.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/uploads/{filename}"
        
    if baby:
        # Update existing baby
        baby.name = name
        baby.gender = gender
        baby.birth_date = birth_date
        baby.weight = weight
        baby.photo_url = photo_url
        msg = "updated"
    else:
        # Create new baby
        baby = Baby(
            name=name, 
            gender=gender, 
            birth_date=birth_date,
            weight=weight,
            photo_url=photo_url, 
            parent_id=user.id
        )
        db.add(baby)
        msg = "created"
        
    db.commit()
    return JSONResponse({"status": "success", "message": msg, "baby_id": baby.id})

@app.post("/api/sleep/toggle")
async def toggle_sleep(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    baby = user.baby
    ongoing = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id, SleepEvent.end_time == None).first()
    
    if ongoing:
        ongoing.end_time = datetime.now()
        ongoing.is_sleeping = False
        msg = "sleep_ended"
    else:
        new_sleep = SleepEvent(baby_id=baby.id, start_time=datetime.now())
        db.add(new_sleep)
        msg = "sleep_started"
    
    db.commit()
    return JSONResponse({"status": "success", "message": msg})

@app.post("/api/cry")
async def log_cry(
    request: Request, 
    intensity: str = Form(...), 
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
         return JSONResponse({"status": "error", "message": "Unauthorized"}, status_code=401)

    audio_url = None
    if audio and audio.filename:
        upload_dir = "uploads/cries"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"cry_{user.baby.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.webm"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        audio_url = f"/uploads/cries/{filename}"

    new_cry = CryEvent(
        baby_id=user.baby.id, 
        intensity=intensity, 
        timestamp=datetime.now(),
        audio_url=audio_url
    )
    db.add(new_cry)
    db.commit()
    return JSONResponse({"status": "success", "audio_url": audio_url})

@app.post("/api/task/toggle/{task_id}")
async def toggle_task(task_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    task = db.query(Task).filter(Task.id == task_id, Task.baby_id == user.baby.id).first()
    if task:
        task.is_completed = not task.is_completed
        db.commit()
        return JSONResponse({"status": "success"})
    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/api/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return JSONResponse({"authenticated": False})
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return JSONResponse({"authenticated": False})
    return JSONResponse({
        "authenticated": True,
        "phone_number": user.phone_number,
        "has_baby": user.baby is not None
    })
