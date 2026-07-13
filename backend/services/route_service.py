import os
import sys
import math
from functools import lru_cache

try:
    import requests
except ImportError:  # pragma: no cover - environment fallback
    requests = None

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - environment fallback
    def load_dotenv(*args, **kwargs):
        return False

load_dotenv()

ORS_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")
ORS_BASE_URL = os.getenv("ORS_BASE_URL", "https://api.heigit.org/ors/v2")


@lru_cache(maxsize=50)
def get_location_coords(name):
    """
    Open-Meteo Geocoding API හරහා ස්ථානයක අක්ෂාංශ/දේශාංශ ලබාගනී.
    """
    if requests is None:
        return 6.9271, 79.8612

    try:
        response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": f"{name}, Sri Lanka", "count": 1},
            timeout=5,
        )
        data = response.json()

        if "results" in data and len(data["results"]) > 0:
            res = data["results"][0]
            return float(res["latitude"]), float(res["longitude"])
    except Exception as e:
        # NOTE: this server runs under MCP stdio transport, where stdout
        # is reserved for JSON-RPC protocol messages. A plain print()
        # here would corrupt the stream and surface as "Connection
        # closed" on the client side, so errors go to stderr instead.
        print(f"Geocoding error for {name}: {e}", file=sys.stderr)

    # Fallback: Colombo coordinates, so downstream route math still runs
    # instead of crashing when a location can't be resolved.
    return 6.9271, 79.8612


def haversine_km(lat1, lng1, lat2, lng2):
    radius = 6371.0

    lat1, lng1, lat2, lng2 = map(
        math.radians,
        [lat1, lng1, lat2, lng2]
    )

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlng / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return radius * c


def normalize_transport_profile(transport_type):
    value = str(transport_type or "car").lower()

    if value in ["car", "driving", "driving-car"]:
        return "driving-car"

    if value in ["walking", "foot", "foot-walking"]:
        return "foot-walking"

    if value in ["cycling", "bike", "cycling-regular"]:
        return "cycling-regular"

    return "driving-car"


def approximate_hours(distance_km, transport_type):
    profile = normalize_transport_profile(transport_type)

    if profile == "foot-walking":
        speed = 4.0
    elif profile == "cycling-regular":
        speed = 16.0
    else:
        speed = 45.0

    return distance_km / speed


def get_ors_route(route_points, transport_type):
    """
    route_points: [{"lat": ..., "lng": ...}, ...]
    """

    if requests is None or not ORS_API_KEY or len(route_points) < 2:
        return None

    profile = normalize_transport_profile(transport_type)

    url = f"{ORS_BASE_URL}/directions/{profile}/geojson"

    coordinates = [
        [float(point["lng"]), float(point["lat"])]
        for point in route_points
    ]

    try:
        response = requests.post(
            url,
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "coordinates": coordinates,
                "instructions": False,
            },
            timeout=20,
        )

        if response.status_code >= 400:
            return None

        data = response.json()

        feature = data["features"][0]
        summary = feature["properties"]["summary"]

        route_coordinates = [
            [lat, lng]
            for lng, lat in feature["geometry"]["coordinates"]
        ]

        return {
            "route_coordinates": route_coordinates,
            "distance_km": summary["distance"] / 1000,
            "duration_hours": summary["duration"] / 3600,
            "source": "openrouteservice"
        }

    except Exception as e:
        print(f"OpenRouteService error: {e}", file=sys.stderr)
        return None


def optimize_route_service(
    start_location,
    end_location,
    candidate_places,
    days=3,
    daily_max_travel_hours=6,
    transport_type="car"
):
    start_lat, start_lng = get_location_coords(start_location)
    end_lat, end_lng = get_location_coords(end_location)

    valid_places = [
        place for place in candidate_places
        if place.get("lat") is not None and place.get("lng") is not None
    ]

    max_total_hours = float(days) * float(daily_max_travel_hours)
    max_places = max(1, int(days) * 3)

    selected = []
    remaining = valid_places[:]

    current_lat, current_lng = start_lat, start_lng
    estimated_hours = 0.0

    while remaining and len(selected) < max_places:
        best_place = None
        best_value = -1

        for place in remaining:
            distance_km = haversine_km(
                current_lat,
                current_lng,
                float(place["lat"]),
                float(place["lng"])
            )

            travel_hours = approximate_hours(distance_km, transport_type)

            back_home_km = haversine_km(
                float(place["lat"]),
                float(place["lng"]),
                end_lat,
                end_lng
            )

            back_home_hours = approximate_hours(back_home_km, transport_type)

            if estimated_hours + travel_hours + back_home_hours > max_total_hours:
                continue

            ml_score = float(place.get("match_percentage", 70))
            seasonality_score = float(place.get("seasonality_score", 70))
            weather_score = float((place.get("weather") or {}).get("score", 70))

            route_score = max(30, 100 - travel_hours * 8)

            agent_score = (
                ml_score * 0.50
                + seasonality_score * 0.20
                + weather_score * 0.15
                + route_score * 0.15
            )

            value = agent_score / (travel_hours + 0.75)

            if value > best_value:
                best_value = value
                best_place = {
                    "place": place,
                    "distance_km": distance_km,
                    "travel_hours": travel_hours,
                    "agent_score": agent_score,
                    "route_score": route_score
                }

        if best_place is None:
            if not selected and remaining:
                place = remaining[0]
                distance_km = haversine_km(
                    current_lat,
                    current_lng,
                    float(place["lat"]),
                    float(place["lng"])
                )
                travel_hours = approximate_hours(distance_km, transport_type)
                best_place = {
                    "place": place,
                    "distance_km": distance_km,
                    "travel_hours": travel_hours,
                    "agent_score": float(place.get("match_percentage", 70)),
                    "route_score": 100 - travel_hours * 8,
                }
            else:
                break

        place = best_place["place"]
        place["agent_score"] = round(best_place["agent_score"], 1)
        place["route_score"] = round(best_place["route_score"], 1)
        place["distance"] = f"{round(best_place['distance_km'], 1)} km"
        place["duration"] = f"{round(best_place['travel_hours'], 1)}h"

        selected.append(place)
        remaining.remove(place)

        estimated_hours += best_place["travel_hours"]
        current_lat = float(place["lat"])
        current_lng = float(place["lng"])

    for index, place in enumerate(selected):
        place["day"] = min(index + 1, int(days))

    route_points = [
        {
            "name": start_location,
            "lat": start_lat,
            "lng": start_lng
        },
        *[
            {
                "name": place["place_name"],
                "lat": place["lat"],
                "lng": place["lng"]
            }
            for place in selected
        ],
        {
            "name": end_location,
            "lat": end_lat,
            "lng": end_lng
        }
    ]

    ors_result = get_ors_route(route_points, transport_type)

    if ors_result:
        route_coordinates = ors_result["route_coordinates"]
        total_distance_km = round(ors_result["distance_km"], 1)
        total_duration_hours = round(ors_result["duration_hours"], 1)
        route_source = "openrouteservice"
    else:
        route_coordinates = [
            [point["lat"], point["lng"]]
            for point in route_points
        ]

        total_distance_km = 0

        for i in range(len(route_points) - 1):
            total_distance_km += haversine_km(
                route_points[i]["lat"],
                route_points[i]["lng"],
                route_points[i + 1]["lat"],
                route_points[i + 1]["lng"]
            )

        total_distance_km = round(total_distance_km, 1)
        total_duration_hours = round(
            approximate_hours(total_distance_km, transport_type),
            1
        )
        route_source = "haversine_estimate"

    day_plan = build_day_plan(
        selected_places=selected,
        days=days,
        start_location=start_location,
        end_location=end_location
    )

    return {
        "selected_places": selected,
        "excluded_places": [
            {
                "place_name": place.get("place_name"),
                "reason": "Not selected due to route/time constraints or lower combined score."
            }
            for place in remaining[:10]
        ],
        "route_order": route_points,
        "route_coordinates": route_coordinates,
        "route_info": {
            "total_distance_km": total_distance_km,
            "total_distance_text": f"{total_distance_km} km",
            "total_duration_hours": total_duration_hours,
            "total_duration_text": f"{total_duration_hours}h",
            "source": route_source,
            "selected_place_count": len(selected),
            "max_total_travel_hours": max_total_hours
        },
        "day_plan": day_plan
    }


def build_day_plan(selected_places, days, start_location, end_location):
    if not selected_places:
        return []

    days = int(days)
    places_per_day = max(1, round(len(selected_places) / days + 0.499))

    day_plan = []
    cursor = 0

    for day in range(1, days + 1):
        group = selected_places[cursor: cursor + places_per_day]
        cursor += places_per_day

        if not group:
            continue

        place_names = [place["place_name"] for place in group]

        if day == 1:
            route = f"{start_location} → " + " → ".join(place_names)
        elif day == days:
            route = " → ".join(place_names) + f" → {end_location}"
        else:
            route = " → ".join(place_names)

        day_plan.append({
            "day": day,
            "places": place_names,
            "route": route,
            "note": "Places are grouped based on route order and available travel days."
        })

    return day_plan