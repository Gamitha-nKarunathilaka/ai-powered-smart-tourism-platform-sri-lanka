from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import joblib
import requests

# Load the env 
load_dotenv()
# Flask Setup
app = Flask(__name__)
CORS(app) # React App එකට connect වෙන්න CORS දෙනවා

WEATHER_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

# ==========================================
# 1. Load the Hybrid Model Artifact
# ==========================================
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, '..', 'model', 'travel_model_data.pkl')

print("Loading Hybrid Model Artifact...")

# 2. එකම පාරක් Load කිරීම
try:
    model_data = joblib.load(model_path)
    
    # Schema check එකක් කිරීම (වැදගත්!)
    if model_data.get("schema_version") != 3:
        print("⚠️ Warning: Artifact schema mismatch!")

    # 3. Variables Assign කිරීම
    df_locations = model_data["locations"]
    location_embeddings = model_data["location_embeddings"]
    df_reviews = model_data["reviews"]
    review_embeddings = model_data["review_embeddings"]
    tfidf_vectorizer = model_data["tfidf_vectorizer"]
    tfidf_matrix = model_data["tfidf_matrix"]
    
    # Model එක Load කිරීම
    bert_model = SentenceTransformer(model_data["model_name"])
    
    print("✅ Hybrid Model loaded successfully from:", model_path)

except Exception as e:
    print(f"❌ Error loading model: {e}")
    # Error එකක් ආවොත් මෙතනින් නවත්වන්න
    raise e

# Weather Fetching Logic
def get_live_weather(city_name):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city_name},Sri Lanka&appid={WEATHER_API_KEY}&units=metric"
    try:
        response = requests.get(url, timeout=3)
        data = response.json()
        if data["cod"] == 200:
            return data["weather"][0]["main"], data["main"]["temp"]
        return "Unknown", 0
    except Exception:
        return "Error", 0

# ==========================================
# 2. Recommendation Endpoint
# ==========================================
@app.route('/api/recommendations', methods=['POST'])
def get_smart_recommendations():
    data = request.get_json()
    query = data.get('query')
    top_n = data.get('top_n', 5)
    bert_weight = data.get('bert_weight', 0.7)
    tfidf_weight = data.get('tfidf_weight', 0.3)

    if not query:
        return jsonify({"error": "Query cannot be empty"}), 400

    # A. BERT Semantic Search
    query_vec = bert_model.encode([query], convert_to_numpy=True)
    norm = np.linalg.norm(query_vec, axis=1, keepdims=True)
    norm[norm == 0] = 1e-8
    query_vec = query_vec / norm
    bert_scores = np.dot(location_embeddings, query_vec.T).flatten()
    
    # B. TF-IDF Keyword Search
    query_tfidf = tfidf_vectorizer.transform([query])
    tfidf_scores = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
    
    # C. Calculate HYBRID SCORE
    hybrid_scores = (bert_scores * bert_weight) + (tfidf_scores * tfidf_weight)
    top_loc_indices = hybrid_scores.argsort()[-15:][::-1]
    
    recommendations = []
    
    for idx in top_loc_indices:
        if len(recommendations) >= top_n:
            break
            
        loc_row = df_locations.iloc[idx]
        place_name = loc_row["Location_Name"]
        city = loc_row["Located_City"]
        match_score = min(float(hybrid_scores[idx]) * 100, 100.0) 
        
        # Weather Logic
        weather_condition, temp = get_live_weather(city)
        if weather_condition in ["Rain", "Thunderstorm", "Drizzle"]:
            continue 
            
        # Find best matching review
        loc_mask = (df_reviews["Location_Name"] == place_name) & (df_reviews["Located_City"] == city)
        loc_rev_indices = np.where(loc_mask)[0]
        
        best_review_snippet = "Highly rated by users."
        if len(loc_rev_indices) > 0:
            specific_rev_embeds = review_embeddings[loc_rev_indices]
            rev_scores = np.dot(specific_rev_embeds, query_vec.T).flatten()
            best_rev_idx = loc_rev_indices[rev_scores.argmax()]
            full_review = str(df_reviews.iloc[best_rev_idx]["Text"])
            best_review_snippet = full_review[:150] + "..." if len(full_review) > 150 else full_review

        recommendations.append({
            "place_name": place_name,
            "city": city,
            "category": loc_row["Location_Type"],
            "match_percentage": round(match_score, 1),
            "weather_condition": weather_condition,
            "why_we_recommend": best_review_snippet
        })
        
    return jsonify({"status": "success", "results": recommendations})

if __name__ == "__main__":
    app.run(debug=True, port=8000)