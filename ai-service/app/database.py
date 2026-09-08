from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.orm import sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./sih_demo.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    location = Column(String)
    language = Column(String, default="en-IN")
    password = Column(String) # Mocked for prototype
    is_officer = Column(Boolean, default=False)
    farms = relationship("Farm", back_populates="owner")

class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    village = Column(String)
    district = Column(String)
    state = Column(String)
    crop = Column(String)
    crop_variety = Column(String)
    sowing_date = Column(String)
    growth_stage = Column(String)
    area = Column(String)
    owner = relationship("User", back_populates="farms")
    cases = relationship("Case", back_populates="farm")
    alerts = relationship("Alert", back_populates="farm")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    title = Column(String)
    message = Column(String)
    severity = Column(String) # HIGH, MEDIUM, LOW
    date = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)
    farm = relationship("Farm", back_populates="alerts")

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True) # Optional for now
    village = Column(String, index=True)
    crop = Column(String)
    disease = Column(String)
    confidence = Column(Float)
    risk_level = Column(String)
    status = Column(String, default="Suspected") # Suspected, Confirmed, Rejected
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    farm = relationship("Farm", back_populates="cases")

def seed_db():
    db = SessionLocal()
    if db.query(User).first() is None:
        print("Seeding database...")
        # Seed Farmer
        farmer = User(name="Demo Farmer", phone="1234567890", location="Nashik, Maharashtra", language="en-IN", password="password123")
        officer = User(name="Agri Officer", phone="0987654321", location="Maharashtra HQ", language="en-IN", password="password123", is_officer=True)
        db.add(farmer)
        db.add(officer)
        db.commit()
        db.refresh(farmer)
        
        # Seed Farm
        farm = Farm(
            owner_id=farmer.id, name="Tomato Farm", village="Village D", district="Nashik", state="Maharashtra",
            crop="Tomato", crop_variety="Abhinav", sowing_date="2026-07-01", growth_stage="Flowering", area="2 Acres"
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)
        
        # Seed Alert
        alert = Alert(
            farm_id=farm.id, title="EARLY WARNING: High Disease Risk", 
            message="Recent rainfall and high humidity have significantly increased the disease risk for your tomato crop. We recommend inspecting your field.",
            severity="HIGH"
        )
        db.add(alert)
        db.commit()
    db.close()

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
