import random
import os
from twilio.rest import Client
from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, OTP
from datetime import datetime, timedelta
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="frontend/templates")

# Twilio Credentials
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "ACxxxxxxxxxxxxxxxxxxxxxxxx")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "xxxxxxxxxxxxxxxxxxxxxxxx")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")

def send_sms(to_phone: str, message: str):
    try:
        # Auto-format for India if no country code provided
        if not to_phone.startswith('+'):
            if len(to_phone) == 10:
                to_phone = f"+91{to_phone}"
            else:
                to_phone = f"+{to_phone}"
        
        if "xxx" in TWILIO_ACCOUNT_SID:
            print(f"DEBUG: Real Twilio credentials missing. SMS that would have been sent to {to_phone}: {message}")
            return
            
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        print(f"SMS sent successfully to {to_phone}")
    except Exception as e:
        print(f"Failed to send SMS to {to_phone}: {str(e)}")

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login/otp")
async def send_otp(request: Request, phone: str = Form(...), db: Session = Depends(get_db)):
    # Random 4-digit OTP
    otp_val = str(random.randint(1000, 9999))
    
    # Save to DB
    new_otp = OTP(phone_number=phone, otp_code=otp_val)
    db.add(new_otp)
    db.commit()
    
    # Store in session for easy retrieval on verify page (optional but helpful)
    request.session["phone"] = phone
    
    # Send via real SMS
    send_sms(phone, f"Your BabyTracker Verification Code is: {otp_val}")
    
    print(f"OTP for {phone}: {otp_val}") 
    
    template_data = {"request": request, "phone": phone}
    if "xxx" in TWILIO_ACCOUNT_SID:
        template_data["raw_otp"] = otp_val
        
    return templates.TemplateResponse("verify_otp.html", template_data)

@router.post("/login/verify")
async def verify_otp(request: Request, phone: str = Form(...), otp: str = Form(...), db: Session = Depends(get_db)):
    # Check DB for recent unused OTP
    time_limit = datetime.now() - timedelta(minutes=10)
    db_otp = db.query(OTP).filter(
        OTP.phone_number == phone,
        OTP.otp_code == otp,
        OTP.is_used == False,
        OTP.created_at >= time_limit
    ).order_by(OTP.created_at.desc()).first()

    if not db_otp:
        return templates.TemplateResponse("verify_otp.html", {"request": request, "phone": phone, "error": "Invalid or expired OTP"})
    
    # Mark as used
    db_otp.is_used = True
    db.commit()
    
    # Auth success
    user = db.query(User).filter(User.phone_number == phone).first()
    if not user:
        user = User(phone_number=phone)
        db.add(user)
        db.commit()
    
    request.session["user_id"] = user.id
    return RedirectResponse(url="/", status_code=303)

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login")
