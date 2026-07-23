import { useMemo, useState } from "react";
import { API_BASE_URL, FALLBACK_STOPS, INTERESTS } from "../constant";
import {
  getPlacesFromApiResponse,
  getRouteCoordinatesFromApiResponse,
  mapApiPlacesToStops,
  safeNumber,
} from "../utils/mapHelpers";

async function callApi(endpoint, body) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${endpoint}`);
  }

  return response.json();
}

function resolveTravelDate(travelDate) {
  if (travelDate) return travelDate;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

export function useTripPlanner() {
  const [query, setQuery] = useState("I want surfing places in Sri Lanka");
  const [startLocation, setStartLocation] = useState("Colombo");
  const [endLocation, setEndLocation] = useState("Colombo");
  const [travelDate, setTravelDate] = useState("");
  const [days, setDays] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [transportType, setTransportType] = useState("car");
  const [includeWeather, setIncludeWeather] = useState(true);
  const [travelStyle, setTravelStyle] = useState("Solo");
  const [activeInterests, setActiveInterests] = useState([
    "beach",
    "mountain",
    "culture",
  ]);


  const [tripStops, setTripStops] = useState(FALLBACK_STOPS);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [agentSummary, setAgentSummary] = useState(
    "Default demo journey is shown. Generate a new AI itinerary to use backend recommendations."
  );
  const [dayPlan, setDayPlan] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  const [accommodationsData, setAccommodationsData] = useState([]);

  const [myTrip, setMyTrip] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalDistance = useMemo(() => {
    if (routeInfo?.total_distance_text) return routeInfo.total_distance_text;
    if (routeInfo?.total_distance_km) return `${Math.round(routeInfo.total_distance_km)} km`;

    const withDistance = tripStops.find((s) => s.distance);
    return withDistance ? "Optimized" : "Route";
  }, [routeInfo, tripStops]);

  const totalDuration = useMemo(() => {
    if (routeInfo?.total_duration_text) return routeInfo.total_duration_text;
    if (routeInfo?.total_duration_hours) return `${routeInfo.total_duration_hours}h`;
    return `${days} Days`;
  }, [routeInfo, days]);

  const toggleInterest = (id) => {
    setActiveInterests((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];

      const interestText = INTERESTS.filter((item) => next.includes(item.id))
        .map((item) => item.queryText)
        .join(", ");

      if (interestText) {
        setQuery(`I want ${interestText} places in Sri Lanka`);
      }

      return next;
    });
  };

  const handleToggleTrip = (stop) => {
    setMyTrip((prev) => {
      const exists = prev.find((s) => s.title === stop.title);
      if (exists) return prev.filter((s) => s.title !== stop.title);
      return [...prev, stop];
    });
  };

  const handleGenerateTrip = async () => {
    setLoading(true);
    setError("");

    const effectiveTravelDate = resolveTravelDate(travelDate);

    const requestBody = {
      query,
      start_location: startLocation,
      end_location: endLocation,
      travel_date: effectiveTravelDate,
      days: Number(days),
      top_n: Math.max(Number(days) * 4, 10),
      travelers: Number(travelers),
      transport_type: transportType,
      daily_max_travel_hours: 6,
      include_weather: includeWeather,
      travel_style: travelStyle,
    };

    try {
      let data;

      try {
        data = await callApi("/agent-plan", requestBody);
      } catch (agentError) {
        console.warn("/agent-plan failed. Falling back to /recommend.", agentError);

        data = await callApi("/recommend", {
          query,
          top_n: Number(requestBody.top_n),
          travel_date: effectiveTravelDate,
          include_weather: includeWeather,
        });
      }

    
      console.log("🔥 FULL API RESPONSE 🔥:", data);

      const apiPlaces = getPlacesFromApiResponse(data);
      const mappedStops = mapApiPlacesToStops(apiPlaces).filter(
        (place) => safeNumber(place.lat) !== null && safeNumber(place.lng) !== null
      );

      if (mappedStops.length === 0) {
        console.warn("No valid backend stops were returned; using fallback itinerary.");
        setTripStops(FALLBACK_STOPS);
        setRouteCoordinates([]);
        setAgentSummary(
          "The backend returned no valid stops, so a curated fallback Sri Lanka itinerary is being shown."
        );
        setDayPlan([]);
        setRouteInfo(null);
        setAccommodationsData([]);
        return { ok: true, hadFallback: true };
      }

      setTripStops(mappedStops);
      setRouteCoordinates(getRouteCoordinatesFromApiResponse(data));
      setAgentSummary(
        data.summary ||
        data.agent_summary ||
        "AI optimized travel plan generated successfully."
      );
      setDayPlan(data.day_plan || data.itinerary || []);
      setRouteInfo(data.route_info || data.optimized_route || null);

      let extractedHotels = [];

      if (data.accommodations && Array.isArray(data.accommodations)) {
        data.accommodations.forEach(item => {
          if (item?.result?.hotels && Array.isArray(item.result.hotels)) {
            const destinationName = item.destination || item.place_name || "";
            item.result.hotels.forEach(hotel => {
              extractedHotels.push({
                ...hotel,
                destination_city: destinationName
              });
            });
          } else if (item?.hotels && Array.isArray(item.hotels)) {
            extractedHotels = extractedHotels.concat(item.hotels);
          }
        });
      }

      console.log("🏨 SUCCESSFULLY EXTRACTED HOTELS:", extractedHotels);

      setAccommodationsData(extractedHotels);

      return { ok: true, hadFallback: false };
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate AI itinerary.");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    query, setQuery,
    startLocation, setStartLocation,
    endLocation, setEndLocation,
    travelDate, setTravelDate,
    days, setDays,
    travelers, setTravelers,
    transportType, setTransportType,
    includeWeather, setIncludeWeather,
    travelStyle, setTravelStyle,
    activeInterests, toggleInterest,

    tripStops, routeCoordinates, agentSummary, dayPlan,
    totalDistance, totalDuration,
    accommodationsData,

    myTrip, handleToggleTrip,

    loading, error, handleGenerateTrip,
  };
}