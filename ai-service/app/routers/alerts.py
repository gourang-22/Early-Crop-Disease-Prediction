from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, Alert
from pydantic import BaseModel
from typing import List, Optional
import datetime

router = APIRouter()

class AlertResponse(BaseModel):
    id: int
    farm_id: int
    title: str
    message: str
    severity: str
    date: datetime.datetime
    is_read: bool

    class Config:
        orm_mode = True

@router.get("/", response_model=List[AlertResponse])
def get_alerts(farm_id: int, db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.farm_id == farm_id).order_by(Alert.date.desc()).all()

@router.post("/{alert_id}/read")
def mark_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"message": "Marked as read"}
