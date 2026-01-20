from fastapi import FastAPI, Request, Form, Depends, File, UploadFile, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime
import os
import shutil
import random
from typing import Optional

# Database Setup
# User must ensure PostgreSQL is running. Defaulting to standard local credentials.
# Ideally, retrieve this from environment variables.
postgres_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/babytracker")
sqlite_url = "sqlite:///./baby_tracker.db"

try:
    # Try creating engine with Postgres
    engine = create_engine(postgres_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    
    # Try to connect (this will trigger the error if creds are wrong)
    with engine.connect() as connection:
        pass
        
    print("Connected to PostgreSQL")

except Exception as e:
    print(f"PostgreSQL connection failed: {e}")
    print("Falling back to SQLite...")
    
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.now)
    
    baby = relationship("Baby", uselist=False, back_populates="parent")

class Baby(Base):
    __tablename__ = "babies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    photo_url = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now)
    
    parent = relationship("User", back_populates="baby")
    sleeps = relationship("SleepEvent", back_populates="baby")
    cries = relationship("CryEvent", back_populates="baby")

class SleepEvent(Base):
    __tablename__ = "sleep_events"
    id = Column(Integer, primary_key=True, index=True)
    baby_id = Column(Integer, ForeignKey("babies.id"))
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    is_sleeping = Column(Boolean, default=True)
    
    baby = relationship("Baby", back_populates="sleeps")

class CryEvent(Base):
    __tablename__ = "cry_events"
    id = Column(Integer, primary_key=True, index=True)
    baby_id = Column(Integer, ForeignKey("babies.id"))
    timestamp = Column(DateTime, default=datetime.now)
    intensity = Column(String, default="Normal")
    audio_url = Column(String, nullable=True) # For voice tracker
    
    baby = relationship("Baby", back_populates="cries")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    baby_id = Column(Integer, ForeignKey("babies.id"))
    title = Column(String)
    is_completed = Column(Boolean, default=False)
    due_time = Column(String, nullable=True)
    category = Column(String, default="General") # Feeding, Diaper, etc.
    completed_at = Column(DateTime, nullable=True)
    
    baby = relationship("Baby", back_populates="tasks")

# Update Baby model to include tasks
Baby.tasks = relationship("Task", back_populates="baby")

# Create Tables
Base.metadata.create_all(bind=engine)

# App Setup
app = FastAPI()

# Session Middleware for Login/Auth
app.add_middleware(SessionMiddleware, secret_key="super-secret-random-key")

# Mount Static
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()

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
        
    baby = user.baby
    
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

    # Tasks
    tasks = db.query(Task).filter(Task.baby_id == baby.id).all()
    if not tasks:
        # Create default daily tasks if none exist
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

    return templates.TemplateResponse("index.html", {
        "request": request,
        "baby": baby,
        "ongoing_sleep": ongoing_sleep,
        "recent_cries": recent_cries,
        "cry_count_today": cry_count_today,
        "sleep_count_today": sleep_count_today,
        "sleep_duration_today": sleep_duration_today,
        "tasks": tasks
    })

# --- Auth Routes ---
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login/otp")
async def send_otp(request: Request, phone: str = Form(...), db: Session = Depends(get_db)):
    # Mock OTP - In a real app, integrate Twilio/SNS here
    # Check if user exists, if not create placeholder or wait for verify
    # For simplicity, we assume OTP is always 1234
    print(f"OTP for {phone}: 1234") 
    return templates.TemplateResponse("verify_otp.html", {"request": request, "phone": phone})

@app.post("/login/verify")
async def verify_otp(request: Request, phone: str = Form(...), otp: str = Form(...), db: Session = Depends(get_db)):
    if otp != "1234":
        return templates.TemplateResponse("verify_otp.html", {"request": request, "phone": phone, "error": "Invalid OTP"})
    
    # Auth success
    user = db.query(User).filter(User.phone_number == phone).first()
    if not user:
        user = User(phone_number=phone)
        db.add(user)
        db.commit()
    
    request.session["user_id"] = user.id
    return RedirectResponse(url="/", status_code=303)

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login")

# --- Baby Registration ---
@app.get("/register-baby", response_class=HTMLResponse)
async def register_baby_page(request: Request):
    return templates.TemplateResponse("register_baby.html", {"request": request})

@app.post("/register-baby")
async def register_baby(
    request: Request,
    name: str = Form(...),
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
        return RedirectResponse(url="/", status_code=303) # Already has one
        
    photo_url = None
    # Check if photo is provided and has a filename
    if photo and photo.filename:
        upload_dir = "app/static/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{user_id}_{random.randint(1000,9999)}_{photo.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/static/uploads/{filename}"
        
    new_baby = Baby(name=name, photo_url=photo_url, parent_id=user.id)
    db.add(new_baby)
    db.commit()
    
    return RedirectResponse(url="/", status_code=303)

# --- Actions ---
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
    else:
        new_sleep = SleepEvent(baby_id=baby.id, start_time=datetime.now())
        db.add(new_sleep)
    
    db.commit()
    return RedirectResponse(url=f"/?status={msg}", status_code=303)

@app.post("/cry")
async def log_cry(request: Request, intensity: str = Form(...), db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
         return RedirectResponse(url="/login", status_code=303)

    new_cry = CryEvent(baby_id=user.baby.id, intensity=intensity, timestamp=datetime.now())
    db.add(new_cry)
    db.commit()
    return RedirectResponse(url="/?status=cry_logged", status_code=303)

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
async def voice_log(request: Request, audio: UploadFile = File(...), db: Session = Depends(get_db)):
    # Handle voice blob upload
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
         return JSONResponse({"status": "error", "message": "Unauthorized"}, status_code=401)
         
    upload_dir = "app/static/uploads/voice"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{user.baby.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.webm"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    new_cry = CryEvent(baby_id=user.baby.id, intensity="Voice Detect", timestamp=datetime.now(), audio_url=f"/static/uploads/voice/{filename}")
    db.add(new_cry)
    db.commit()
    
    return JSONResponse({"status": "success", "message": "Voice recorded"})

@app.get("/analysis", response_class=HTMLResponse)
async def analysis(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.baby:
        return RedirectResponse(url="/login")
    
    baby = user.baby
    
    all_sleeps = db.query(SleepEvent).filter(SleepEvent.baby_id == baby.id).order_by(SleepEvent.start_time.desc()).all()
    all_cries = db.query(CryEvent).filter(CryEvent.baby_id == baby.id).order_by(CryEvent.timestamp.desc()).all()
    
    from datetime import timedelta
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
