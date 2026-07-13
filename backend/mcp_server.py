import json

from mcp.server.fastmcp import FastMCP

from services.recomender_service import recommend_places_service
from services.weather_service import get_weather_service
from services.seasonality_service import get_seasonality_service
from services.route_service import optimize_route_service
from services.booking_service import search_booking_accommodations


mcp = FastMCP("ceylon-explorer-mcp-server")


@mcp.tool()
def recommend_places(
    query: str,
    top_n: int = 10,
    travel_date: str | None = None,
    include_weather: bool = False
) -> str:
    """
    Recommend Sri Lanka travel destinations using the trained ML model.
    """

    result = recommend_places_service(
        query=query,
        top_n=top_n,
        travel_date=travel_date,
        include_weather=include_weather
    )

    return json.dumps(result)


@mcp.tool()
def get_weather(
    city: str,
    category: str = ""
) -> str:
    """
    Get live weather suitability score for a Sri Lanka city.
    """

    result = get_weather_service(
        city=city,
        category=category
    )

    return json.dumps(result)


@mcp.tool()
def get_seasonality(
    place_name: str,
    city: str,
    category: str,
    location: str,
    travel_date: str | None = None
) -> str:
    """
    Get seasonality suitability score for a Sri Lanka travel destination.
    """

    result = get_seasonality_service(
        place_name=place_name,
        city=city,
        category=category,
        location=location,
        travel_date=travel_date
    )

    return json.dumps(result)


@mcp.tool()
def optimize_route(
    start_location: str,
    end_location: str,
    candidate_places: list,
    days: int = 3,
    daily_max_travel_hours: float = 6,
    transport_type: str = "car"
) -> str:
    """
    Optimize route and select maximum practical places within available days.
    """

    result = optimize_route_service(
        start_location=start_location,
        end_location=end_location,
        candidate_places=candidate_places,
        days=days,
        daily_max_travel_hours=daily_max_travel_hours,
        transport_type=transport_type
    )

    return json.dumps(result)


@mcp.tool()
def search_accommodation(
    destination: str,
    checkin_date: str,
    checkout_date: str,
    adults: int = 2,
    rooms: int = 1,
    limit: int = 5
) -> str:
    """
    Search accommodation using Booking.com Demand API.
    If official API credentials are missing, return Booking.com deeplink fallback.
    """

    result = search_booking_accommodations(
        destination=destination,
        checkin_date=checkin_date,
        checkout_date=checkout_date,
        adults=adults,
        rooms=rooms,
        limit=limit
    )

    return json.dumps(result)


if __name__ == "__main__":
    mcp.run()