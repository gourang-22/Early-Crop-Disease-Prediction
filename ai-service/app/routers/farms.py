from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, Farm
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class FarmCreate(BaseModel):
    name: str
    village: str
    district: str
    state: str
    crop: str
    crop_variety: Optional[str] = ""
    sowing_date: Optional[str] = ""
    growth_stage: str
    area: Optional[str] = ""
    owner_id: int

class FarmResponse(BaseModel):
    id: int
    name: str
    village: str
    district: str
    state: str
    crop: str
    crop_variety: Optional[str]
    sowing_date: Optional[str]
    growth_stage: str
    area: Optional[str]
    owner_id: int

    class Config:
        orm_mode = True

@router.get("/", response_model=List[FarmResponse])
def get_farms(owner_id: int, db: Session = Depends(get_db)):
    return db.query(Farm).filter(Farm.owner_id == owner_id).all()

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

@router.post("/", response_model=FarmResponse)
def create_farm(farm: FarmCreate, db: Session = Depends(get_db)):
    new_farm = Farm(**farm.dict())
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)
    return new_farm
