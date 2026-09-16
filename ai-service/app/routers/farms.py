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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    owner_id: int

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    crop: Optional[str] = None
    crop_variety: Optional[str] = None
    sowing_date: Optional[str] = None
    growth_stage: Optional[str] = None
    area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    owner_id: int

    class Config:
        from_attributes = True

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

@router.put("/{farm_id}", response_model=FarmResponse)
def update_farm(farm_id: int, farm: FarmUpdate, db: Session = Depends(get_db)):
    db_farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not db_farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    for field, value in farm.dict(exclude_unset=True).items():
        setattr(db_farm, field, value)
    db.commit()
    db.refresh(db_farm)
    return db_farm

@router.delete("/{farm_id}")
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    db_farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not db_farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    db.delete(db_farm)
    db.commit()
    return {"message": "Farm deleted successfully"}
