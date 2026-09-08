import os
from fastapi import APIRouter, File, UploadFile, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db, Case

router = APIRouter()

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

class DiseasePredictionResponse(BaseModel):
    disease: str
    confidence: float
    risk_level: str
    message: str

@router.post("/disease", response_model=DiseasePredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # In DEMO_MODE, always return Early Blight
    if DEMO_MODE:
        disease = "Early Blight"
        confidence = 0.91
        risk_level = "HIGH"
        message = "High confidence diagnosis. Early Blight detected."
    else:
        # Placeholder for actual model inference
        disease = "Unknown"
        confidence = 0.0
        risk_level = "LOW"
        message = "Model inference not implemented yet."

    # Record the case in DB for Officer Dashboard
    new_case = Case(
        village="Nashik - Village D",
        crop="Tomato",
        disease=disease,
        confidence=confidence,
        risk_level=risk_level,
        status="Suspected",
        image_url="demo_image.jpg" # In a real app we'd save and serve the image
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return DiseasePredictionResponse(
        disease=disease,
        confidence=confidence,
        risk_level=risk_level,
        message=message
    )
