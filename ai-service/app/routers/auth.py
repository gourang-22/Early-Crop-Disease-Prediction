from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, User
from pydantic import BaseModel

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

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    location: str
    language: str
    is_officer: bool

    class Config:
        orm_mode = True

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
