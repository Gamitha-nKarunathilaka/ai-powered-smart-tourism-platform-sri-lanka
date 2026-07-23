import asyncio, json, time
import os

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - environment fallback
    def load_dotenv(*args, **kwargs):
        return False

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - environment fallback
    genai = None

from mcp_client import MCPTravelClient

load_dotenv()


_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    print("Warning: GEMINI_API_KEY is not set. Agent calls will fail until configured.")
elif genai is not None:
    try:
        genai.configure(api_key=_api_key)
    except Exception as e:
      
        print("Error configuring Google Generative AI client:", str(e))


tools = [
    {
        "name": "select_feasible_places",
        "description": (
            "Given candidate places with seasonality and weather data, "
            "select which places are actually worth visiting and can "
            "realistically be covered within the traveler's available days."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selected_place_names": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "excluded_place_names": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "reasoning": {"type": "string"}
            },
            "required": ["selected_place_names", "excluded_place_names", "reasoning"]
        }
    }
]


model = None
if genai is not None:
    try:
        model = genai.GenerativeModel(
            "gemini-3.1-flash-lite",  
            tools=[{"function_declarations": tools}]
        )
    except Exception as e:
        print("Warning: failed to initialize GenAI model:", str(e))
else:
    print("Warning: google.generativeai is not installed; using deterministic fallback planning.")


MIN_PLACES_PER_DAY = 1
MAX_PLACES_PER_DAY = 2


class TravelAgent:

    def create_plan(self, query, start_location="Colombo", end_location="Colombo",
                     travel_date=None, days=3, top_n=15, travelers=2,
                     transport_type="car", daily_max_travel_hours=6,
                     include_weather=True, travel_style="Solo",
                     include_accommodation=True):
        return asyncio.run(self._create_plan_async(
            query, start_location, end_location, travel_date, days, top_n,
            travelers, transport_type, daily_max_travel_hours,
            include_weather, travel_style, include_accommodation
        ))

    async def _enrich_place(self, mcp, place, travel_date, include_weather):
        """
        Fetch seasonality (and optionally weather) for a single place.
        These two calls don't depend on each other, so they run
        concurrently via asyncio.gather instead of two sequential awaits.
        """
        seasonality_task = mcp.call_tool(
            "get_seasonality",
            {"place_name": place.get("place_name"),
             "city": place.get("city"),
             "category": place.get("category"),
             "location": place.get("location"),
             "travel_date": travel_date}
        )

        if include_weather:
            weather_task = mcp.call_tool(
                "get_weather",
                {"city": place.get("city"), "category": place.get("category")}
            )
            seasonality, weather = await asyncio.gather(seasonality_task, weather_task)
        else:
            seasonality = await seasonality_task
            weather = None

        place["seasonality_score"] = seasonality.get("score", 70)
        place["seasonality_note"] = seasonality.get("note")
        place["weather"] = weather

        return place

    async def _create_plan_async(self, query, start_location, end_location,
                                  travel_date, days, top_n, travelers,
                                  transport_type, daily_max_travel_hours,
                                  include_weather, travel_style,
                                  include_accommodation):

        _plan_start = time.time()

        effective_top_n = max(top_n, days * 5)

        async with MCPTravelClient() as mcp:

          
            _t0 = time.time()
            recommendation_result = await mcp.call_tool(
                "recommend_places",
                {"query": query, "top_n": effective_top_n,
                 "travel_date": travel_date, "include_weather": False}
            )
            candidates = recommendation_result.get("recommendations", [])
            print(f"[TIMING] recommend_places: {time.time() - _t0:.2f}s ({len(candidates)} candidates)")

            print(f"[agent] days={days} effective_top_n={effective_top_n} "
                  f"candidates_returned={len(candidates)}")

            _t0 = time.time()
            enriched_places = await asyncio.gather(*[
                self._enrich_place(mcp, place, travel_date, include_weather)
                for place in candidates
            ])
            enriched_places = list(enriched_places)
            print(f"[TIMING] enrichment (seasonality+weather, {len(candidates)} places): {time.time() - _t0:.2f}s")

         
            min_target = days * MIN_PLACES_PER_DAY
            max_target = days * MAX_PLACES_PER_DAY

            agent_prompt = f"""
You are a Sri Lanka travel planning agent.

Traveler wants: "{query}"
Travel style: {travel_style}, Travelers: {travelers}
Trip length: {days} days
Max daily travel hours: {daily_max_travel_hours}
Start: {start_location}, End: {end_location}

Here are candidate places with their seasonality and weather data:
{json.dumps(enriched_places, indent=2)}

Decide which places should be INCLUDED in the trip and which should be
EXCLUDED, considering:
- Seasonality score/note (avoid places with poor seasonality for this date)
- Weather conditions (avoid places with bad forecast if data available)
- Route feasibility given {daily_max_travel_hours} hours of travel per day

IMPORTANT — the trip is {days} days long. You MUST select enough places
to fill all {days} days:
- Select at least {min_target} places and at most {max_target} places
  (roughly {MIN_PLACES_PER_DAY}-{MAX_PLACES_PER_DAY} per day).
- Only exclude a place if it has a genuinely bad seasonality/weather
  score or is not reachable within the daily travel budget — do not
  exclude good places just to keep the list short.
- Do NOT shorten the trip below {days} days. If you are unsure whether
  a place is good enough, prefer including it over excluding it.

Call select_feasible_places with your decision.
"""
            if model is not None:
                try:
                    _t0 = time.time()
                    chat = model.start_chat()
                    response = chat.send_message(agent_prompt)
                    print(f"[TIMING] Gemini call: {time.time() - _t0:.2f}s")

                    fc = response.candidates[0].content.parts[0].function_call
                    selected_names = list(fc.args.get("selected_place_names", []))
                    excluded_names = list(fc.args.get("excluded_place_names", []))
                    reasoning = fc.args.get("reasoning", "")
                except Exception as exc:
                    print("GenAI planning fallback triggered:", exc)
                    selected_names = []
                    excluded_names = []
                    reasoning = "The AI planner did not return a structured selection, so the best available places were used."
            else:
                selected_names = []
                excluded_names = []
                reasoning = "The AI planner is unavailable, so a deterministic fallback itinerary is being used."

            feasible_places = [
                p for p in enriched_places
                if p.get("place_name") in selected_names
            ]
            excluded_places = [
                p for p in enriched_places
                if p.get("place_name") in excluded_names
            ]

            print(f"[agent] gemini_selected={len(feasible_places)} "
                  f"gemini_excluded={len(excluded_places)} min_target={min_target}")

        
            if len(feasible_places) < min_target:
                already_selected_names = {p.get("place_name") for p in feasible_places}
                remaining = [
                    p for p in enriched_places
                    if p.get("place_name") not in already_selected_names
                ]
              
                remaining.sort(
                    key=lambda p: p.get("seasonality_score", 0),
                    reverse=True
                )
                needed = min_target - len(feasible_places)
                topped_up = remaining[:needed]

                if topped_up:
                    print(f"[agent] topping up {len(topped_up)} places to "
                          f"reach min_target={min_target}")
                    feasible_places.extend(topped_up)
                    topped_up_names = {p.get("place_name") for p in topped_up}
                    excluded_places = [
                        p for p in excluded_places
                        if p.get("place_name") not in topped_up_names
                    ]
                    reasoning += (
                        f" (Note: {len(topped_up)} additional place(s) were "
                        f"added automatically to fully cover the {days}-day trip.)"
                    )

            if not feasible_places and enriched_places:
                feasible_places = enriched_places[:max(1, min(days * 2, len(enriched_places)))]

         
            _t0 = time.time()
            route_result = await mcp.call_tool(
                "optimize_route",
                {"start_location": start_location, "end_location": end_location,
                 "candidate_places": feasible_places, "days": days,
                 "daily_max_travel_hours": daily_max_travel_hours,
                 "transport_type": transport_type}
            )
            print(f"[TIMING] optimize_route: {time.time() - _t0:.2f}s")

            selected_places = route_result.get("selected_places", [])
            if not selected_places and feasible_places:
                selected_places = feasible_places[:max(1, min(days, len(feasible_places)))]

            route_info = route_result.get("route_info", {})
            route_coordinates = route_result.get("route_coordinates", [])
            day_plan = route_result.get("day_plan", [])

            print(f"[agent] final selected_places={len(selected_places)} "
                  f"day_plan_days={len(day_plan)} (requested days={days})")

          
            accommodations = []
            if include_accommodation and travel_date:
                _t0 = time.time()

                async def _fetch_accommodation(place):
                    place_day = int(place.get("day", 1))
                    destination = place.get("city") or place.get("place_name")
                    checkin_date = self._add_days(travel_date, max(place_day - 1, 0))
                    checkout_date = self._add_days(checkin_date, 1)

                    accommodation_result = await mcp.call_tool(
                        "search_accommodation",
                        {"destination": destination, "checkin_date": checkin_date,
                         "checkout_date": checkout_date, "adults": travelers,
                         "rooms": 1, "limit": 5}
                    )
                    return {
                        "destination": destination,
                        "place_name": place.get("place_name"),
                        "day": place_day,
                        "checkin_date": checkin_date,
                        "checkout_date": checkout_date,
                        "result": accommodation_result
                    }

                accommodations = list(await asyncio.gather(*[
                    _fetch_accommodation(place) for place in selected_places
                ]))
                print(f"[TIMING] accommodation search ({len(selected_places)} places): {time.time() - _t0:.2f}s")

            print(f"[TIMING] TOTAL: {time.time() - _plan_start:.2f}s")

            return {
                "agent_reasoning": reasoning,
                "excluded_places": excluded_places,
                "selected_places": selected_places,
                "route_info": route_info,
                "route_coordinates": route_coordinates,   
                "day_plan": day_plan,
                "accommodations": accommodations,          
            }

    def _add_days(self, date_string, days):
        from datetime import datetime, timedelta
        if not date_string:
            return None
        date_obj = datetime.strptime(date_string, "%Y-%m-%d")
        return (date_obj + timedelta(days=days)).strftime("%Y-%m-%d")