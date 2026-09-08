from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, Case
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class CaseCreate(BaseModel):
    farm_id: Optional[int] = None
    village: str = "Unknown"
    crop: str
    disease: str
    confidence: float
    risk_level: str
    status: str = "Suspected"
    image_url: Optional[str] = None

class CaseResponse(BaseModel):
    id: int
    village: str
    crop: str
    disease: str
    confidence: float
    risk_level: str
    status: str
    image_url: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("/", response_model=List[CaseResponse])
def get_cases(db: Session = Depends(get_db)):
    return db.query(Case).order_by(Case.created_at.desc()).all()

@router.post("/", response_model=CaseResponse)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    new_case = Case(
        farm_id=case.farm_id,
        village=case.village,
        crop=case.crop,
        disease=case.disease,
        confidence=case.confidence,
        risk_level=case.risk_level,
        status=case.status,
        image_url=case.image_url,
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.post("/{case_id}/validate", response_model=CaseResponse)
def validate_case(case_id: int, status: str, db: Session = Depends(get_db)):
    db_case = db.query(Case).filter(Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    if status not in ["Confirmed", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    db_case.status = status
    db.commit()
    db.refresh(db_case)
    return db_case

@router.delete("/reset")
def reset_cases(db: Session = Depends(get_db)):
    db.query(Case).delete()
    db.commit()
    return {"message": "Cases reset"}
