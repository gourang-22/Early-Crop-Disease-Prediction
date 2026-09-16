import os
import logging
import httpx
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Response schemas ─────────────────────────────────────────────────────────

class DailyWeather(BaseModel):
    date: str
    is_forecast: bool          # True = future prediction, False = past actual
    temp_max: float
    temp_min: float
    humidity_max: float
    rainfall: float            # mm
    wind_max: float            # km/h
    risk_score: int            # 0–100
    risk_level: str            # LOW / MEDIUM / HIGH

class Precaution(BaseModel):
    icon: str
    title: str
    description: str
    urgency: str               # low / medium / high

class WeatherResponse(BaseModel):
    city: Optional[str] = None
    latitude: float
    longitude: float
    current_temp: float
    current_humidity: float
    current_rainfall: float
    overall_risk: int          # 0–100, based on past 3 days avg
    overall_risk_level: str    # LOW / MEDIUM / HIGH
    days: List[DailyWeather]
    precautions: List[Precaution]
    summary: str

# ── Risk computation ─────────────────────────────────────────────────────────

def compute_risk(humidity: float, rainfall: float, temp_max: float, wind: float) -> int:
    """Compute 0–100 disease risk score from weather parameters."""
    # Humidity score (0–40): >80% is high fungal risk
    if humidity >= 90:
        h_score = 40
    elif humidity >= 80:
        h_score = int(30 + (humidity - 80) * 1.0)
    elif humidity >= 60:
        h_score = int(10 + (humidity - 60) * 1.0)
    else:
        h_score = max(0, int(humidity * 0.15))

    # Rainfall score (0–30): >30mm greatly increases splash-spread disease
    if rainfall >= 50:
        r_score = 30
    elif rainfall >= 20:
        r_score = int(15 + (rainfall - 20) * 0.5)
    elif rainfall >= 5:
        r_score = int(5 + (rainfall - 5) * 0.67)
    else:
        r_score = int(rainfall * 0.5)

    # Temperature score (0–20): 20–28°C is optimal for most fungal pathogens
    if 20 <= temp_max <= 28:
        t_score = 20
    elif 18 <= temp_max < 20 or 28 < temp_max <= 32:
        t_score = 12
    elif 15 <= temp_max < 18 or 32 < temp_max <= 36:
        t_score = 6
    else:
        t_score = 2

    # Wind score (0–10): low wind = spores linger = more risk
    if wind <= 5:
        w_score = 10
    elif wind <= 15:
        w_score = 6
    elif wind <= 30:
        w_score = 3
    else:
        w_score = 1

    return min(100, h_score + r_score + t_score + w_score)

def risk_level_label(score: int) -> str:
    if score >= 70:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    return "LOW"

# ── Precaution engine ─────────────────────────────────────────────────────────

def generate_precautions(days: List[DailyWeather], crop: Optional[str], growth_stage: Optional[str]) -> List[Precaution]:
    """Rule-based precaution generator. Enhanced by Gemini if API key is set."""
    precautions = []
    crop_name = crop or "your crop"

    # Analyse patterns
    past = [d for d in days if not d.is_forecast]
    future = [d for d in days if d.is_forecast]
    avg_humidity = sum(d.humidity_max for d in past) / max(len(past), 1)
    total_rain = sum(d.rainfall for d in past)
    avg_risk = sum(d.risk_score for d in past) / max(len(past), 1)
    forecast_rain = sum(d.rainfall for d in future)
    forecast_risk = sum(d.risk_score for d in future) / max(len(future), 1)

    # High humidity → fungal risk
    if avg_humidity >= 80:
        precautions.append(Precaution(
            icon="🍄",
            title="High Fungal Disease Risk",
            description=f"Humidity has been above 80% for the past {len(past)} days — ideal for fungal pathogens. "
                        f"Inspect {crop_name} leaves for early blight, late blight, or powdery mildew symptoms daily.",
            urgency="high"
        ))

    # Significant past rainfall → splash-borne disease
    if total_rain >= 20:
        precautions.append(Precaution(
            icon="🌧️",
            title="Post-Rain Spray Recommended",
            description=f"{total_rain:.0f}mm of rainfall recorded in the past 3 days. Splash-borne bacterial and "
                        f"fungal spores may have spread. Consider a protective copper-based or mancozeb spray on {crop_name}.",
            urgency="high" if total_rain >= 50 else "medium"
        ))

    # Forecast rain coming
    if forecast_rain >= 15:
        precautions.append(Precaution(
            icon="⛈️",
            title="Pre-Rain Preventive Action",
            description=f"Forecast shows {forecast_rain:.0f}mm of rain expected in the next 3 days. Apply a preventive "
                        f"fungicide before the rain arrives to protect {crop_name} from post-rain infection.",
            urgency="medium"
        ))

    # Optimal pathogen temperature
    hot_days = [d for d in days if 20 <= d.temp_max <= 28]
    if len(hot_days) >= 3:
        precautions.append(Precaution(
            icon="🌡️",
            title="Temperature Favours Pathogens",
            description=f"Temperatures between 20–28°C are optimal for most fungal and bacterial pathogens. "
                        f"Monitor {crop_name} closely and ensure good air circulation between plants.",
            urgency="medium"
        ))

    # Low wind → spore accumulation
    calm_days = [d for d in days if not d.is_forecast and d.wind_max <= 8]
    if len(calm_days) >= 2:
        precautions.append(Precaution(
            icon="🌬️",
            title="Improve Air Circulation",
            description=f"Low wind speeds over the past {len(calm_days)} days allow fungal spores to accumulate "
                        f"on plant surfaces. Prune lower leaves and improve spacing if possible.",
            urgency="low"
        ))

    # Flowering stage specific
    if growth_stage and "flower" in growth_stage.lower():
        precautions.append(Precaution(
            icon="🌸",
            title="Protect Flowers & Pollinators",
            description=f"{crop_name} is in the flowering stage. Avoid applying chemical sprays during peak "
                        f"pollinator hours (6AM–10AM). Schedule sprays in the evening to protect fruit set.",
            urgency="medium"
        ))

    # High forecast risk
    if forecast_risk >= 70:
        precautions.append(Precaution(
            icon="⚠️",
            title="High Risk Forecast Ahead",
            description=f"The next 3 days are predicted to have HIGH disease risk conditions. Consider scheduling "
                        f"a preventive field inspection and treatment plan immediately.",
            urgency="high"
        ))

    # Low risk — positive message
    if avg_risk < 35 and forecast_risk < 35 and not precautions:
        precautions.append(Precaution(
            icon="✅",
            title="Favourable Conditions",
            description=f"Current weather conditions pose a LOW disease risk for {crop_name}. "
                        f"Maintain regular monitoring and standard agronomic practices.",
            urgency="low"
        ))

    # General good practice always shown
    precautions.append(Precaution(
        icon="👁️",
        title="Regular Field Monitoring",
        description=f"Inspect {crop_name} plants at least twice weekly — focus on lower leaves, stem bases, "
                    f"and fruit for early disease symptoms. Early detection drastically reduces losses.",
        urgency="low"
    ))

    return precautions

# ── Gemini enhancement ────────────────────────────────────────────────────────

async def enhance_precautions_with_gemini(
    precautions: List[Precaution],
    days: List[DailyWeather],
    crop: Optional[str],
    growth_stage: Optional[str]
) -> List[Precaution]:
    """Optionally enhance precautions using Gemini if API key is set."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return precautions
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        weather_summary = "; ".join([
            f"{d.date}({'forecast' if d.is_forecast else 'actual'}): "
            f"Tmax={d.temp_max}°C, Humidity={d.humidity_max}%, Rain={d.rainfall}mm, Wind={d.wind_max}km/h, Risk={d.risk_score}%"
            for d in days
        ])

        prompt = (
            f"You are an expert agricultural advisor. Based on the following 6-day weather data, "
            f"provide 2–3 highly specific, actionable precautions for an Indian farmer growing "
            f"{crop or 'tomato'} at {growth_stage or 'vegetative'} stage.\n\n"
            f"Weather: {weather_summary}\n\n"
            f"Format each precaution as JSON: "
            f'[{{"icon": "emoji", "title": "short title", "description": "2-sentence practical advice", "urgency": "low|medium|high"}}]'
        )

        for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
            try:
                res = client.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3,
                        thinking_config=types.ThinkingConfig(thinking_budget=0)
                    )
                )
                if res.text:
                    import json, re
                    match = re.search(r'\[.*\]', res.text, re.DOTALL)
                    if match:
                        ai_items = json.loads(match.group())
                        ai_precautions = [Precaution(**item) for item in ai_items[:3]]
                        # Prepend AI-enhanced precautions to the rule-based ones
                        return ai_precautions + precautions
            except Exception as e:
                logger.warning(f"Gemini precaution enhancement failed with {model_name}: {e}")
                continue
    except Exception as e:
        logger.warning(f"Gemini enhancement skipped: {e}")
    return precautions

# ── Main endpoint ─────────────────────────────────────────────────────────────

@router.get("/", response_model=WeatherResponse)
async def get_weather(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    city: Optional[str] = None,
    crop: Optional[str] = None,
    growth_stage: Optional[str] = None
):
    """
    Fetch 3 days historical + 3 days forecast from Open-Meteo (no API key needed).
    Compute disease risk score and generate crop-specific precautions.
    """
    # Geocode city if lat/lon are missing
    if (lat is None or lon is None or (lat == 0.0 and lon == 0.0)) and city:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                geo_resp = await client.get(
                    f"https://geocoding-api.open-meteo.com/v1/search?name={httpx.URL(city).raw}&count=1&language=en&format=json"
                )
                if geo_resp.status_code == 200:
                    geo_data = geo_resp.json()
                    results = geo_data.get("results", [])
                    if results:
                        lat = results[0]["latitude"]
                        lon = results[0]["longitude"]
                        if not city:
                            city = results[0].get("name", city)
        except Exception as e:
            logger.warning(f"Geocoding failed for city '{city}': {e}")

    # Fallback to default (Mumbai, MH) if lat/lon still unresolved
    if lat is None or lon is None:
        lat, lon = 19.0760, 72.8777
        if not city:
            city = "Mumbai, Maharashtra"

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"
        f"relative_humidity_2m_max,wind_speed_10m_max"
        f"&past_days=3&forecast_days=3"
        f"&timezone=Asia%2FKolkata"
        f"&wind_speed_unit=kmh"
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo API error: {e}")
    except Exception as e:
        logger.error(f"Weather fetch failed: {e}")
        raise HTTPException(status_code=503, detail="Weather service temporarily unavailable")

    daily = data.get("daily", {})
    dates = daily.get("time", [])
    temp_max_list   = daily.get("temperature_2m_max", [])
    temp_min_list   = daily.get("temperature_2m_min", [])
    humidity_list   = daily.get("relative_humidity_2m_max", [])
    rain_list       = daily.get("precipitation_sum", [])
    wind_list       = daily.get("wind_speed_10m_max", [])

    today_str = datetime.date.today().isoformat()

    days: List[DailyWeather] = []
    for i, date_str in enumerate(dates):
        hum   = float(humidity_list[i] or 0)
        rain  = float(rain_list[i]     or 0)
        tmax  = float(temp_max_list[i] or 25)
        tmin  = float(temp_min_list[i] or 18)
        wind  = float(wind_list[i]     or 10)
        score = compute_risk(hum, rain, tmax, wind)
        is_future = date_str > today_str

        days.append(DailyWeather(
            date=date_str,
            is_forecast=is_future,
            temp_max=round(tmax, 1),
            temp_min=round(tmin, 1),
            humidity_max=round(hum, 1),
            rainfall=round(rain, 1),
            wind_max=round(wind, 1),
            risk_score=score,
            risk_level=risk_level_label(score),
        ))

    # Current conditions = today's data (or most recent past day)
    today_data = next((d for d in days if not d.is_forecast), days[0]) if days else None
    current_temp     = today_data.temp_max if today_data else 25.0
    current_humidity = today_data.humidity_max if today_data else 60.0
    current_rainfall = today_data.rainfall if today_data else 0.0

    # Overall risk from past 3 actual days
    past_days = [d for d in days if not d.is_forecast]
    overall_risk = int(sum(d.risk_score for d in past_days) / max(len(past_days), 1))
    overall_level = risk_level_label(overall_risk)

    # Generate precautions
    precautions = generate_precautions(days, crop, growth_stage)
    precautions = await enhance_precautions_with_gemini(precautions, days, crop, growth_stage)

    # Human-readable summary
    if overall_level == "HIGH":
        summary = (f"⚠️ HIGH disease risk conditions detected over the past 3 days. "
                   f"Humidity and rainfall levels are favourable for fungal and bacterial infections.")
    elif overall_level == "MEDIUM":
        summary = (f"⚡ MODERATE risk conditions. Monitor your crops closely over the next 3 days "
                   f"and consider preventive measures.")
    else:
        summary = (f"✅ LOW disease risk. Current weather conditions are relatively safe for "
                   f"{crop or 'your crops'}. Maintain standard monitoring practices.")

    return WeatherResponse(
        city=city,
        latitude=lat,
        longitude=lon,
        current_temp=current_temp,
        current_humidity=current_humidity,
        current_rainfall=current_rainfall,
        overall_risk=overall_risk,
        overall_risk_level=overall_level,
        days=days,
        precautions=precautions,
        summary=summary,
    )
