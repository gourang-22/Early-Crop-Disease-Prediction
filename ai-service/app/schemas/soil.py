from pydantic import BaseModel
from typing import Dict

class SoilPredictionResponse(BaseModel):
    soil_type: str
    confidence: float
    all_scores: Dict[str, float]