import os
import requests
from dotenv import load_dotenv

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")


def calculate_weather_score(condition, category=""):
    condition = str(condition or "").lower()
    category = str(category or "").lower()

    outdoor = any(
        word in category
        for word in [
            "beach",
            "waterfall",
            "nature",
            "wildlife",
            "park",
            "garden",
            "bodies of water",
        ]
    )

    if condition in ["thunderstorm", "storm"]:
        return 30 if outdoor else 55

    if condition in ["rain", "drizzle"]:
        return 45 if outdoor else 65

    if condition in ["clouds", "mist", "fog", "haze"]:
        return 65 if outdoor else 80

    if condition in ["clear", "sunny"]:
        return 95

    return 70


def get_weather_service(city, category=""):
    if not WEATHER_API_KEY:
        return {
            "condition": "Unknown",
            "temperature": None,
            "score": 70,
            "is_suitable": True,
            "note": "Weather API key is not configured."
        }

    city = str(city or "Colombo").strip()

    try:
        response = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={
                "q": f"{city},Sri Lanka",
                "appid": WEATHER_API_KEY,
                "units": "metric",
            },
            timeout=8,
        )

        data = response.json()

        if str(data.get("cod")) != "200":
            return {
                "condition": "Unknown",
                "temperature": None,
                "score": 70,
                "is_suitable": True,
                "note": data.get("message", "Weather unavailable.")
            }

        condition = data["weather"][0]["main"]
        temperature = data["main"]["temp"]
        score = calculate_weather_score(condition, category)

        return {
            "condition": condition,
            "temperature": temperature,
            "score": score,
            "is_suitable": score >= 60,
            "note": (
                "Weather may affect outdoor activities."
                if score < 60
                else "Weather looks suitable."
            )
        }

    except Exception as exc:
        return {
            "condition": "Unknown",
            "temperature": None,
            "score": 70,
            "is_suitable": True,
            "note": f"Weather check failed: {str(exc)}"
        }