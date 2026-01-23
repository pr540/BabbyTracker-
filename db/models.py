from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

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
    gender = Column(String, default="Girl")
    birth_date = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now)
    
    parent = relationship("User", back_populates="baby")
    sleeps = relationship("SleepEvent", back_populates="baby")
    cries = relationship("CryEvent", back_populates="baby")
    tasks = relationship("Task", back_populates="baby")
    night_recordings = relationship("NightRecording", back_populates="baby")

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
    audio_url = Column(String, nullable=True)
    
    baby = relationship("Baby", back_populates="cries")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    baby_id = Column(Integer, ForeignKey("babies.id"))
    title = Column(String)
    is_completed = Column(Boolean, default=False)
    due_time = Column(String, nullable=True)
    category = Column(String, default="General")
    completed_at = Column(DateTime, nullable=True)
    
    baby = relationship("Baby", back_populates="tasks")

class NightRecording(Base):
    __tablename__ = "night_recordings"
    id = Column(Integer, primary_key=True, index=True)
    baby_id = Column(Integer, ForeignKey("babies.id"))
    timestamp = Column(DateTime, default=datetime.now)
    audio_url = Column(String)
    duration = Column(Integer)
    
    baby = relationship("Baby", back_populates="night_recordings")

class OTP(Base):
    __tablename__ = "otps"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, index=True)
    otp_code = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    is_used = Column(Boolean, default=False)
