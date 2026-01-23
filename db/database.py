from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# PostgreSQL Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/babytracker")
SQLITE_URL = "sqlite:///./baby_tracker.db"

try:
    engine = create_engine(DATABASE_URL)
    # Just try to get a connection to test if it's alive
    with engine.connect() as conn:
        pass
except Exception:
    print("PostgreSQL not found or connection failed. Falling back to SQLite for local development...")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
