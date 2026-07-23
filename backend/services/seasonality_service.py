import requests
from datetime import datetime
from functools import lru_cache

from .geocode_cache import get_cached_coords, set_cached_coords


@lru_cache(maxsize=200)
def _geocode(query, timeout=5):
    """
    Open-Meteo Geocoding API call, using requests' params= for automatic
    URL-encoding (the previous version built the URL with an f-string
    containing raw spaces via "+", which is fragile for multi-word place
    names). Returns (lat, lon) or (None, None).

    Checks the shared persistent cache (hardcoded common cities +
    JSON file surviving restarts) before ever touching the network —
    the same cities repeat across many candidate places within a single
    planning request, and across separate requests over time.
    """
    cached = get_cached_coords(query)
    if cached is not None:
        return cached
    try:
        response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": query, "count": 1},
            timeout=timeout,
        )
        data = response.json()

        results = data.get("results") or []
        if len(results) > 0:
            lat, lon = results[0]["latitude"], results[0]["longitude"]
            set_cached_coords(query, lat, lon)
            return lat, lon
    except Exception:
        pass

    return None, None


def get_seasonality_service(place_name, city=None, category=None, location=None, travel_date=None):
    """
    මෙම සේවාව LLM එකක් භාවිතා නොකරයි.
    එය ස්ථානයක අදාළ මාසයේ පසුගිය වසර 10ක සාමාන්‍ය වර්ෂාපතන දත්ත (Raw Data) පමණක් ලබා දෙයි.
    Agent එක විසින් මෙම දත්ත ලබාගෙන තීරණ ගනු ඇත.
    """
    if not travel_date:
        return {"avg_rainfall_mm": 0, "score": 70, "note": "No date provided."}

    try:
        month = datetime.strptime(travel_date, "%Y-%m-%d").month
    except ValueError:
        return {"avg_rainfall_mm": 0, "score": 70, "note": f"Invalid travel_date format: {travel_date}"}

    search_query = f"{place_name}, Sri Lanka" if place_name else None
    lat, lon = (None, None)

    if search_query:
        lat, lon = _geocode(search_query)

    if lat is None and city:
        lat, lon = _geocode(f"{city}, Sri Lanka")

    if lat is None:
        return {"avg_rainfall_mm": 0, "score": 70, "note": "Location not found."}

    try:
        climate_url = (
            f"https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={lat}&longitude={lon}"
            f"&start_date=2014-{month:02d}-01&end_date=2024-{month:02d}-28"
            f"&daily=precipitation_sum&timezone=auto"
        )
        climate_res = requests.get(climate_url, timeout=8).json()
        rainfall_values = climate_res.get("daily", {}).get("precipitation_sum", []) or []

        avg_rainfall = sum(rainfall_values) / len(rainfall_values) if rainfall_values else 0

    
        score = max(40, round(100 - (avg_rainfall * 3), 1))

        return {
            "avg_rainfall_mm": round(avg_rainfall, 2),
            "month": month,
            "score": score,
            "note": (
                f"Historical daily average rainfall for "
                f"{city or place_name} in month {month} is "
                f"{round(avg_rainfall, 2)}mm."
            )
        }

    except Exception as e:
        return {"avg_rainfall_mm": 0, "score": 70, "note": f"Error: {str(e)}"}