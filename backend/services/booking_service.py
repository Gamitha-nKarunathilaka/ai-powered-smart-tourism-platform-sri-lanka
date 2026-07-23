import os
import requests
from dotenv import load_dotenv

load_dotenv()

BOOKING_API_KEY = os.getenv("RAPID_API_KEY")
BOOKING_API_HOST = os.getenv("RAPID_API_HOST", "apidojo-booking-v1.p.rapidapi.com")

def search_booking_accommodations(destination, checkin_date, checkout_date, adults=2, rooms=1, limit=2):
    fallback_url = f"https://www.booking.com/searchresults.html?ss={destination}"
    
    if not BOOKING_API_KEY:
        return {"source": "no_api_key", "hotels": [], "booking_url": fallback_url}
        
    headers = {
        "X-RapidAPI-Key": BOOKING_API_KEY,
        "X-RapidAPI-Host": BOOKING_API_HOST
    }
    
    try:
        # 1. ApiDojo සෙවුම් රටාවට අනුව Destination ID එක සොයාගැනීම
        loc_url = f"https://{BOOKING_API_HOST}/locations/auto-complete"
        loc_params = {"text": destination, "languagecode": "en-us"}
        
        loc_res = requests.get(loc_url, headers=headers, params=loc_params, timeout=8).json()
        
        if not loc_res or not isinstance(loc_res, list):
            return {"source": "no_location_found", "hotels": [], "booking_url": fallback_url}
            
        dest_id = loc_res[0].get("dest_id")
        dest_type = loc_res[0].get("dest_type")
        
        # 2. හෝටල් සහ මිල ගණන් සෙවීම
        search_url = f"https://{BOOKING_API_HOST}/properties/list"
        search_params = {
            "offset": "0",
            "arrival_date": checkin_date,
            "departure_date": checkout_date,
            "guest_qty": str(adults),
            "room_qty": str(rooms),
            "dest_ids": dest_id,
            "search_type": dest_type,
            "price_filter_currencycode": "LKR"
        }
        
        hotels_res = requests.get(search_url, headers=headers, params=search_params, timeout=8).json()
        
        hotels = []
        # ApiDojo ප්‍රතිචාර ව්‍යුහය (Response Structure) අනුව දත්ත පෙළගැස්වීම
        for h in hotels_res.get('result', [])[:limit]:
            hotels.append({
                "hotel_name": h.get('hotel_name'),
                "price": f"LKR {h.get('min_total_price', 'N/A')}",
                "review_score": h.get('review_score', 'N/A'),
                "url": h.get('url', fallback_url),
                # පින්තූරය මෙතැනින් ලබා ගනී 👇
                "image_url": h.get('main_photo_url') or h.get('max_photo_url') or ""
            })
            
        return {
            "source": "booking_api_success",
            "destination": destination,
            "booking_url": fallback_url,
            "hotels": hotels
        }
        
    except Exception as exc:
        return {
            "source": "booking_api_exception",
            "destination": destination,
            "message": str(exc),
            "booking_url": fallback_url,
            "hotels": []
        }