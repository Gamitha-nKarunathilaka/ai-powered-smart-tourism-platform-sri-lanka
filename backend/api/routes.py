from flask import Blueprint, request, jsonify
from core.recommender import recommender_instance

# Blueprint එක register කරනවා
api_bp = Blueprint('api', __name__)

@api_bp.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Hybrid Travel Recommendation API is running!"})

@api_bp.route('/locations', methods=['GET'])
def get_locations():
    """Database එකේ තියෙන ඔක්කොම locations ටික ලබාදෙනවා"""
    locations = recommender_instance.get_all_locations()
    if locations:
        return jsonify({"locations": locations})
    return jsonify({"error": "Failed to retrieve locations. Model might not be loaded."}), 500

@api_bp.route('/recommend', methods=['POST'])
def recommend():
    """Location, Month සහ Dates ලබාගෙන recommendations ලබාදෙනවා"""
    data = request.get_json()
    
    # 1. මූලික Validation
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
        
    if 'location' not in data:
        return jsonify({"error": "Please provide a 'location' in the JSON body"}), 400
        
    if 'month' not in data:
        return jsonify({"error": "Please provide a 'month' (1-12) in the JSON body"}), 400
    
    location_name = data['location']
    
    # 2. Month එක පරීක්ෂා කිරීම
    try:
        target_month = int(data['month']) 
        if target_month < 1 or target_month > 12:
            return jsonify({"error": "Month must be between 1 and 12"}), 400
    except ValueError:
         return jsonify({"error": "'month' must be a valid number"}), 400

    # 3. Dynamic Dates ලබාගැනීම (Check-in සහ Check-out)
    # යූසර් දින එවලා නැත්නම් විතරක් fallback එකක් විදිහට default dates පාවිච්චි කරනවා
    checkin = data.get('checkin', '2026-06-15')
    checkout = data.get('checkout', '2026-06-16')
    
    # 4. Recommender එකට දත්ත යවනවා (දැන් parameters 4ක් පාස් කරනවා)
    results = recommender_instance.predict(
        target_location=location_name, 
        target_month=target_month, 
        checkin=checkin, 
        checkout=checkout
    )
    
    if "error" in results:
        return jsonify(results), 404
        
    return jsonify(results)