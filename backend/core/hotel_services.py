import http.client
import json
import os
from dotenv import load_dotenv

load_dotenv()

class HotelService:
    def __init__(self):
        self.api_key = os.getenv('RAPID_API_KEY')
        self.host = os.getenv('RAPID_API_HOST')

    def get_hotels_by_coords(self, lat, lon, checkin, checkout):
        if not self.api_key:
            return []

        conn = http.client.HTTPSConnection(self.host)
        
        # Bounding Box එක (කිලෝමීටර් 20ක් පමණ)
        bbox = f"{lat-0.1}%2C{lat+0.1}%2C{lon-0.1}%2C{lon+0.1}"

        headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.host,
            'Content-Type': "application/json"
        }

        # Parameters වල එන checkin සහ checkout දින මෙතැනට සම්බන්ධ කරයි
        endpoint = (
            f"/properties/list-by-map?room_qty=1&guest_qty=1&bbox={bbox}"
            f"&arrival_date={checkin}&departure_date={checkout}"
            f"&languagecode=en-us&order_by=popularity"
        )
        
        try:
            conn.request("GET", endpoint, headers=headers)
            res = conn.getresponse()
            data = res.read()
            result = json.loads(data.decode("utf-8"))
            
            # API එකෙන් දත්ත එවන්නේ 'result' හෝ 'properties' නමින් විය හැක
            hotels_raw = []
            if isinstance(result, list):
                hotels_raw = result
            elif isinstance(result, dict):
                hotels_raw = result.get('result', result.get('properties', []))

            formatted_hotels = []
            for h in hotels_raw[:5]:
                formatted_hotels.append({
                    "hotel_name": h.get('hotel_name') or h.get('name') or "Hotel Nearby",
                    "review_score": h.get('review_score') or h.get('rating') or "N/A",
                    "price": h.get('price_breakdown', {}).get('gross_amount') or "Check Booking.com",
                    "url": h.get('url', "https://www.booking.com")
                })
            
            return formatted_hotels
        except Exception as e:
            print(f"❌ Hotel Service Error: {e}")
            return []

hotel_service = HotelService()