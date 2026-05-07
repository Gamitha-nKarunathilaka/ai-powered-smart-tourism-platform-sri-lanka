import pickle
import os
import pandas as pd
import requests
from dotenv import load_dotenv
from sklearn.preprocessing import MinMaxScaler

# .env file එක load කරනවා
load_dotenv()

class TravelRecommender:
    
    # සියලුම locations වල coordinates
    location_coords = {
        "Abhayagiri Dagaba": {"lat": 8.3712, "lon": 80.3948},
        "Ambewela Farms": {"lat": 6.8778, "lon": 80.8122},
        "Ariyapala Mask Museum": {"lat": 6.2285, "lon": 80.0528},
        "Arugam Bay": {"lat": 6.8417, "lon": 81.8333},
        "Baker's Falls": {"lat": 6.7922, "lon": 80.7894},
        "Bentota Beach": {"lat": 6.4237, "lon": 79.9919},
        "Bluefield Tea Gardens": {"lat": 7.0210, "lon": 80.7208},
        "Brief Garden - Bevis Bawa": {"lat": 6.4572, "lon": 80.0375},
        "Bundala National Park": {"lat": 6.1833, "lon": 81.2167},
        "Ceylon Tea Museum": {"lat": 7.2650, "lon": 80.6275},
        "Colombo National Museum": {"lat": 6.9135, "lon": 79.8605},
        "Community Tsunami Museum": {"lat": 6.1667, "lon": 80.1000},
        "Dagoba of Thuparama": {"lat": 8.3547, "lon": 80.3961},
        "Dambatenne Tea Factory": {"lat": 6.7770, "lon": 80.9940},
        "Dambulla Cave Temple": {"lat": 7.8564, "lon": 80.6485},
        "Damro Labookellie Tea Centre and Tea Garden": {"lat": 7.0375, "lon": 80.7225},
        "Diyaluma Falls": {"lat": 6.7214, "lon": 81.0298},
        "Galle Fort": {"lat": 6.0271, "lon": 80.2171},
        "Gangaramaya (Vihara) Buddhist Temple": {"lat": 6.9167, "lon": 79.8583},
        "Glenloch Tea Factory": {"lat": 7.0500, "lon": 80.7167},
        "Gregory Lake": {"lat": 6.9634, "lon": 80.7844},
        "Hakgala Botanic Gardens": {"lat": 6.9248, "lon": 80.8202},
        "Halpewatte Tea Factory Tour": {"lat": 6.8833, "lon": 81.0500},
        "Handunugoda Tea Estate": {"lat": 6.0000, "lon": 80.3833},
        "Hikkaduwa Beach": {"lat": 6.1430, "lon": 80.0963},
        "Horton Plains National Park": {"lat": 6.8028, "lon": 80.8028},
        "Isurumuniya Temple": {"lat": 8.3347, "lon": 80.3900},
        "Jaffna Fort": {"lat": 9.6617, "lon": 80.0108},
        "Jaya Sri Maha Bodhi": {"lat": 8.3448, "lon": 80.3970},
        "Jethawanaramaya Stupa": {"lat": 8.3516, "lon": 80.4035},
        "Jungle Beach": {"lat": 6.0211, "lon": 80.2443},
        "Kalametiya Eco Bird Watching": {"lat": 6.0917, "lon": 80.9500},
        "Kalutara Beach": {"lat": 6.5833, "lon": 79.9500},
        "Kandy Lake": {"lat": 7.2925, "lon": 80.6417},
        "Kaudulla National Park": {"lat": 8.1667, "lon": 80.9167},
        "Kelaniya Raja Maha Vihara": {"lat": 6.9525, "lon": 79.9161},
        "Koneswaram Temple": {"lat": 8.5889, "lon": 81.2444},
        "Kumana National Park": {"lat": 6.5167, "lon": 81.7167},
        "Lipton's Seat": {"lat": 6.7792, "lon": 81.0158},
        "Lover's Leap Falls": {"lat": 6.9722, "lon": 80.7933},
        "Marble Beach": {"lat": 8.5133, "lon": 81.2167},
        "Martin Wickramasinghe Folk Museum Complex": {"lat": 5.9739, "lon": 80.4072},
        "Mihintale": {"lat": 8.3511, "lon": 80.5186},
        "Minneriya National Park": {"lat": 8.0333, "lon": 80.8500},
        "Minneriya Tusker Safaris": {"lat": 8.0300, "lon": 80.8400},
        "Mirissa Beach": {"lat": 5.9467, "lon": 80.4583},
        "Mount Lavinia Beach": {"lat": 6.8333, "lon": 79.8667},
        "Nallur Kovil": {"lat": 9.6744, "lon": 80.0300},
        "National Zoological Gardens of Sri Lanka": {"lat": 6.8500, "lon": 79.9214},
        "Negombo Beach": {"lat": 7.2167, "lon": 79.8333},
        "New Ranweli Spice Garden": {"lat": 7.3333, "lon": 80.6000},
        "Nilaveli Beach": {"lat": 8.6833, "lon": 81.1833},
        "Passikudah Beach": {"lat": 7.9333, "lon": 81.5667},
        "Pedro Tea Factory": {"lat": 6.9500, "lon": 80.8000},
        "Pigeon Island National Park": {"lat": 8.7167, "lon": 81.2000},
        "Pinnawala Elephant Orphanage": {"lat": 7.3000, "lon": 80.3833},
        "Polonnaruwa": {"lat": 7.9333, "lon": 81.0000},
        "Ramboda Waterfall": {"lat": 7.0500, "lon": 80.7000},
        "Ravana Ella Falls": {"lat": 6.8667, "lon": 81.0500},
        "Ritigala Forest Monastery": {"lat": 8.1133, "lon": 80.6556},
        "Royal Botanical Gardens": {"lat": 7.2683, "lon": 80.5967},
        "Ruwanwelisaya": {"lat": 8.3500, "lon": 80.3956},
        "Samadhi Statue": {"lat": 8.3619, "lon": 80.3997},
        "Sea Turtle Farm Galle Mahamodara": {"lat": 6.0444, "lon": 80.1989},
        "Sigiriya Museum": {"lat": 7.9514, "lon": 80.7547},
        "Sigiriya The Ancient Rock Fortress": {"lat": 7.9570, "lon": 80.7603},
        "Sinharaja Forest Reserve": {"lat": 6.4333, "lon": 80.5000},
        "St Clair's Falls": {"lat": 6.9417, "lon": 80.6278},
        "Temple of the Sacred Tooth Relic": {"lat": 7.2936, "lon": 80.6413},
        "Tissa Wewa": {"lat": 6.2833, "lon": 81.2833},
        "Twin Baths (Kuttam Pokuna)": {"lat": 8.3614, "lon": 80.4042},
        "Udawalawe National Park": {"lat": 6.4667, "lon": 80.8833},
        "Udawattekele Sanctuary": {"lat": 7.2983, "lon": 80.6425},
        "Victoria Park of Nuwara Eliya": {"lat": 6.9694, "lon": 80.7683},
        "Wilpattu National Park": {"lat": 8.4333, "lon": 80.0000},
        "World Buddhist Museum": {"lat": 7.2936, "lon": 80.6413}
    }

    def __init__(self):
        self.model_data = None
        self.df = None
        self.location_stats = None
        self.cosine_sim_matrix = None
        self.api_key = os.getenv('WEATHER_API_KEY')
        self.load_model()

    def load_model(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, '..', 'model', 'hybrid_travel_model.pkl')
            
            with open(model_path, 'rb') as f:
                self.model_data = pickle.load(f)
                self.df = self.model_data['df'].reset_index(drop=True)
                
                self.location_stats = self.model_data.get('location_stats')
                if self.location_stats is None:
                     self.location_stats = self.df.groupby(['Location_Name', 'Location_Type']).agg(
                         Average_Rating=('Rating', 'mean'),
                         Average_Sentiment=('Sentiment_Score', 'mean'),
                         Total_Reviews=('User_ID', 'count')
                     ).reset_index()
                
                self.cosine_sim_matrix = self.model_data['cosine_sim_matrix']
            print("✅ Model & Weather API System loaded!")
        except Exception as e:
            print(f"❌ Error loading model: {e}")

    def _get_weather_score(self, location_name):
        if not self.api_key:
            return 0.5, "Unknown", 0

        if location_name in self.location_coords:
            lat = self.location_coords[location_name]["lat"]
            lon = self.location_coords[location_name]["lon"]
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
        else:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={location_name},LK&appid={self.api_key}&units=metric"
        
        try:
            response = requests.get(url, timeout=5)
            data = response.json()
            if data.get("cod") == 200:
                condition = data["weather"][0]["main"]
                temp = data["main"]["temp"]
                weather_mapping = {
                    "Clear": 1.0, "Clouds": 0.8, "Drizzle": 0.4, 
                    "Rain": 0.2, "Thunderstorm": 0.0, "Mist": 0.5, "Haze": 0.5
                }
                score = weather_mapping.get(condition, 0.5)
                return score, condition, temp
            return 0.5, "Unknown", 0
        except:
            return 0.5, "Error", 0

    def get_all_locations(self):
        if self.location_stats is not None:
            return sorted(self.location_stats['Location_Name'].unique().tolist())
        return []

    def _get_similar_places(self, target_location):
        if target_location not in self.location_stats['Location_Name'].values:
            return []
        idx = self.location_stats.index[self.location_stats['Location_Name'] == target_location].tolist()[0]
        sim_scores = list(enumerate(self.cosine_sim_matrix[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_indices = [i[0] for i in sim_scores[1:6]]
        return self.location_stats.iloc[sim_indices]['Location_Name'].tolist()

    # දින ලබාගැනීම සඳහා checkin සහ checkout පරාමිතීන් මෙතැනට එකතු කළා
    def predict(self, target_location, target_month, checkin, checkout, threshold=3.5):
        if self.df is None:
            return {"error": "Model data not loaded"}

        try:
            weather_score, condition, temp = self._get_weather_score(target_location)
            
            seasonal_df = self.df[self.df['Travel_Month'] == target_month]
            seasonal_stats = seasonal_df.groupby('Location_Name').agg(
                Seasonal_Rating=('Rating', 'mean')
            ).reset_index()

            hybrid_df = pd.merge(self.location_stats, seasonal_stats, on='Location_Name', how='left').fillna(0)

            scaler = MinMaxScaler()
            hybrid_df[['Norm_R', 'Norm_S', 'Norm_Sea']] = scaler.fit_transform(
                hybrid_df[['Average_Rating', 'Average_Sentiment', 'Seasonal_Rating']]
            )

            # Hybrid Score ගණනය කිරීම
            hybrid_df['Hybrid_Score'] = (
                (hybrid_df['Norm_R'] * 0.2) + 
                (hybrid_df['Norm_S'] * 0.4) + 
                (hybrid_df['Norm_Sea'] * 0.2) + 
                (weather_score * 0.2)
            )

            location_data = hybrid_df[hybrid_df['Location_Name'] == target_location]

            if location_data.empty:
                 return {"error": f"Data not found for {target_location}"}

            target_score = round(float(location_data.iloc[0]['Hybrid_Score']), 3)
            seasonal_rating = float(location_data.iloc[0]['Seasonal_Rating'])
            is_weather_bad = weather_score < 0.3

            if seasonal_rating >= threshold and not is_weather_bad:
                coords = self.location_coords.get(target_location, {"lat": 7.8731, "lon": 80.7718})

                # Hotel Service එක හරහා dynamic දින යොදා හෝටල් ලබාගැනීම
                from core.hotel_services import hotel_service
                hotels = hotel_service.get_hotels_by_coords(
                    lat=coords['lat'], 
                    lon=coords['lon'], 
                    checkin=checkin, 
                    checkout=checkout
                )

                return {
                    "status": "Recommended",
                    "message": f"✅ {target_location} is Recommended! Weather: {condition} ({temp}°C)",
                    "target_location_score": target_score,
                    "target_data": {
                        "Location_Name": target_location,
                        "Seasonal_Rating": round(seasonal_rating, 1),
                        "Hybrid_Score": target_score,
                        "Weather": condition,
                        "Temp": temp,
                        "Hotels": hotels
                    },
                    "alternatives": []
                }
            else:
                similar = self._get_similar_places(target_location)
                best_alternatives = hybrid_df[hybrid_df['Location_Name'].isin(similar)].sort_values(by='Hybrid_Score', ascending=False)
                alts_list = best_alternatives[['Location_Name', 'Location_Type', 'Seasonal_Rating', 'Hybrid_Score']].to_dict(orient='records')
                
                for alt in alts_list:
                    alt['Hybrid_Score'] = round(float(alt['Hybrid_Score']), 3)
                    alt['Seasonal_Rating'] = round(float(alt['Seasonal_Rating']), 1)

                msg = f"⚠️ {target_location} is NOT recommended."
                if is_weather_bad:
                    msg += f" Reason: Bad weather detected ({condition})."
                else:
                    msg += " Reason: Low seasonal rating."

                return {
                    "status": "Not Recommended",
                    "message": msg,
                    "target_location_score": target_score,
                    "weather_info": {"condition": condition, "temp": temp},
                    "alternatives": alts_list
                }
                
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}

recommender_instance = TravelRecommender()