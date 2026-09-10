import os
import logging
from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

LANGUAGE_NAMES = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "mr-IN": "Marathi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "kn-IN": "Kannada",
}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en-IN"
    crop: Optional[str] = None
    crop_variety: Optional[str] = None
    growth_stage: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    disease_context: Optional[str] = None
    plant_identified: Optional[str] = None
    expected_crop: Optional[str] = None
    crop_match: Optional[bool] = None
    confidence: Optional[float] = None
    risk_level: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    reply: str

def get_system_prompt(language_code: str, crop: Optional[str], crop_variety: Optional[str], 
                      growth_stage: Optional[str], district: Optional[str], state: Optional[str], 
                      disease_context: Optional[str], plant_identified: Optional[str] = None,
                      expected_crop: Optional[str] = None, crop_match: Optional[bool] = None,
                      confidence: Optional[float] = None, risk_level: Optional[str] = None) -> str:
    lang_name = LANGUAGE_NAMES.get(language_code, "English")
    
    farm_details = []
    base_crop = expected_crop or crop
    if base_crop:
        crop_str = base_crop + (f" ({crop_variety})" if crop_variety else "")
        farm_details.append(f"Registered Farm Crop: {crop_str}")
    if district or state:
        loc = ", ".join(filter(None, [district, state]))
        farm_details.append(f"Location: {loc}")
    if growth_stage:
        farm_details.append(f"Growth Stage: {growth_stage}")
    
    farm_info = ("Farmer context: " + ", ".join(farm_details) + ".") if farm_details else ""
    
    # Context regarding crop match/mismatch
    if crop_match is False and plant_identified:
        disease_info = (
            f"IMPORTANT ALERT: The farmer's registered farm crop is {base_crop}, but the uploaded scan image was identified as a DIFFERENT plant: '{plant_identified}'. "
            f"Likely disease assessed on this {plant_identified} is '{disease_context or 'Unknown'}' (Risk: {risk_level or 'MEDIUM'}, AI Confidence: {int((confidence or 0)*100)}%). "
            f"Acknowledge that they uploaded {plant_identified}, provide practical management advice for {disease_context} in {plant_identified}, "
            f"and kindly remind them to upload their {base_crop} crop for farm-level diagnosis."
        )
    elif disease_context:
        disease_info = f"Recent disease detected on plant: {disease_context} ({risk_level or ''} risk). Provide integrated pest management guidance tailored to this."
    else:
        disease_info = ""

    return (
        f"You are KrishiBot, a friendly and knowledgeable crop health assistant for Indian farmers.\n"
        f"IMPORTANT: Respond ONLY in {lang_name} language. Every word must be in {lang_name}.\n"
        f"Be concise — 2-4 sentences max. Be practical, empathetic, and specific to Indian agriculture.\n"
        f"Topics: crop diseases, soil nutrients, fertilizers, biological & chemical pest control, irrigation, weather, crop varieties, storage, market guidance.\n"
        f"{farm_info}\n{disease_info}\n"
        f"If asked about topics completely unrelated to agriculture or rural life, politely redirect back to farming."
    )

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")

    if api_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            system_prompt = get_system_prompt(
                language_code=request.language or "en-IN",
                crop=request.crop,
                crop_variety=request.crop_variety,
                growth_stage=request.growth_stage,
                district=request.district,
                state=request.state,
                disease_context=request.disease_context,
                plant_identified=request.plant_identified,
                expected_crop=request.expected_crop,
                crop_match=request.crop_match,
                confidence=request.confidence,
                risk_level=request.risk_level,
            )

            # Build conversation contents
            contents = []
            if request.messages:
                for m in request.messages:
                    role = "user" if m.role == "user" else "model"
                    contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m.content)]))
            
            # Ensure current message is included if not already at end of messages
            if not request.messages or request.messages[-1].content != request.message:
                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=request.message)]))

            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=1000,
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            )

            # Attempt with gemini-2.5-flash, fallback to gemini-2.0-flash / gemini-1.5-flash if needed
            for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config
                    )
                    if response.text:
                        return ChatResponse(reply=response.text.strip())
                except Exception as model_err:
                    logger.warning(f"Failed with {model_name}: {model_err}")
                    continue

        except Exception as e:
            logger.error(f"Error calling Gemini API for chat: {e}", exc_info=True)

    # Fallback demo response if GEMINI_API_KEY is not set or failed
    lang = request.language or "en-IN"
    target_plant = request.plant_identified or request.crop or "crop"
    if request.crop_match is False and request.plant_identified and request.expected_crop:
        fallback = f"Namaste! I notice you shared an image of {request.plant_identified}, while your active farm is {request.expected_crop}. For {request.disease_context or 'this issue'} in {request.plant_identified}, use recommended cultural practices and appropriate spray, and remember to scan your {request.expected_crop} when needed."
    elif lang.startswith("hi"):
        fallback = f"नमस्ते! आपके {target_plant} के स्वास्थ्य के लिए, नियमित रूप से पत्तियों की जांच करें और उचित जल निकासी व जैविक खाद का उपयोग करें। यदि रोग के लक्षण बढ़ें तो कृषि विशेषज्ञ से संपर्क करें।"
    elif lang.startswith("mr"):
        fallback = f"नमस्कार! आपल्या {target_plant} पिकासाठी योग्य पाणी व्यवस्थापन आणि सेंद्रिय खतांचा वापर करा. रोगनियंत्रणासाठी कृषी तज्ज्ञांचा सल्ला घ्या."
    else:
        fallback = f"Namaste! For optimal {target_plant} health, ensure balanced fertilization, maintain proper field drainage, and inspect foliage early in the morning for pest or fungal onset."

    return ChatResponse(reply=fallback)
