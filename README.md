# BabyTracker 🧸🎀

BabyTracker is a premium, mobile-first web application designed to help parents track their baby's daily activities, monitor sleep quality, and receive real-time alerts.

## ✨ Features

### 🏡 Modern Home Dashboard
- **Personalized Experience**: Displays your baby's photo and a warm welcome message.
- **Quick Navigation**: Large, high-depth cards for immediate access to Baby Tasks and the Night Monitor.
- **Smart Status Tracker**: Real-time indicator of whether the baby is awake or sleeping.
- **Recent Activity Preview**: See the latest cry alerts and sleep summaries at a glance.

### ✅ Baby Tasks & Reminders
- **Categorized Routine**: Manage feedings, diaper changes, medicine, and baths with specialized icons.
- **Progress Visualization**: Dynamic inline progress bars showing daily completion rates.
- **Quick Actions**: Easily toggle, skip, or add new tasks with a pixel-perfect, mobile-optimized form.

### 🌙 Night Monitor Mode
- **Dedicated Environment**: A distraction-free monitoring screen optimized for night-time use.
- **Cry Detection**: High-sensitivity sound analysis that prioritizes baby cry frequencies.
- **Automated Logging**: Automatically tracks sleep duration, wake-ups, and cry events.
- **Last Night Summary**: Review your baby's sleep quality (total sleep, cries, wake-ups) every morning.

### 🔐 Secure Authentication
- **Private SMS OTP**: Secure login using mobile phone numbers via Twilio.
- **No More Passwords**: Experience a seamless login flow with 4-digit verification codes sent directly to your handset.
- **Global Ready**: Built-in support for international phone formatting (defaulted to India +91).

## 🛠️ Technology Stack
- **Backend**: FastAPI (Python)
- **Frontend**: Jinja2 Templates, Vanilla CSS (Premium Design System), JavaScript
- **Database**: PostgreSQL (Production) / SQLite (Fallback/Testing)
- **SMS Infrastructure**: Twilio API
- **Analytics**: Chart.js for sleep pattern visualization

## 🚀 Setup & Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

### 🐳 Docker Deployment (Recommended)
The easiest way to run BabyTracker with a full PostgreSQL database is using Docker Compose.

1. **Build and Start**:
   ```bash
   docker-compose up --build
   ```
   *This will automatically launch the FastAPI app on port 8000 and PostgreSQL on port 5432.*

2. **Configure Credentials**:
   Edit the `environment` section in `docker-compose.yml` to set your real Twilio and Database keys.

## 🛠️ Technology Stack
