from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.soil import SoilPredictionResponse
from app.models.soil_classifier import SoilClassifier
from PIL import Image
import io

router = APIRouter()
classifier = SoilClassifier()

@router.post("/soil", response_model=SoilPredictionResponse)
async def predict_soil(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image")

    soil_type, confidence = classifier.predict(image)

    return SoilPredictionResponse(
        soil_type=soil_type,
        confidence=round(confidence, 4),
        all_scores={cls: round(float(score), 4)
                    for cls, score in zip(classifier.classes, classifier.last_scores)}
    )