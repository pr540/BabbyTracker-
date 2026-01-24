# 👶 BabyTracker - Elite Parental Care System

The ultimate "Five-Star" AI-driven tracking solution for newborns. This application provides a seamless, premium experience for parents to monitor, track, and analyze their baby's growth and wellbeing with state-of-the-art technology.

## 🚀 Technology Stack

### **Frontend**
- **React 18**: Component-based UI library.
- **Vite**: Ultra-fast next-generation frontend tooling.
- **Framer Motion**: Premium micro-animations and page transitions.
- **Lucide React**: Clean and consistent iconography.
- **Axios**: Promised-based HTTP client for API communication.
- **Vanilla CSS3**: Modern glassmorphism design with HSL variables.

### **Backend**
- **FastAPI (Python)**: High-performance, asynchronous web framework.
- **SQLAlchemy**: Powerful Python SQL Toolkit and ORM.
- **Starlette Sessions**: Secure server-side session management.
- **Uvicorn**: Lightning-fast ASGI server.
- **Twilio SDK**: Integrated (mocked for dev) for SMS OTP delivery.

### **Database & Infrastructure**
- **PostgreSQL**: Production-grade relational database.
- **SQLite**: Seamless local development fallback.
- **Docker & Docker Compose**: Containerized environment for one-click deployment.
- **Nginx**: Production reverse proxy for serving the frontend.

---

## 🛠️ Performance Architecture

### **Hooks Used (React Context)**
We utilize modern React patterns to ensure a highly responsive and stateful UI:
1.  **`useState`**: For managing local UI state (loading, form data, ML scores).
2.  **`useEffect`**: For handling API side-effects, real-time intervals, and ML simulations.
3.  **`useNavigate`**: For programmatically switching between premium screens.
4.  **`useLocation`**: For passing secure authentication data between pages.
5.  **`AnimatePresence`**: For managing entry/exit animations of glassmorphic elements.

---

## 🔌 API Ecosystem (Total: 12 Endpoints)

The application is powered by a robust set of RESTful APIs:

### **Authentication**
- `POST /api/login/otp`: Triggers a 4-digit code to the user's terminal/phone.
- `POST /api/login/verify`: Exchanges OTP for a secure session.
- `GET /api/me`: Returns persistence state and baby registration status.
- `GET /api/logout`: Safely destroys the user session.

### **Baby Core Management**
- `POST /api/register-baby`: A smart **UPSERT** endpoint to create or update baby profiles (name, gender, weight, photo).
- `GET /api/dashboard`: Aggregates real-time stats including sleep totals and today's tasks.

### **Live Monitoring & AI**
- `POST /api/sleep/toggle`: One-tap logging for beginning or ending infant rest sessions.
- `POST /api/cry`: Logs acoustic patterns for frequency analysis.
- `GET /api/api`: System health check and heartbeat.

### **Routine & Analytics**
- `POST /api/task/create`: Dynamically creates recurring tasks with photo and interval support.
- `POST /api/task/toggle/{id}`: Marks routines as completed/active.
- `GET /api/analysis`: Provides 7-day sleep history, completion rates, and AI behavioral insights.

---

## 🏗️ Getting Started

### **Local Run**
1. Install dependencies: `cd frontend-react; npm install`
2. Start Backend: `uvicorn backend.main:app --reload`
3. Start Frontend: `npm run dev`

### **Docker Deployment**
Run the entire stack with a single command:
```bash
docker-compose up -d --build
```

---

## ⭐️ Delivery Note
This app is specifically optimized for **five-star parental delivery**, featuring a high-visibility **Diagnostics Tool** in the Monitor tab to ensure 100% API reliability before user testing.
