import os
import re
from functools import lru_cache

try:
    import joblib
except ImportError:  
    joblib = None

try:
    import numpy as np
except ImportError:  
    np = None

try:
    import requests
except ImportError:  
    requests = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError:  
    SentenceTransformer = None

try:
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:  
    cosine_similarity = None

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "model",
    "travel_recommendation_model.pkl"
)

FALLBACK_DESTINATIONS = [
    {
        "place_name": "Mirissa Beach",
        "city": "Mirissa",
        "location": "Southern Province",
        "category": "Beaches",
        "lat": 5.9483,
        "lng": 80.4550,
        "why_we_recommend": "A scenic coastal escape with calm waters and strong beach appeal.",
    },
    {
        "place_name": "Arugam Bay",
        "city": "Arugam Bay",
        "location": "Eastern Province",
        "category": "Beaches",
        "lat": 6.8404,
        "lng": 81.8368,
        "why_we_recommend": "Popular for surf, laid-back beaches and an easygoing coastal vibe.",
    },
    {
        "place_name": "Ella",
        "city": "Ella",
        "location": "Uva Province",
        "category": "Nature & Wildlife Areas",
        "lat": 6.8667,
        "lng": 81.0466,
        "why_we_recommend": "Known for mountain views, hiking trails and dramatic scenery.",
    },
    {
        "place_name": "Sigiriya Rock Fortress",
        "city": "Sigiriya",
        "location": "Central Province",
        "category": "Historic Sites",
        "lat": 7.9570,
        "lng": 80.7603,
        "why_we_recommend": "A cultural landmark with ancient architecture and impressive views.",
    },
    {
        "place_name": "Kandy",
        "city": "Kandy",
        "location": "Central Province",
        "category": "Religious Sites",
        "lat": 7.2906,
        "lng": 80.6337,
        "why_we_recommend": "A heritage-rich city known for temples, gardens and cultural experiences.",
    },
    {
        "place_name": "Nuwara Eliya",
        "city": "Nuwara Eliya",
        "location": "Central Province",
        "category": "Farms",
        "lat": 6.9497,
        "lng": 80.7891,
        "why_we_recommend": "Cool hill country scenery with tea estates and misty landscapes.",
    },
]


class TravelRecommenderService:
    def __init__(self):
        self.fallback_mode = False

        if joblib is None or np is None or SentenceTransformer is None or cosine_similarity is None:
            self.fallback_mode = True
            return

        if not os.path.exists(MODEL_PATH):
            self.fallback_mode = True
            return

        try:
            model_data = joblib.load(MODEL_PATH)
            self.locations = model_data["location_df"].reset_index(drop=True)
            self.reviews = model_data["df_clean"].reset_index(drop=True)

            self.location_embeddings = self.normalize_embeddings(
                model_data["location_embeddings"]
            )
            self.review_embeddings = self.normalize_embeddings(
                model_data["review_embeddings"]
            )

            self.tfidf_vectorizer = model_data["tfidf_vectorizer"]
            self.tfidf_matrix = model_data["tfidf_matrix"]

            self.category_names = model_data["category_names"]
            self.category_embeddings = self.normalize_embeddings(
                model_data["category_embeddings"]
            )
            self.category_vectorizer = model_data["category_vectorizer"]
            self.category_tfidf_matrix = model_data["category_tfidf_matrix"]

            self.model_name = model_data.get(
                "bert_model_name",
                "sentence-transformers/all-MiniLM-L6-v2"
            )

            self.bert_model = SentenceTransformer(self.model_name)
        except Exception as exc:  
            import sys
            print(f"Falling back to built-in recommendations: {exc}", file=sys.stderr)
            self.fallback_mode = True



    def normalize_embeddings(self, embeddings):
        embeddings = np.asarray(embeddings, dtype=np.float32)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1e-8
        return embeddings / norms

    def normalize_scores(self, scores):
        scores = np.asarray(scores, dtype=np.float32)
        min_score = scores.min()
        max_score = scores.max()

        if max_score - min_score == 0:
            return np.zeros_like(scores)

        return (scores - min_score) / (max_score - min_score)



    def detect_preferred_categories_hybrid(self, query, top_k=2, threshold=0.28):
        """
        Detect preferred travel categories using:
        1. BERT semantic similarity
        2. TF-IDF keyword similarity
        """
        if not query or not str(query).strip():
            return []

        query = str(query).strip()

        # BERT semantic category score
        query_vec = self.bert_model.encode([query], convert_to_numpy=True)
        query_vec = self.normalize_embeddings(query_vec)
        semantic_scores = np.dot(self.category_embeddings, query_vec.T).flatten()

        # TF-IDF keyword category score
        query_tfidf = self.category_vectorizer.transform([query])
        keyword_scores = cosine_similarity(query_tfidf, self.category_tfidf_matrix).flatten()

        # Hybrid category score
        category_scores = (
            semantic_scores * 0.60
            + keyword_scores * 0.40
        )

        ranked_indices = category_scores.argsort()[::-1]

        detected_categories = []
        for idx in ranked_indices[:top_k]:
            score = float(category_scores[idx])
            if score >= threshold:
                detected_categories.append({
                    "category": self.category_names[idx],
                    "score": round(score, 3),
                    "semantic_score": round(float(semantic_scores[idx]), 3),
                    "keyword_score": round(float(keyword_scores[idx]), 3)
                })

        return detected_categories

  
    def get_best_review_snippet(self, place_name, city_name, query_vec):
        """
        Find the most relevant review snippet for the recommended place.
        """
        loc_mask = (
            (self.reviews["Location_Name"] == place_name) &
            (self.reviews["Located_City"] == city_name)
        )
        review_indices = np.where(loc_mask)[0]

        if len(review_indices) == 0:
            return "Highly rated by users."

        selected_review_embeddings = self.review_embeddings[review_indices]
        review_scores = np.dot(
            selected_review_embeddings,
            query_vec.T
        ).flatten()

        best_review_idx = review_indices[review_scores.argmax()]
        full_review = str(self.reviews.iloc[best_review_idx]["Text"])

        if len(full_review) > 180:
            return full_review[:180] + "..."
        return full_review

   
    @lru_cache(maxsize=100)
    def get_coords(self, place_name, city):
        """
        Geocoding API හරහා අක්ෂාංශ/දේශාංශ ලබාගනී.

        FASTEST PATH: if the model .pkl was built with precomputed
        "lat"/"lng" columns on location_df (see the notebook's
        "precompute coordinates" cell), those are used directly — zero
        network calls at request time, for all 76 known locations.
        This only falls through to the live API for places missing
        precomputed coordinates (e.g. an older pkl without that step).

        NOTE: previously this built the URL with an f-string containing
        unescaped spaces/commas (e.g. "Mirissa Beach, Mirissa, Sri Lanka"),
        which either failed the request outright or didn't match anything
        in Open-Meteo's fuzzy name search, so every call fell through to
        the except block and returned (None, None). requests' `params=`
        handles URL-encoding automatically, and a simpler fallback query
        (place_name alone) is tried if the compound query finds nothing.
        """
        precomputed = self._precomputed_coords(place_name, city)
        if precomputed is not None:
            return precomputed

        if requests is None:
            return None, None

      
        coords = self._geocode_query(f"{place_name}, {city}, Sri Lanka")
        if coords != (None, None):
            return coords

     
        coords = self._geocode_query(f"{place_name}, Sri Lanka")
        if coords != (None, None):
            return coords

    
        return self._geocode_query(f"{city}, Sri Lanka")

    def _precomputed_coords(self, place_name, city):
        """
        Looks up precomputed coordinates from self.locations, if the
        DataFrame has "lat"/"lng" columns (added by the notebook's
        one-time geocoding step). Returns (lat, lng) or None if either
        the columns don't exist or the specific row has no value.
        """
        if "lat" not in self.locations.columns or "lng" not in self.locations.columns:
            return None

        match = self.locations[
            (self.locations["Location_Name"] == place_name) &
            (self.locations["Located_City"] == city)
        ]

        if match.empty:
            return None

        row = match.iloc[0]
        lat, lng = row.get("lat"), row.get("lng")

        if lat is None or lng is None or (isinstance(lat, float) and np.isnan(lat)):
            return None

        return float(lat), float(lng)

    def _geocode_query(self, query):
        try:
            response = requests.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": query, "count": 1},
                timeout=5,
            )
            data = response.json()

            if "results" in data and len(data["results"]) > 0:
                result = data["results"][0]
                return float(result["latitude"]), float(result["longitude"])
        except Exception as e:
          
            import sys
            print(f"Geocoding error for '{query}': {e}", file=sys.stderr)

        return None, None

  

    def _fallback_recommendations(self, query, top_n=10):
        query = str(query or "").lower()
        scored = []

        for item in FALLBACK_DESTINATIONS:
            score = 70
            category = str(item.get("category", "")).lower()
            place_name = str(item.get("place_name", "")).lower()

            if any(keyword in query for keyword in ["surf", "beach", "sea", "coast"]):
                if "beach" in category or "beach" in place_name:
                    score += 18
            if any(keyword in query for keyword in ["hike", "mountain", "trek", "nature"]):
                if "nature" in category or "historic" in category or "farm" in category:
                    score += 8
            if any(keyword in query for keyword in ["culture", "heritage", "temple", "historic"]):
                if "historic" in category or "religious" in category:
                    score += 16
            if any(keyword in query for keyword in ["wildlife", "safari", "park"]):
                if "wildlife" in category or "nature" in category:
                    score += 12
            if any(keyword in query for keyword in ["sun", "relax", "holiday"]):
                if "beach" in category:
                    score += 10

            scored.append({
                **item,
                "match_percentage": round(min(99, score), 1),
            })

        scored.sort(key=lambda item: item["match_percentage"], reverse=True)
        return scored[:max(1, int(top_n))]


    def get_recommendations(
        self,
        query,
        top_n=10,
        travel_date=None,
        include_weather=False,
        bert_weight=0.40,
        tfidf_weight=0.30,
        quality_weight=0.10,
        category_weight=0.20
    ):
        if self.fallback_mode:
            return self._fallback_recommendations(query, top_n)

        if not query or not str(query).strip():
            return []
        query = str(query).strip()

    
        query_vec = self.bert_model.encode([query], convert_to_numpy=True)
        query_vec = self.normalize_embeddings(query_vec)

        
        bert_scores = np.dot(self.location_embeddings, query_vec.T).flatten()
        bert_scores = self.normalize_scores(bert_scores)

        query_tfidf = self.tfidf_vectorizer.transform([query])
        tfidf_scores = cosine_similarity(query_tfidf, self.tfidf_matrix).flatten()
        tfidf_scores = self.normalize_scores(tfidf_scores)

        quality_scores = self.normalize_scores(self.locations["quality_score"].values)

     
        detected_categories = self.detect_preferred_categories_hybrid(query)
        preferred_categories = [
            item["category"] for item in detected_categories
        ]
        category_confidence = {
            item["category"]: item["score"] for item in detected_categories
        }

        category_scores = np.array([
            category_confidence.get(row_type, 0.0)
            for row_type in self.locations["Location_Type"].values
        ], dtype=np.float32)

        if len(detected_categories) > 0:
            category_scores = self.normalize_scores(category_scores)

       
        final_scores = (
            bert_scores * bert_weight +
            tfidf_scores * tfidf_weight +
            quality_scores * quality_weight +
            category_scores * category_weight
        )
        final_scores = np.clip(final_scores, 0, 1)


        if preferred_categories:
            candidate_indices = self.locations[
                self.locations["Location_Type"].isin(preferred_categories)
            ].index.values

            sorted_candidates = candidate_indices[
                np.argsort(final_scores[candidate_indices])[::-1]
            ]

            if len(sorted_candidates) < top_n:
                other_indices = np.array([
                    idx for idx in final_scores.argsort()[::-1]
                    if idx not in sorted_candidates
                ])
                top_indices = np.concatenate([
                    sorted_candidates,
                    other_indices
                ])[:top_n]
            else:
                top_indices = sorted_candidates[:top_n]
        else:
            top_indices = final_scores.argsort()[-top_n:][::-1]

        results = []
        for idx in top_indices:
            row = self.locations.iloc[idx]
            place_name = row["Location_Name"]
            city_name = row["Located_City"]

            snippet = self.get_best_review_snippet(
                place_name=place_name,
                city_name=city_name,
                query_vec=query_vec
            )

            lat, lng = self.get_coords(place_name, city_name)

            results.append({
                "place_name": place_name,
                "city": city_name,
                "location": row["Location"],
                "category": row["Location_Type"],
                "lat": lat,
                "lng": lng,
                "detected_categories": detected_categories,
                "match_percentage": round(float(final_scores[idx]) * 100, 1),
                "semantic_score": round(float(bert_scores[idx]) * 100, 1),
                "keyword_score": round(float(tfidf_scores[idx]) * 100, 1),
                "quality_score": round(float(quality_scores[idx]) * 100, 1),
                "category_score": round(float(category_scores[idx]) * 100, 1),
                "average_rating": round(float(row["avg_rating"]), 2),
                "review_count": int(row["review_count"]),
                "helpful_votes": int(row["total_helpful_votes"]),
                "why_we_recommend": snippet
            })
        return results


recommender_instance = None


def get_recommender():
    global recommender_instance

    if recommender_instance is None:
        recommender_instance = TravelRecommenderService()

    return recommender_instance


def recommend_places_service(
    query,
    top_n=10,
    travel_date=None,
    include_weather=False
):
    recommender = get_recommender()

    recommendations = recommender.get_recommendations(
        query=query,
        top_n=top_n,
        travel_date=travel_date,
        include_weather=include_weather
    )

    return {
        "query": query,
        "top_n": top_n,
        "recommendations": recommendations
    }