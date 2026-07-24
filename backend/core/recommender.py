import os
import numpy as np
import joblib
import requests
import json  # <--- 1. අලුතින් එකතු කළා
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

class TravelRecommender:
    def __init__(self):
        # 2. JSON ෆයිල් එකෙන් coordinates load කිරීම
        self.location_coords = self.load_locations_json()

        # Path: backend/core/recommender.py -> go up two levels to find model/
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, '..', 'model', 'travel_recommendation_model.pkl')

        print("Loading Hybrid Model Artifact...")

        try:
            model_data = joblib.load(model_path)
            
            # Debugging සඳහා (Keys මොනවාදැයි බැලීමට)
            print("Keys found in model_data:", model_data.keys())

            if model_data.get("schema_version") != 3:
                print("⚠️ Warning: Artifact schema mismatch!")

            # නිවැරදි Key එක තෝරාගැනීම සඳහා පහත logic එක භාවිතා කරන්න
            # ඔබේ Terminal එකේ පෙන්වූ Key එක අනුව මෙතැන වෙනස් කරන්න
            self.df_locations        = model_data.get("locations") or model_data.get("df_locations")
            self.location_embeddings = model_data.get("location_embeddings")
            self.df_reviews          = model_data.get("reviews") or model_data.get("df_reviews")
            self.review_embeddings   = model_data.get("review_embeddings")
            self.tfidf_vectorizer    = model_data.get("tfidf_vectorizer")
            self.tfidf_matrix        = model_data.get("tfidf_matrix")
            
            model_name = model_data.get("model_name", "sentence-transformers/all-MiniLM-L6-v2")
            self.bert_model          = SentenceTransformer(model_name)

            print("✅ Hybrid Model loaded successfully from:", model_path)

        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise e

    # ------------------------------------------
    # 3. JSON Loader Helper Function
    # ------------------------------------------
    def load_locations_json(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, 'locations.json')
            
            with open(json_path, 'r', encoding='utf-8') as f:
                coords = json.load(f)
                print("✅ Locations JSON loaded successfully!")
                return coords
        except Exception as e:
            print(f"❌ Error loading locations.json: {e}")
            return {}

    # ------------------------------------------
    # Weather Helper
    # ------------------------------------------
    # 4. මෙහිදී place_name එකත් අලුතින් යවනවා JSON එකෙන් හොයන්න
    def get_live_weather(self, place_name, city_name):
        if not WEATHER_API_KEY:
            print("❌ WEATHER_API_KEY is not set in .env")
            return "Unknown", 0

        # මුලින්ම JSON එකේ place_name (උදා: Mirissa Beach) එක තියෙනවද බලනවා. 
        # ඒක නැත්නම් city_name (උදා: Mirissa) එක තියෙනවද බලනවා.
        coords = self.location_coords.get(place_name) or self.location_coords.get(city_name)

        if coords:
            # Lat/Lon තියෙනවා නම් ඒකෙන් Weather ගන්නවා (වැරදීම් අවමයි)
            lat = coords["lat"]
            lon = coords["lon"]
            url = (
                f"http://api.openweathermap.org/data/2.5/weather"
                f"?lat={lat}&lon={lon}"
                f"&appid={WEATHER_API_KEY}"
                f"&units=metric"
            )
        else:
            # JSON එකේ නැත්නම් සාමාන්‍ය විදිහට නගරයේ නමෙන් හොයනවා (Fallback)
            url = (
                f"http://api.openweathermap.org/data/2.5/weather"
                f"?q={city_name},Sri Lanka"
                f"&appid={WEATHER_API_KEY}"
                f"&units=metric"
            )

        try:
            response = requests.get(url, timeout=5)
            data = response.json()

            # cod can be int 200 or string "200" depending on API version
            cod = data.get("cod")
            if str(cod) == "200":
                condition = data["weather"][0]["main"]
                temp      = data["main"]["temp"]
                print(f"✅ Weather for {place_name} ({city_name}): {condition}, {temp}°C")
                return condition, temp
            else:
                print(f"⚠️ Weather API error for '{place_name}': {data.get('message', 'No message')}")
                return "Unknown", 0

        except requests.exceptions.Timeout:
            print(f"⏱️ Weather API timed out for {place_name}")
            return "Unknown", 0
        except requests.exceptions.ConnectionError:
            print(f"🔌 Weather API connection error for {place_name}")
            return "Unknown", 0
        except Exception as e:
            print(f"❌ Unexpected weather error for {place_name}: {e}")
            return "Unknown", 0

    # ------------------------------------------
    # Core Recommendation Logic
    # ------------------------------------------
    def get_recommendations(self, query, top_n=5, bert_weight=0.7, tfidf_weight=0.3):
        if not query:
            return []

        # A. BERT Semantic Search
        query_vec = self.bert_model.encode([query], convert_to_numpy=True)
        norm = np.linalg.norm(query_vec, axis=1, keepdims=True)
        norm[norm == 0] = 1e-8
        query_vec = query_vec / norm
        bert_scores = np.dot(self.location_embeddings, query_vec.T).flatten()

        # B. TF-IDF Keyword Search
        query_tfidf = self.tfidf_vectorizer.transform([query])
        tfidf_scores = cosine_similarity(query_tfidf, self.tfidf_matrix).flatten()

        # C. Hybrid Score
        hybrid_scores = (bert_scores * bert_weight) + (tfidf_scores * tfidf_weight)
        top_loc_indices = hybrid_scores.argsort()[-15:][::-1]

        recommendations = []

        for idx in top_loc_indices:
            if len(recommendations) >= top_n:
                break

            loc_row    = self.df_locations.iloc[idx]
            place_name = loc_row["Location_Name"]
            city       = loc_row["Located_City"]
            match_score = min(float(hybrid_scores[idx]) * 100, 100.0)

            # මෙතනදී place_name එකත් යවනවා JSON එකෙන් හරියටම හොයාගන්න
            weather_condition, temp = self.get_live_weather(place_name, city)
            if weather_condition in ["Rain", "Thunderstorm", "Drizzle", "Snow"]:
                continue

            # Find best matching review snippet
            loc_mask = (
                (self.df_reviews["Location_Name"] == place_name) &
                (self.df_reviews["Located_City"]  == city)
            )
            loc_rev_indices = np.where(loc_mask)[0]

            best_review_snippet = "Highly rated by users."
            if len(loc_rev_indices) > 0:
                specific_rev_embeds = self.review_embeddings[loc_rev_indices]
                rev_scores   = np.dot(specific_rev_embeds, query_vec.T).flatten()
                best_rev_idx = loc_rev_indices[rev_scores.argmax()]
                full_review  = str(self.df_reviews.iloc[best_rev_idx]["Text"])
                best_review_snippet = (
                    full_review[:150] + "..." if len(full_review) > 150 else full_review
                )

            recommendations.append({
                "place_name":        place_name,
                "city":              city,
                "category":          loc_row["Location_Type"],
                "match_percentage":  round(match_score, 1),
                "weather_condition": weather_condition,
                "why_we_recommend":  best_review_snippet,
            })

        return recommendations


# -------------------------------------------------------
# Single shared instance — imported by routes.py
# -------------------------------------------------------
_recommender = None

def get_recommender():
    global _recommender

    if _recommender is None:
        _recommender = TravelRecommender()

    return _recommender