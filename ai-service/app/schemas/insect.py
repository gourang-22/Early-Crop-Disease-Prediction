from pydantic import BaseModel
from typing import Dict

class InsectPredictionResponse(BaseModel):
    insect_type: str
    confidence: float
    type: str
    impact: str
    management: str
    all_scores: Dict[str, float]