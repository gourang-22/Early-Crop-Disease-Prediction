from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import soil, insect, disease, cases, auth, farms, alerts, assistant
from app.database import seed_db

app = FastAPI(
    title="Crop Health Intelligence Platform API",
    description="Farmer disease detection and officer verification system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    seed_db()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(farms.router, prefix="/farms", tags=["farms"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(soil.router, prefix="/predict", tags=["soil"])
app.include_router(insect.router, prefix="/predict", tags=["insect"])
app.include_router(disease.router, prefix="/predict", tags=["disease"])
app.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
app.include_router(cases.router, prefix="/cases", tags=["cases"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "crop-health-intelligence-platform"}