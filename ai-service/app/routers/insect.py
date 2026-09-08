from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.insect_classifier import InsectClassifier
from PIL import Image
import io

router = APIRouter()
classifier = InsectClassifier()

@router.post("/insect")
async def predict_insect(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image")

    result = classifier.predict(image)
    return result