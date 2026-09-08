<div align="center">

# 🌱 KrishiScan — Early Crop Disease Prediction Platform

**An AI-powered, production-grade AgriTech platform for Indian farmers**  
Built for **Smart India Hackathon 2026** · Problem Statement: Early Crop Disease Prediction

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EfficientNet-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3-F55036?style=for-the-badge)](https://groq.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo Flow](#-live-demo-flow)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [AI Models](#-ai-models)
- [Database Schema](#-database-schema)
- [Presentation Flow](#-presentation-flow-sih)
- [Team](#-team)

---

## 🌾 About the Project

KrishiScan is a full-stack, SaaS-style crop health intelligence platform that enables Indian farmers to detect crop diseases early using AI, receive automated early-warning alerts based on weather conditions, and get expert verification from agricultural officers — all in a single integrated workflow.

### The Core Problem
> Indian farmers lose **₹50,000–1,00,000 per acre** annually due to late detection of crop diseases. Manual inspection is reactive, slow, and unavailable in rural areas.

### Our Solution: `Predict → Detect → Verify → Manage → Learn`

| Stage | What Happens |
|-------|-------------|
| **PREDICT** | AI models analyze weather + crop stage to generate an Early Warning risk score |
| **DETECT** | Farmer uploads a leaf photo; EfficientNet classifies the disease with confidence % |
| **VERIFY** | Agricultural officer reviews AI diagnosis via a validation portal and confirms/rejects |
| **MANAGE** | KrishiBot (Groq LLaMA 3.3) provides multilingual integrated pest management guidance |
| **LEARN** | Confirmed field data is fed back to improve future model predictions |

---

## 🎬 Live Demo Flow

```
1. Open http://localhost:5173
   └─ Redirects to /login (unauthenticated)

2. Log in as Demo Farmer (phone: 1234567890, password: password123)
   └─ Dashboard with HIGH risk alert banner

3. Click "📷 Inspect & Scan" in the alert
   └─ Disease Scanner → upload leaf photo → AI analysis

4. View Diagnosis Result (/disease/result)
   └─ 91% confidence, Early Blight detected
   └─ Save case for officer review

5. Click "Get Management Guidance"
   └─ AI Assistant with disease context pre-loaded
   └─ Ask in any of 6 Indian languages (voice or text)

6. Log out → Log in as Agri Officer (phone: 0987654321, password: password123)
   └─ Officer Dashboard with geospatial map

7. Click case in Validation Queue → ValidationModal opens
   └─ Click "✓ Confirm Diagnosis"
   └─ 🎓 "Feedback logged for model improvement" (LEARN stage)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React 18 + Vite + Tailwind CSS                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  AuthContext │  │  AppShell    │  │  React Router 6  │  │
│  │  (LocalStore)│  │  Sidebar +   │  │  Protected Routes│  │
│  └──────────────┘  │  Topbar      │  └──────────────────┘  │
│                    └──────────────┘                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│                     AI SERVICE                              │
│                   FastAPI (port 8000)                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────┐   │
│  │  /auth   │  │  /farms  │  │  /predict  │  │ /cases  │   │
│  │  /alerts │  │          │  │   disease  │  │         │   │
│  └──────────┘  └──────────┘  │   soil     │  └─────────┘   │
│                              │   insect   │                 │
│                              └────────────┘                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              SQLite Database (auto-seeded)            │  │
│  │  Users · Farms · Alerts · Cases                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────┐   ┌─────────────────────────────┐   │
│  │   EfficientNet-B0  │   │   EfficientNet-B0           │   │
│  │   Disease Model    │   │   Soil / Insect Classifier  │   │
│  │   (91% accuracy)   │   │   (97%+ accuracy)           │   │
│  └────────────────────┘   └─────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    EXTERNAL APIS                             │
│  Groq LLaMA 3.3 (chat) · Groq Whisper (voice transcription) │
│  Open-Meteo (weather) · OpenStreetMap (geospatial map)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 | SaaS-style UI with AppShell |
| **Routing** | React Router v6 | Protected routes, role-based nav |
| **AI Service** | FastAPI, Python 3.11+ | REST API + ML inference |
| **ML Models** | PyTorch, EfficientNet-B0 | Disease, soil, insect classification |
| **Database** | SQLite + SQLAlchemy ORM | Persistent storage, auto-seeded |
| **AI Chat** | Groq LLaMA 3.3 70B | Multilingual farming assistant |
| **Voice** | Groq Whisper Large v3 | Voice-to-text in 6 Indian languages |
| **Weather** | Open-Meteo API | Free, no API key required |
| **Map** | React-Leaflet + OpenStreetMap | Disease hotspot visualization |
| **Fonts** | Google Fonts — Inter | Clean, professional typography |

---

## ✨ Features

### 🧑‍🌾 Farmer Portal
- **Dashboard** — Time-aware greeting, active farm context, risk meter, HIGH alert banner
- **Early Warning System** — Weather-based disease risk scores seeded automatically
- **My Farms** — Multi-farm management with crop variety, growth stage, sowing date
- **Disease Scanner** — Drag-and-drop leaf photo upload → AI diagnosis in seconds
- **Diagnosis Result** — Confidence meter, risk badge, conditional CTAs (manage / retake / escalate)
- **Crop Health Analytics** — 7-day risk trend bar chart, environmental factors, disease probability
- **Alerts Center** — Severity-colored cards (HIGH/MEDIUM/LOW), filter tabs, mark-read
- **AI Assistant (KrishiBot)** — Voice + text chatbot in English, Hindi, Marathi, Tamil, Telugu, Kannada
- **Case History** — Full log of all submitted scan cases

### 👮 Officer Portal
- **Geospatial Risk Map** — Interactive Leaflet map with disease hotspot circles
- **Validation Queue** — Filterable list of cases (Suspected / Confirmed / Rejected)
- **Validation Modal** — Full case details, AI confidence, weather context, officer notes
- **LEARN Stage** — Confirmation triggers feedback notification for model improvement

### 🔐 Auth & Onboarding
- **Login / Register** — Split-panel design with demo quick-login buttons
- **Onboarding Wizard** — 3-step farm setup: name/location → crop info → success screen
- **Role-based routing** — Farmers → `/dashboard`, Officers → `/officer`
- **Session persistence** — Auth state and active farm saved to localStorage

---

## 📁 Project Structure

```
krishiscan/
├── frontend/                     # React + Vite + Tailwind
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state, farms, active farm
│   │   ├── components/
│   │   │   ├── AppShell.jsx      # Sidebar + Topbar layout
│   │   │   ├── ValidationModal.jsx  # Officer case review modal
│   │   │   ├── Navbar.jsx        # Legacy (preserved)
│   │   │   └── PageLoader.jsx    # Animated page transition
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── OnboardingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FarmsPage.jsx
│   │   │   ├── CropHealthPage.jsx
│   │   │   ├── DiseaseScanPage.jsx
│   │   │   ├── DiagnosisResultPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── AssistantPage.jsx    # KrishiBot (Groq)
│   │   │   ├── OfficerDashboard.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── InsectScanPage.jsx
│   │   │   ├── WeatherPage.jsx
│   │   │   └── ScanPage.jsx         # Soil scan
│   │   ├── App.jsx                  # Routes + ProtectedRoute guards
│   │   ├── main.jsx
│   │   └── index.css                # Design system tokens
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── ai-service/                   # Python FastAPI + ML
│   ├── app/
│   │   ├── database.py           # SQLAlchemy models + seed_db()
│   │   ├── main.py               # FastAPI app + CORS + startup
│   │   ├── models/
│   │   │   ├── soil_classifier.py
│   │   │   ├── insect_classifier.py
│   │   │   └── disease_classifier.py
│   │   ├── routers/
│   │   │   ├── auth.py           # /auth/login, /auth/register
│   │   │   ├── farms.py          # /farms CRUD
│   │   │   ├── alerts.py         # /alerts read/mark-read
│   │   │   ├── cases.py          # /cases CRUD + validate
│   │   │   ├── disease.py        # /predict/disease
│   │   │   ├── soil.py           # /predict/soil
│   │   │   └── insect.py         # /predict/insect
│   │   └── schemas/
│   ├── ml_models/
│   │   ├── soil_classes.json
│   │   └── insect_classes.json
│   │   # ⚠️ .pt model weights: download separately (see below)
│   └── requirements.txt
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and **npm**
- **Python** 3.11+
- **Git**

### Step 1 — Clone the Repository

```bash
git clone https://github.com/gourang-22/Early-Crop-Disease-Prediction.git
cd Early-Crop-Disease-Prediction
```

### Step 2 — Download ML Model Weights

> The `.pt` PyTorch model files are too large for GitHub (>100MB). Place them here after downloading:

```
ai-service/ml_models/soil_classifier.pt       # Soil type classifier
ai-service/ml_models/insect_classifier.pt     # Insect classifier
ai-service/ml_models/disease_classifier.pt    # Crop disease classifier
```

### Step 3 — Set Up the AI Service (Backend)

```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

✅ Verify: [http://localhost:8000/health](http://localhost:8000/health)  
📖 API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

> **Note:** The SQLite database is **automatically seeded** on first startup with:
> - Demo Farmer (`1234567890` / `password123`)
> - Agri Officer (`0987654321` / `password123`)
> - Tomato Farm in Nashik, Maharastra
> - One HIGH severity early warning alert

### Step 4 — Set Up the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

Get your free Groq API key at [console.groq.com](https://console.groq.com)

```bash
npm run dev
```

✅ Open: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Environment Variables

| Variable | Required | Where to Get |
|----------|----------|-------------|
| `VITE_GROQ_API_KEY` | ✅ Required | [console.groq.com](https://console.groq.com) — free tier available |

All other APIs (Open-Meteo, OpenStreetMap) are free and require no keys.

---

## 📡 API Reference

Base URL: `http://localhost:8000`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Login with phone + password |
| `POST` | `/auth/register` | Register new farmer account |

### Farms
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/farms/?owner_id={id}` | Get all farms for a user |
| `GET` | `/farms/{farm_id}` | Get single farm |
| `POST` | `/farms/` | Create new farm |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/alerts/?farm_id={id}` | Get alerts for a farm |
| `POST` | `/alerts/{alert_id}/read` | Mark alert as read |

### Cases (Disease Scan Reports)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cases/` | Get all cases (officer view) |
| `POST` | `/cases/` | Submit new scan case |
| `POST` | `/cases/{id}/validate?status=Confirmed` | Officer validates a case |

### AI Prediction
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict/disease` | Disease detection from leaf image |
| `POST` | `/predict/soil` | Soil type classification from image |
| `POST` | `/predict/insect` | Insect classification from image |

---

## 🧠 AI Models

All models use **EfficientNet-B0** fine-tuned on agricultural datasets.

| Model | Classes | Accuracy | Input |
|-------|---------|----------|-------|
| **Disease Classifier** | 38 plant diseases (PlantVillage) | ~91% | Leaf image |
| **Soil Classifier** | Alluvial, Arid, Black, Laterite, Mountain, Red, Yellow | 97.16% | Soil image |
| **Insect Classifier** | Beneficial, Harmful, Neutral | ~90%+ | Insect image |

### Confidence-Based Routing

| Confidence | Action |
|-----------|--------|
| ≥ 85% | High confidence — management guidance unlocked |
| 60–85% | Medium — retake photo recommended |
| < 60% | Low — escalated to agricultural officer |

---

## 🗄️ Database Schema

```sql
-- Core entities (SQLite, auto-created on startup)

Users    (id, name, phone, location, language, password, is_officer)
Farms    (id, owner_id→Users, name, village, district, state, crop,
          crop_variety, sowing_date, growth_stage, area)
Alerts   (id, farm_id→Farms, title, message, severity, date, is_read)
Cases    (id, farm_id→Farms, village, crop, disease, confidence,
          risk_level, status, image_url, created_at)
```

Status flow: `Suspected` → `Confirmed` | `Rejected`

---

## 🎯 Presentation Flow (SIH)

```
Stage 1 — PREDICT
  Login → Dashboard → See 82% HIGH Risk alert (weather-triggered)

Stage 2 — DETECT  
  Alert banner → Disease Scanner → Upload leaf photo → AI detects
  "Early Blight" at 91% confidence

Stage 3 — VERIFY
  Result page → Save Case → Switch to Officer Dashboard
  Click case → ValidationModal → Confirm Diagnosis

Stage 4 — MANAGE
  Diagnosis Result → "Get Management Guidance"
  → KrishiBot (Groq LLaMA) answers in farmer's native language

Stage 5 — LEARN
  Officer confirms → "🎓 Feedback logged for model improvement"
  → Demonstrates closed feedback loop for continuous AI improvement
```

---

## 🔧 Troubleshooting

**AI service won't start**
```
→ Activate venv first: venv\Scripts\activate
→ Python 3.11+ required
→ Run: pip install -r requirements.txt
```

**Disease scan fails (CORS or connection error)**
```
→ Backend must be running on port 8000
→ Check: http://localhost:8000/health
→ Model weights (.pt files) must exist in ai-service/ml_models/
```

**KrishiBot not responding**
```
→ Set VITE_GROQ_API_KEY in frontend/.env
→ Restart dev server after editing .env
→ Free API key: console.groq.com
```

**Login shows "Invalid credentials"**
```
→ Backend may not have seeded — restart uvicorn
→ Demo credentials: 1234567890 / password123
```

**Blank page / 404**
```
→ npm install in frontend/
→ npm run dev
→ F12 → Console for specific errors
```

---

## 📦 Dependencies

### Frontend (`frontend/package.json`)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "react-leaflet": "^4.2.1",
  "leaflet": "^1.9.4",
  "@tanstack/react-query": "^5.24.0",
  "axios": "^1.6.7"
}
```

### AI Service (`ai-service/requirements.txt`)
```
fastapi
uvicorn
sqlalchemy
python-multipart
pillow
numpy
torch
torchvision
```

---

## 🧑‍💻 Development Notes

- **Frontend** (port 5173) calls **AI Service** (port 8000) directly via REST
- **AuthContext** stores session in `localStorage` — no JWT (prototype choice)
- **SQLite** auto-seeds on startup — delete `sih_demo.db` to reset all data
- **PageLoader** shows a creative soil/bug animation between route transitions
- **Legacy routes** `/chat`, `/scan`, `/weather` redirect to new paths
- All pages handle **Loading**, **Empty**, **Error**, and **Success** states

---

## 📄 License

This project was developed for Smart India Hackathon 2026 and is intended for educational and demonstration purposes.

---

<div align="center">

**Built with ❤️ for Indian farmers**

*Smart India Hackathon 2026 · Agriculture Intelligence · Early Crop Disease Prediction*

</div>