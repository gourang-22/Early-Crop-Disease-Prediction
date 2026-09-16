from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, User
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class LoginRequest(BaseModel):
    phone: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    phone: str
    location: str
    language: str
    password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    language: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    user_id: int
    old_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    location: str
    language: str
    is_officer: bool
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

@router.post("/login", response_model=UserResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == req.phone, User.password == req.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

@router.post("/register", response_model=UserResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone == req.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")
    new_user = User(
        name=req.name, phone=req.phone, location=req.location,
        language=req.language, password=req.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/profile", response_model=UserResponse)
def update_profile(user_id: int, req: ProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.name is not None:
        user.name = req.name
    if req.location is not None:
        user.location = req.location
    if req.city is not None:
        user.city = req.city
    if req.latitude is not None:
        user.latitude = req.latitude
    if req.longitude is not None:
        user.longitude = req.longitude
    if req.language is not None:
        user.language = req.language
    db.commit()
    db.refresh(user)
    return user

@router.put("/password")
def change_password(req: PasswordChangeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.password != req.old_password:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user.password = req.new_password
    db.commit()
    return {"message": "Password changed successfully"}
