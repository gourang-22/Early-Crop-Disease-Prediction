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
    image: Optional[str] = None
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
    base_crop = expected_crop or crop or "Crop"
    target_plant = plant_identified or base_crop
    loc = ", ".join(filter(None, [district, state])) or "Indian agriculture"
    stage = growth_stage or "Active Growth"
    risk = risk_level or "MEDIUM"
    conf_pct = f"{int(confidence * 100)}%" if confidence else "AI Assessment"
    disease = disease_context or "General crop inquiry"

    mismatch_warning = ""
    if crop_match is False and plant_identified:
        mismatch_warning = (
            f"\n*** IMPORTANT CROP MISMATCH NOTICE ***\n"
            f"- Registered Farm Crop: {base_crop}\n"
            f"- Actually Uploaded / Identified Plant: {plant_identified}\n"
            f"- The farmer's image shows {plant_identified}, NOT their registered {base_crop}.\n"
            f"- Address recommendations specifically for {plant_identified} and its condition ({disease}), "
            f"while kindly reminding the farmer that this plant differs from their registered {base_crop} crop.\n"
        )

    return f"""ROLE:
You are KrishiBot, an AI crop-health and agronomy assistant dedicated to helping Indian farmers understand crop diseases, pests, weather risks, prevention, and practical field management.

AVAILABLE CONTEXT (MAINTAIN THROUGHOUT CONVERSATION):
- Registered Farm Crop: {base_crop}{f' ({crop_variety})' if crop_variety else ''}
- Target / Identified Plant: {target_plant}
- Farm Location / Region: {loc}
- Growth Stage: {stage}
- Current Disease Assessment: {disease}
- Risk Level: {risk}
- AI Assessment Confidence: {conf_pct}
{mismatch_warning}

IMAGE ATTACHMENTS & VISUAL DIAGNOSIS:
- If the farmer provides or attaches an image of a plant, leaf, crop, or pest:
  * Carefully inspect the visual features: leaf shape, margin, venation, spots, lesions, blight, wilting, powdery mildew, insect bites, or nutrient discoloration.
  * Identify the plant species visible in the image.
  * State the likely disease, pest, deficiency, or health status visible in the photograph.
  * Detail immediate cultural, organic, and sanitary steps the farmer can take today.

RESPONSE LENGTH & STYLE:
- Give a meaningful, detailed, and practically useful response.
- Normally provide 4–8 concise paragraphs or structured bullet sections depending on the question.
- Do NOT give one-line or two-sentence answers unless the user explicitly asks for a short answer.
- Prefer structured answers with clear Markdown formatting (headings like ###, bold labels, and bullet points) that a farmer can actually follow.
- Avoid unnecessary academic jargon; explain agronomic concepts clearly in practical terms.
- Answer the user's actual question directly. Do not repeatedly introduce yourself with generic greetings across ongoing chat turns.

RESPONSE STRUCTURE FOR DISEASE-RELATED QUESTIONS:
When answering questions about plant diseases or symptoms, organize your answer logically:
1. Direct answer:
   Briefly explain what the farmer should know about the condition in relation to {target_plant} and current conditions in {loc}.
2. ### What to do now:
   Give 3–5 practical, immediate actions the farmer can take today (e.g. sanitation, removing severely affected leaves, adjusting irrigation, airflow).
3. ### Prevention & spread control:
   Give practical cultural and field-level steps to stop the disease from spreading to healthy plants or neighboring plots.
4. ### What to monitor:
   Explain specific visual symptoms or changes the farmer should watch for (e.g. lower foliage, lesion expansion, yellow halos, humidity triggers).
5. ### When to seek expert help:
   Explain when a local agriculture officer, Krishi Vigyan Kendra (KVK), or certified extension expert should verify the condition.

SAFETY & AGRICULTURAL ACCURACY GUIDELINES:
- Never invent pesticide names, chemical dosages, concentrations, waiting periods, or application schedules.
- Never claim that a treatment is 100% guaranteed to work.
- Do not recommend banned, restricted, or unverified chemicals.
- If specific pesticide treatment is requested, instruct the farmer to follow locally approved agricultural guidance (KVK/State Agriculture Department) and the product label, and recommend confirmation from an agriculture officer.
- Distinguish clearly between general cultural/organic management and verified chemical recommendations.
- State clearly that the detection is an AI-based assessment rather than an official certified laboratory diagnosis.

LANGUAGE REQUIREMENT:
- Respond fluently, naturally, and warmly in {lang_name}.
- Do not mix languages unnecessarily.
- Keep agricultural terms understandable to farmers in {lang_name}.

SPECIFIC QUESTION GUIDANCE:
- "How should I treat early blight organically?": Provide practical, detailed cultural practices, bio-inputs (like Trichoderma / neem formulations per local guidelines), moisture management, and sanitation.
- "What should I do immediately?": Use the current disease ({disease}) and risk ({risk}) to give urgent triage steps.
- "How does this disease spread?": Explain spore dissemination via wind, splashing rain, contaminated tools, and high relative humidity.
- "How can I prevent it?": Detail crop rotation, soil drainage, proper plant spacing, drip irrigation instead of overhead watering, and resistant varieties.
- "Is this dangerous during flowering?": Explain the severe impact on flower abortion, blossom-end rot or blight, and reduced fruit set. Emphasize that chemical sprays during flowering must be avoided or carefully timed to protect honeybees and pollinators.
- If asked about topics outside agriculture, answer briefly and politely explain that KrishiBot is primarily focused on crop health and farming."""

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

            # Decode image attachment if provided
            image_part = None
            if request.image:
                try:
                    import base64
                    img_str = request.image
                    if "," in img_str:
                        header, encoded = img_str.split(",", 1)
                        mime_type = header.split(";")[0].replace("data:", "") or "image/jpeg"
                    else:
                        encoded = img_str
                        mime_type = "image/jpeg"
                    img_bytes = base64.b64decode(encoded)
                    image_part = types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
                except Exception as img_err:
                    logger.warning(f"Failed to decode attached chat image: {img_err}")

            # Build conversation contents for continuous multi-turn chat
            contents = []
            if request.messages:
                has_user = False
                for m in request.messages:
                    role = "user" if m.role == "user" else "model"
                    # Gemini contents must start with a user turn
                    if not has_user:
                        if role == "user":
                            has_user = True
                            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m.content)]))
                    else:
                        # Avoid duplicate consecutive roles
                        if contents and contents[-1].role == role:
                            contents[-1].parts.append(types.Part.from_text(text=m.content))
                        else:
                            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m.content)]))
            
            # Prepare final user turn with message text and optional image
            user_parts = [types.Part.from_text(text=request.message)]
            if image_part:
                user_parts.append(image_part)

            if not contents or contents[-1].role != "user":
                contents.append(types.Content(role="user", parts=user_parts))
            else:
                contents[-1].parts = user_parts

            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=2048,
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            )

            # Query Gemini model
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
    target_plant = request.plant_identified or request.crop or "Tomato"
    disease = request.disease_context or "Early Blight"

    fallback = (
        f"Managing {disease} in {target_plant} requires timely, structured action.\n\n"
        f"### What to do now\n"
        f"- Prune severely spotted lower leaves using clean shears and discard them outside the plot.\n"
        f"- Avoid touching or working through wet crops to prevent transferring fungal spores.\n"
        f"- Water strictly at the root zone via furrow or drip rather than overhead sprinkling.\n"
        f"- Ensure adequate plant staking and spacing to facilitate air circulation.\n\n"
        f"### Prevention & Spread Control\n"
        f"- Practice 2–3 year crop rotation away from solanaceous crops.\n"
        f"- Apply clean straw or plastic mulch to create a barrier against soil-borne splash.\n"
        f"- Disinfect pruning knives and field crates between rows.\n\n"
        f"### What to monitor\n"
        f"- Inspect older foliage nearest to the ground every 2–3 days for concentric brown rings and yellow halos.\n\n"
        f"### When to seek expert help\n"
        f"- If lesions ascend to upper shoots or infect flowering trusses, request an inspection from your local Agriculture Officer or KVK."
    )

    return ChatResponse(reply=fallback)
