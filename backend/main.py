from fastapi import FastAPI, Request, Form, Depends, File, UploadFile, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
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

# Session Middleware
app.add_middleware(SessionMiddleware, secret_key="super-secret-random-key")

# Mount Static from frontend folder
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# Templates from frontend folder
templates = Jinja2Templates(directory="frontend/templates")

# Include Auth Router
app.include_router(auth_router)

# Utility Functions
async def get_dashboard_data(db: Session, user: User):
    baby = user.baby
    if not baby:
        return None
        
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
            
    # Format Duration (e.g., "2h 15m")
    hours = int(total_sleep_seconds // 3600)
    minutes = int((total_sleep_seconds % 3600) // 60)
    sleep_duration_today = f"{hours}h {minutes}m"

    # Night Summary (Previous night 8 PM to Today 8 AM)
    now = datetime.now()
    if now.hour < 8:
        night_start = (now - timedelta(days=1)).replace(hour=20, minute=0, second=0, microsecond=0)
        night_end = now.replace(hour=8, minute=0, second=0, microsecond=0)
    else:
        night_start = now.replace(hour=20, minute=0, second=0, microsecond=0)
        night_end = (now + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0)
        if night_start > now: 
             night_start = (now - timedelta(days=1)).replace(hour=20, minute=0, second=0, microsecond=0)
             night_end = now.replace(hour=8, minute=0, second=0, microsecond=0)

    night_cries = db.query(CryEvent).filter(CryEvent.baby_id == baby.id, CryEvent.timestamp >= night_start, CryEvent.timestamp <= night_end).count()
    night_wakeups = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id, SleepEvent.end_time >= night_start, SleepEvent.end_time <= night_end).count()
    
    # Night Sleep Duration
    night_sleeps = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id, SleepEvent.start_time >= night_start, SleepEvent.start_time <= night_end).all()
    night_sleep_seconds = 0
    for s in night_sleeps:
        if s.end_time:
            night_sleep_seconds += (s.end_time - s.start_time).total_seconds()
        elif s.is_sleeping:
            night_sleep_seconds += (min(now, night_end) - s.start_time).total_seconds()
            
    night_sleep_hours = round(night_sleep_seconds / 3600, 1)

    # Tasks
    tasks = db.query(Task).filter(Task.baby_id == baby.id).all()
    if not tasks:
        default_tasks = [
            {"title": "Morning Feed", "category": "Feeding", "due_time": "08:00"},
            {"title": "Vitamin D Drops", "category": "Medicine", "due_time": "10:00"},
            {"title": "Diaper Check", "category": "Diaper", "due_time": "11:00"},
            {"title": "Tummy Time", "category": "Activity", "due_time": "14:00"},
            {"title": "Evening Bath", "category": "Bath", "due_time": "19:00"}
        ]
        for dt in default_tasks:
            new_task = Task(baby_id=baby.id, title=dt["title"], category=dt["category"], due_time=dt["due_time"])
            db.add(new_task)
        db.commit()
        tasks = db.query(Task).filter(Task.baby_id == baby.id).all()

    night_recordings = db.query(NightRecording).filter(NightRecording.baby_id == baby.id).order_by(NightRecording.timestamp.desc()).limit(10).all()

    return {
        "baby": baby,
        "ongoing_sleep": ongoing_sleep,
        "recent_cries": recent_cries,
        "cry_count_today": cry_count_today,
        "sleep_count_today": sleep_count_today,
        "sleep_duration_today": sleep_duration_today,
        "tasks": tasks,
        "night_cries": night_cries,
        "night_wakeups": night_wakeups,
        "night_sleep_hours": night_sleep_hours,
        "night_recordings": night_recordings
    }

# Routes
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        request.session.clear()
        return RedirectResponse(url="/login")
    if not user.baby:
        return RedirectResponse(url="/register-baby")
        
    data = await get_dashboard_data(db, user)
    return templates.TemplateResponse("home.html", {"request": request, **data})

@app.get("/tasks", response_class=HTMLResponse)
async def tasks_page(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/")
    
    data = await get_dashboard_data(db, user)
    return templates.TemplateResponse("tasks.html", {"request": request, **data})

@app.get("/monitor", response_class=HTMLResponse)
async def monitor_page(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/")
    
    data = await get_dashboard_data(db, user)
    return templates.TemplateResponse("monitor.html", {"request": request, **data})

@app.post("/update-baby")
async def update_baby(
    request: Request,
    birth_date: Optional[str] = Form(None),
    weight: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login", status_code=303)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/", status_code=303)
        
    if birth_date:
        user.baby.birth_date = birth_date
    if weight:
        user.baby.weight = weight
        
    db.commit()
    return RedirectResponse(url="/profile?status=baby_updated", status_code=303)

@app.get("/register-baby", response_class=HTMLResponse)
async def register_baby_page(request: Request):
    return templates.TemplateResponse("register_baby.html", {"request": request})

@app.post("/register-baby")
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
        return RedirectResponse(url="/login", status_code=303)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        request.session.clear()
        return RedirectResponse(url="/login", status_code=303)
        
    if user.baby:
        return RedirectResponse(url="/", status_code=303)
        
    photo_url = None
    if photo and photo.filename:
        upload_dir = "frontend/static/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{user_id}_{random.randint(1000,9999)}_{photo.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/static/uploads/{filename}"
        
    new_baby = Baby(
        name=name, 
        gender=gender, 
        birth_date=birth_date,
        weight=weight,
        photo_url=photo_url, 
        parent_id=user.id
    )
    db.add(new_baby)
    db.commit()
    
    return RedirectResponse(url="/", status_code=303)

@app.post("/sleep/toggle")
async def toggle_sleep(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/login", status_code=303)
        
    baby = user.baby
    ongoing = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id, SleepEvent.end_time == None).first()
    msg = "sleep_started"
    
    if ongoing:
        ongoing.end_time = datetime.now()
        ongoing.is_sleeping = False
        msg = "sleep_ended"
        target = "/monitor"
    else:
        new_sleep = SleepEvent(baby_id=baby.id, start_time=datetime.now())
        db.add(new_sleep)
        msg = "sleep_started"
        target = "/monitor"
    
    db.commit()
    return RedirectResponse(url=f"{target}?status={msg}", status_code=303)

@app.post("/cry")
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
    if audio and audio.filename and len(audio.filename) > 0:
        upload_dir = "frontend/static/uploads/cries"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"cry_{user.baby.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.webm"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        audio_url = f"/static/uploads/cries/{filename}"

    new_cry = CryEvent(
        baby_id=user.baby.id, 
        intensity=intensity, 
        timestamp=datetime.now(),
        audio_url=audio_url
    )
    db.add(new_cry)
    db.commit()
    return JSONResponse({"status": "success", "audio_url": audio_url})

@app.post("/task/create")
async def create_task(request: Request, title: str = Form(...), due_time: str = Form(...), db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/login", status_code=303)
        
    new_task = Task(baby_id=user.baby.id, title=title, due_time=due_time, category="Custom")
    db.add(new_task)
    db.commit()
    return RedirectResponse(url="/?status=task_created", status_code=303)

@app.post("/task/skip/{task_id}")
async def skip_task(task_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/login", status_code=303)
        
    task = db.query(Task).filter(Task.id == task_id, Task.baby_id == user.baby.id).first()
    if task:
        db.delete(task)
        db.commit()
    
    return RedirectResponse(url="/?status=task_skipped", status_code=303)

@app.post("/task/toggle/{task_id}")
async def toggle_task(task_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/login", status_code=303)
        
    task = db.query(Task).filter(Task.id == task_id, Task.baby_id == user.baby.id).first()
    if task:
        task.is_completed = not task.is_completed
        task.completed_at = datetime.now() if task.is_completed else None
        db.commit()
    
    return RedirectResponse(url="/?status=task_updated", status_code=303)

@app.post("/voice-log")
async def voice_log(request: Request, audio: UploadFile = File(...), intensity: Optional[str] = Form("Voice Detect"), db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
         return JSONResponse({"status": "error", "message": "Unauthorized"}, status_code=401)
         
    upload_dir = "frontend/static/uploads/voice"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{user.baby.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.webm"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    new_cry = CryEvent(baby_id=user.baby.id, intensity=intensity, timestamp=datetime.now(), audio_url=f"/static/uploads/voice/{filename}")
    db.add(new_cry)
    db.commit()
    
    return JSONResponse({"status": "success", "message": "Voice recorded"})

@app.post("/upload-night-recording")
async def upload_night_recording(
    request: Request, 
    audio: UploadFile = File(...), 
    duration: int = Form(...),
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return JSONResponse({"status": "error", "message": "Unauthorized"}, status_code=401)
        
    upload_dir = "frontend/static/uploads/night"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"night_{user.baby.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.webm"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    new_rec = NightRecording(
        baby_id=user.baby.id, 
        audio_url=f"/static/uploads/night/{filename}",
        duration=duration
    )
    db.add(new_rec)
    db.commit()
    
    return JSONResponse({"status": "success", "message": "Night recording saved"})

@app.get("/analysis", response_class=HTMLResponse)
async def analysis(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/login")
    
    baby = user.baby
    
    all_sleeps = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id).order_by(SleepEvent.start_time.desc()).all()
    all_cries = db.query(CryEvent).filter(CryEvent.baby_id == baby.id).order_by(CryEvent.timestamp.desc()).all()
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    dates = []
    sleep_data = []
    cry_data = []
    
    for i in range(6, -1, -1):
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_label = day_start.strftime("%a")
        dates.append(day_label)
        
        c_count = db.query(CryEvent).filter(CryEvent.baby_id == baby.id, CryEvent.timestamp >= day_start, CryEvent.timestamp < day_end).count()
        cry_data.append(c_count)
        
        s_events = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id, SleepEvent.start_time >= day_start, SleepEvent.start_time < day_end).all()
        total_hours = 0
        for s in s_events:
            if s.end_time:
                duration = (s.end_time - s.start_time).total_seconds() / 3600
                total_hours += duration
            elif s.is_sleeping:
                 duration = (datetime.now() - s.start_time).total_seconds() / 3600
                 total_hours += duration
        sleep_data.append(round(total_hours, 1))

    return templates.TemplateResponse("analysis.html", {
        "request": request, 
        "sleeps": all_sleeps, 
        "cries": all_cries,
        "chart_labels": dates,
        "chart_sleep": sleep_data,
        "chart_cry": cry_data,
        "baby": baby
    })

@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/login")
    
    return templates.TemplateResponse("profile.html", {"request": request, "baby": user.baby, "user": user})
