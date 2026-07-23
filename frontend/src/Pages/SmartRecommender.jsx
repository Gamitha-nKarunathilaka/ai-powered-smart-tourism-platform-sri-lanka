import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * CeylonExplorer.jsx
 *
 * Updated frontend:
 * - Dynamic trip form with labeled inputs
 * - "Add to Trip" functionality to save custom locations
 * - Displays "My Custom Trip" in the Itinerary tab
 * - Calls FastAPI backend /agent-plan
 * - Fallback call to /recommend if /agent-plan is not available
 * - UI Updated with Hierarchy Colors (Gold Primary CTA, Aqua Secondary CTA)
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const FALLBACK_STOPS = [
  {
    label: "Day 1: Arrival & Colombo",
    title: "Colombo City Tour",
    place_name: "Colombo City Tour",
    city: "Colombo",
    location: "Colombo",
    category: "City Life",
    lat: 6.9271,
    lng: 79.8612,
    day: 1,
    info: "Explore the vibrant capital city with modern life and colonial heritage.",
    why_we_recommend:
      "Explore the vibrant capital city with modern life and colonial heritage.",
    emoji: "🏙️",
    image: "/places/colombo.jpg",
    match: 94,
    match_percentage: 94,
    distance: "0 km",
    time: "Arrival",
    bestTime: "Evening",
  },
  {
    label: "Day 2: Sigiriya Rock",
    title: "Sigiriya Rock Fortress",
    place_name: "Sigiriya Rock Fortress",
    city: "Sigiriya",
    location: "Sigiriya, Central Province",
    category: "Historic Sites",
    lat: 7.957,
    lng: 80.7603,
    day: 2,
    info: "Ancient rock fortress and UNESCO World Heritage Site with stunning views.",
    why_we_recommend:
      "Ancient rock fortress and UNESCO World Heritage Site with stunning views.",
    emoji: "🪨",
    image: "/places/sigiriya.jpg",
    match: 95,
    match_percentage: 95,
    distance: "169 km",
    time: "3h 45m",
    bestTime: "Morning",
  },
  {
    label: "Day 3: Kandy Temple",
    title: "Temple of the Tooth",
    place_name: "Temple of the Tooth",
    city: "Kandy",
    location: "Kandy, Central Province",
    category: "Religious Sites",
    lat: 7.2906,
    lng: 80.6337,
    day: 3,
    info: "Sacred Buddhist temple housing the relic of the Tooth of Buddha.",
    why_we_recommend:
      "Sacred Buddhist temple housing the relic of the Tooth of Buddha.",
    emoji: "🛕",
    image: "/places/kandy.jpg",
    match: 92,
    match_percentage: 92,
    distance: "115 km",
    time: "2h 30m",
    bestTime: "Morning",
  },
  {
    label: "Day 4: Nuwara Eliya",
    title: "Nuwara Eliya Tea Hills",
    place_name: "Nuwara Eliya Tea Hills",
    city: "Nuwara Eliya",
    location: "Nuwara Eliya, Central Province",
    category: "Farms",
    lat: 6.9497,
    lng: 80.7891,
    day: 4,
    info: "Hill country tea estates, waterfalls, cool misty weather and scenic views.",
    why_we_recommend:
      "Hill country tea estates, waterfalls, cool misty weather and scenic views.",
    emoji: "🍃",
    image: "/places/nuwara-eliya.jpg",
    match: 91,
    match_percentage: 91,
    distance: "76 km",
    time: "2h 15m",
    bestTime: "Morning",
  },
  {
    label: "Day 5: Ella Rock Sunrise",
    title: "Ella Rock Sunrise",
    place_name: "Ella Rock Sunrise",
    city: "Ella",
    location: "Ella, Uva Province",
    category: "Nature & Wildlife Areas",
    lat: 6.8667,
    lng: 81.0466,
    day: 5,
    info: "Epic sunrise hike with beautiful valleys, tea fields and mountain views.",
    why_we_recommend:
      "Epic sunrise hike with beautiful valleys, tea fields and mountain views.",
    emoji: "🌅",
    image: "/places/ella.jpg",
    match: 90,
    match_percentage: 90,
    distance: "60 km",
    time: "1h 50m",
    bestTime: "Sunrise",
  },
  {
    label: "Day 6: Mirissa Whale Watching",
    title: "Mirissa Beach",
    place_name: "Mirissa Beach",
    city: "Mirissa",
    location: "Mirissa, Southern Province",
    category: "Beaches",
    lat: 5.9483,
    lng: 80.455,
    day: 6,
    info: "Whale watching, golden beaches, coconut trees and sunset vibes.",
    why_we_recommend:
      "Whale watching, golden beaches, coconut trees and sunset vibes.",
    emoji: "🐋",
    image: "/places/mirissa.jpg",
    match: 89,
    match_percentage: 89,
    distance: "138 km",
    time: "2h 45m",
    bestTime: "Afternoon",
  },
  {
    label: "Day 7: Galle Fort",
    title: "Galle Fort",
    place_name: "Galle Fort",
    city: "Galle",
    location: "Galle, Southern Province",
    category: "Historic Sites",
    lat: 6.0269,
    lng: 80.217,
    day: 7,
    info: "Dutch colonial fort, ocean views, cafes, boutique shops and heritage streets.",
    why_we_recommend:
      "Dutch colonial fort, ocean views, cafes, boutique shops and heritage streets.",
    emoji: "🏰",
    image: "/places/galle.jpg",
    match: 88,
    match_percentage: 88,
    distance: "45 km",
    time: "1h 10m",
    bestTime: "Evening",
  },
];

const INTERESTS = [
  { id: "beach", label: "BEACH LIFE", emoji: "🏖️", queryText: "beaches and surfing" },
  { id: "mountain", label: "MOUNTAIN HIKING", emoji: "⛰️", queryText: "hiking and mountains" },
  { id: "culture", label: "CULTURAL HERITAGE", emoji: "🏛️", queryText: "cultural heritage and historic places" },
  { id: "wildlife", label: "WILDLIFE SAFARI", emoji: "🐘", queryText: "wildlife safari and national parks" },
];

const DAY_COLORS = {
  1: "#60a5fa",
  2: "#facc15",
  3: "#f97316",
  4: "#34d399",
  5: "#a78bfa",
  6: "#38bdf8",
  7: "#f472b6",
  8: "#fb923c",
  9: "#22d3ee",
  10: "#fde047",
  11: "#c084fc",
  12: "#4ade80",
};

const TABS = [
  { id: "recommendations", label: "RECOMMENDATIONS", icon: "☆" },
  { id: "map", label: "MAP", icon: "⌖" },
  { id: "accommodation", label: "ACCOMMODATION", icon: "▱" },
  { id: "itinerary", label: "ITINERARY", icon: "▣" },
];

function makePinIcon(color, emoji) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        background:${color};
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        width:34px;
        height:34px;
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 8px 22px rgba(0,0,0,.45);
      ">
        <span style="transform:rotate(45deg);font-size:15px">${emoji}</span>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  });
}

function getCategoryEmoji(category = "") {
  const cat = String(category).toLowerCase();

  if (cat.includes("beach")) return "🏖️";
  if (cat.includes("waterfall")) return "💦";
  if (cat.includes("historic")) return "🏛️";
  if (cat.includes("religious")) return "🛕";
  if (cat.includes("park") || cat.includes("wildlife")) return "🐘";
  if (cat.includes("nature")) return "🌿";
  if (cat.includes("museum")) return "🏛️";
  if (cat.includes("farm") || cat.includes("tea")) return "🍃";
  if (cat.includes("garden")) return "🌺";

  return "📍";
}

function safeNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function mapApiPlacesToStops(apiPlaces = []) {
  return apiPlaces.map((place, index) => {
    const title = place.place_name || place.title || place.name || "Unknown Place";
    const category = place.category || place.Location_Type || "Travel Destination";

    const lat = safeNumber(place.lat ?? place.latitude ?? place.Latitude);
    const lng = safeNumber(place.lng ?? place.longitude ?? place.Longitude);

    return {
      ...place,
      label: place.label || `Day ${place.day || index + 1}: ${title}`,
      title,
      place_name: title,
      city: place.city || place.Located_City || "Sri Lanka",
      location: place.location || place.Location || "Sri Lanka",
      category,
      lat,
      lng,
      day: safeNumber(place.day, index + 1),
      info:
        place.why_we_recommend ||
        place.reason ||
        place.info ||
        "Recommended based on your travel preferences.",
      why_we_recommend:
        place.why_we_recommend ||
        place.reason ||
        place.info ||
        "Recommended based on your travel preferences.",
      emoji: place.emoji || getCategoryEmoji(category),
      image: place.image || "/places/default.jpg",
      match: Math.round(
        safeNumber(
          place.match_percentage ??
          place.final_score ??
          place.match ??
          place.score,
          80
        )
      ),
      match_percentage: Math.round(
        safeNumber(
          place.match_percentage ??
          place.final_score ??
          place.match ??
          place.score,
          80
        )
      ),
      distance: place.distance || place.route_distance || "",
      time: place.duration || place.time || place.route_duration || "",
      bestTime: place.best_time || place.bestTime || "Morning",
      weather: place.weather || null,
      seasonalityScore: place.seasonality_score ?? place.seasonalityScore ?? null,
    };
  });
}

function getPlacesFromApiResponse(data) {
  if (!data) return [];

  if (Array.isArray(data.selected_places)) return data.selected_places;
  if (Array.isArray(data.optimized_places)) return data.optimized_places;
  if (Array.isArray(data.recommendations)) return data.recommendations;
  if (Array.isArray(data.places)) return data.places;

  return [];
}

function getRouteCoordinatesFromApiResponse(data) {
  if (!data) return [];

  const route =
    data.route_geometry ||
    data.route_coordinates ||
    data.optimized_route_coordinates ||
    data.polyline_coordinates ||
    [];

  if (!Array.isArray(route)) return [];

  return route
    .map((point) => {
      if (Array.isArray(point)) {
        return [safeNumber(point[0]), safeNumber(point[1])];
      }

      return [
        safeNumber(point.lat ?? point.latitude),
        safeNumber(point.lng ?? point.longitude),
      ];
    })
    .filter(([lat, lng]) => lat !== null && lng !== null);
}

export default function CeylonExplorer() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayersRef = useRef([]);

  const [activeTab, setActiveTab] = useState("recommendations");
  const [activeStop, setActiveStop] = useState(null);

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

  // Custom user trip state for "Add to Trip"
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

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [7.8, 80.5],
      zoom: 7,
      minZoom: 6,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    });

    const imageBounds = [
      [5.45, 79.05],
      [10.15, 82.55],
    ];

    L.imageOverlay("/sri-lanka-3d.png", imageBounds, {
      opacity: 1,
      zIndex: 5,
    }).addTo(map);

    map.fitBounds(imageBounds);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(imageBounds);
    }, 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
    routeLayersRef.current = [];
    markersRef.current = [];

    const validStops = tripStops.filter(
      (s) => safeNumber(s.lat) !== null && safeNumber(s.lng) !== null
    );

    if (validStops.length === 0) return;

    const stopCoords = validStops.map((s) => [Number(s.lat), Number(s.lng)]);
    const lineCoords = routeCoordinates.length > 1 ? routeCoordinates : stopCoords;

    if (lineCoords.length > 1) {
      const routeShadow = L.polyline(lineCoords, {
        color: "#38bdf8",
        weight: 8,
        opacity: 0.2,
      }).addTo(map);

      const routeLine = L.polyline(lineCoords, {
        color: "#ffffff",
        weight: 2.8,
        opacity: 0.95,
        dashArray: "7,7",
      }).addTo(map);

      routeLayersRef.current.push(routeShadow, routeLine);
    }

    markersRef.current = validStops.map((stop, index) => {
      const marker = L.marker([Number(stop.lat), Number(stop.lng)], {
        icon: makePinIcon(DAY_COLORS[stop.day] || "#38bdf8", stop.emoji),
      })
        .addTo(map)
        .bindPopup(`
          <div style="background:#071a33;color:white;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.12);max-width:220px">
            <b style="color:#f4c542">${stop.title}</b>
            <p style="font-size:12px;margin-top:6px;color:rgba(255,255,255,.7)">${stop.info}</p>
          </div>
        `);

      routeLayersRef.current.push(marker);
      return marker;
    });

    map.fitBounds(stopCoords, {
      padding: [40, 40],
    });
  }, [tripStops, routeCoordinates]);

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

  const flyToStop = (index) => {
    const stop = tripStops[index];
    if (!stop) return;

    setActiveStop(index);
    setActiveTab("map");

    mapInstanceRef.current?.setView([Number(stop.lat), Number(stop.lng)], 11, {
      animate: true,
    });

    markersRef.current[index]?.openPopup();
  };

  const handleToggleTrip = (stop) => {
    setMyTrip((prev) => {
      const exists = prev.find((s) => s.title === stop.title);
      if (exists) {
        return prev.filter((s) => s.title !== stop.title);
      }
      return [...prev, stop];
    });
  };

  const callApi = async (endpoint, body) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Request failed: ${endpoint}`);
    }

    return response.json();
  };

  const handleGenerateTrip = async () => {
    setLoading(true);
    setError("");

    const requestBody = {
      query,
      start_location: startLocation,
      end_location: endLocation,
      travel_date: travelDate || null,
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
          travel_date: travelDate || null,
          include_weather: includeWeather,
        });
      }

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
        setActiveStop(null);
        setActiveTab("recommendations");
        return;
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
      setActiveStop(null);
      setActiveTab("recommendations");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate AI itinerary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020b1c] text-white font-sans overflow-hidden">
      <nav className="h-[74px] flex items-center justify-between px-5 lg:px-8 bg-[#07162d] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-400 text-[#051225] flex items-center justify-center font-bold">
            SL
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">SRI LANKA</h1>
            <p className="text-[9px] text-cyan-300 font-bold">WONDER OF ASIA</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-xs font-bold tracking-[2px] text-white/70">
          <span>HOME</span>
          <span>DESTINATIONS</span>
          <span>EXPERIENCES</span>
          <span>BLOG</span>
          <span>TRAVEL INFO</span>
          <span>ABOUT US</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="hidden sm:block text-2xl">⌕</span>
          <span className="hidden sm:block text-xl">◎</span>
          <button
            onClick={() => setActiveTab("recommendations")}
            className="hidden md:flex items-center gap-2 rounded-full border border-cyan-400/50 px-6 py-3 text-xs tracking-widest font-bold"
          >
            PLAN YOUR TRIP <span>↗</span>
          </button>
        </div>
      </nav>

      <div className="h-[calc(100vh-74px)] flex overflow-hidden">
        <aside className="hidden lg:block w-[310px] shrink-0 bg-[#071a33] border-r border-white/10 rounded-tr-xl overflow-y-auto">
          <div className="p-5">
            <h2 className="font-serif text-sm font-bold mb-7">
              CREATE YOUR JOURNEY
            </h2>

            <SectionLabel step="STEP 1:" title="TRIP DETAILS" />

            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">What are you looking for?</span>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  placeholder="Example: I want surfing places in Sri Lanka"
                  className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none resize-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Start Location</span>
                  <input
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="Start"
                    className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">End Location</span>
                  <input
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    placeholder="End"
                    className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Travel Date</span>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none [color-scheme:dark]"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Total Days</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="Days"
                    className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Travelers</span>
                  <input
                    type="number"
                    min="1"
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                    placeholder="Travelers"
                    className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Transport Type</span>
                <select
                  value={transportType}
                  onChange={(e) => setTransportType(e.target.value)}
                  className="w-full rounded-lg bg-[#102444] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                >
                  <option value="car">Car</option>
                  <option value="driving-car">Driving Car</option>
                  <option value="foot-walking">Walking</option>
                  <option value="cycling-regular">Cycling</option>
                </select>
              </label>

              <label className="flex items-center justify-between rounded-lg bg-white/[0.05] border border-white/10 px-3 py-3 text-xs text-white/75 cursor-pointer">
                <span>Use weather optimization</span>
                <input
                  type="checkbox"
                  checked={includeWeather}
                  onChange={(e) => setIncludeWeather(e.target.checked)}
                />
              </label>
            </div>

            <SectionLabel step="STEP 2:" title="YOUR INTERESTS" />

            <div className="grid grid-cols-2 gap-2 mb-7">
              {INTERESTS.map((item) => {
                const active = activeInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`h-[72px] rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${active
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-100"
                        : "bg-white/[0.05] border-white/10 hover:bg-white/[0.08]"
                      }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[10px] leading-tight font-bold text-white/80">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <SectionLabel step="STEP 3:" title="TRAVEL STYLE" />

            <div className="grid grid-cols-2 gap-2 mb-5">
              {["Solo", "Couple", "Family", "Friends"].map((style) => (
                <button
                  key={style}
                  onClick={() => setTravelStyle(style)}
                  className={`rounded-full py-2 text-xs border transition-all ${travelStyle === style
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                      : "border-white/15 text-white/60 hover:bg-white/[0.05]"
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* PRIMARY CTA - GOLD BUTTON */}
            <button
              onClick={handleGenerateTrip}
              disabled={loading}
              className="bg-[#FFC107] text-[#051225] w-full border border-[#FFC107] px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex justify-center items-center hover:bg-yellow-400 transition-colors gap-2 mb-4"
            >
              {loading ? "GENERATING..." : "Generate AI Itinerary"}
            </button>

            {error && (
              <p className="text-red-300 text-xs mb-3 leading-relaxed">{error}</p>
            )}

            {agentSummary && (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 mb-4">
                <p className="text-cyan-100 text-xs leading-relaxed">
                  {agentSummary}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-white/[0.035] border border-white/10 p-2">
              {tripStops.slice(0, 8).map((stop, i) => (
                <button
                  key={`${stop.title}-${i}`}
                  onClick={() => flyToStop(i)}
                  className={`w-full flex items-center gap-2 px-2 py-3 rounded-lg border-b border-white/[0.06] last:border-none text-left ${activeStop === i ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                    }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DAY_COLORS[stop.day] || "#38bdf8" }}
                  />
                  <span className="flex-1 text-xs text-white/70">
                    {stop.label}
                  </span>
                  <span>{stop.emoji}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveTab("itinerary")}
              className="w-full mt-3 h-10 rounded-lg border border-white/10 text-xs hover:bg-white/10 transition-colors"
            >
              View Full Itinerary →
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#06162e]">
          <div className="mx-auto max-w-[1280px] p-3 lg:p-4">
            <div className="rounded-xl lg:rounded-2xl border border-white/10 bg-[#071a33]/80 overflow-hidden">
              <div className="flex overflow-x-auto border-b border-white/10">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-w-max flex items-center gap-3 px-5 lg:px-8 h-[54px] text-xs font-bold tracking-[1.5px] border-b-2 transition ${activeTab === tab.id
                        ? "border-[#f4c542] text-white"
                        : "border-transparent text-white/60 hover:text-white"
                      }`}
                  >
                    <span className="text-xl text-[#f4c542]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <section className="p-3 lg:p-5">
                <div className="relative min-h-[280px] lg:min-h-[285px] rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-r from-[#071a33] via-[#092447] to-[#073050]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(56,189,248,.25),transparent_45%)]" />
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent)]" />

                  <div className="relative z-[500] grid lg:grid-cols-[390px_1fr] h-full">
                    <div className="p-6 lg:p-8">
                      <h1 className="text-5xl lg:text-6xl font-serif text-white leading-tight mb-4 drop-shadow-md">
                        Explore <br />
                        <span className="text-cyan-400 font-light">Sri Lanka</span>
                      </h1>

                      <p className="mt-5 text-white/80">
                        {days} Days{" "}
                        <span className="mx-2 text-white/40">•</span>{" "}
                        {Math.max(Number(days) - 1, 0)} Nights{" "}
                        <span className="mx-2 text-white/40">•</span> Sri Lanka
                      </p>

                      <div className="mt-7 grid grid-cols-3 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden">
                        <Stat number={String(tripStops.length)} label="Places" />
                        <Stat number={totalDistance} label="Total Distance" />
                        <Stat number={totalDuration} label="Est. Travel Time" />
                      </div>

                      <button
                        onClick={() => setActiveTab("map")}
                        className="mt-5 rounded-lg border border-cyan-400/50 text-cyan-400 px-6 py-3 text-sm font-semibold hover:bg-cyan-400/10 transition-colors"
                      >
                        View Full Map ↗
                      </button>
                    </div>

                    <div className="relative h-[300px] lg:h-[285px]">
                      <div
                        ref={mapRef}
                        className="absolute inset-0 z-10 drop-shadow-[0_30px_50px_rgba(0,0,0,.75)]"
                      />
                    </div>
                  </div>

                  <div className="absolute right-5 top-9 z-[600] flex flex-col gap-4">
                    <MapButton
                      label="➤"
                      onClick={() => {
                        if (tripStops[0]) flyToStop(0);
                      }}
                    />
                    <MapButton
                      label="+"
                      onClick={() => mapInstanceRef.current?.zoomIn()}
                    />
                    <MapButton
                      label="−"
                      onClick={() => mapInstanceRef.current?.zoomOut()}
                    />
                    <MapButton
                      label="⛶"
                      onClick={() => {
                        const coords = tripStops
                          .filter(
                            (s) =>
                              safeNumber(s.lat) !== null &&
                              safeNumber(s.lng) !== null
                          )
                          .map((s) => [Number(s.lat), Number(s.lng)]);

                        if (coords.length > 0) {
                          mapInstanceRef.current?.fitBounds(coords, {
                            padding: [40, 40],
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </section>

              {activeTab === "recommendations" && (
                <Recommendations
                  stops={tripStops}
                  activeStop={activeStop}
                  onView={flyToStop}
                  myTrip={myTrip}
                  onToggleTrip={handleToggleTrip}
                />
              )}

              {activeTab === "map" && (
                <SimplePanel
                  title="Map View"
                  text="The 3D Sri Lanka map above updates with AI optimized places and route markers."
                />
              )}

              {activeTab === "accommodation" && <Accommodation stops={tripStops} />}

              {activeTab === "itinerary" && (
                <Itinerary
                  stops={tripStops}
                  dayPlan={dayPlan}
                  onView={flyToStop}
                  myTrip={myTrip}
                  onRemoveFromTrip={handleToggleTrip}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionLabel({ step, title }) {
  return (
    <div className="mb-2 mt-4 first:mt-0">
      <p className="text-[11px] text-white/35 tracking-widest mb-1">{step}</p>
      <p className="text-xs font-bold tracking-wider">{title}</p>
    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div className="p-4 border-r border-white/10 last:border-r-0">
      <h3 className="text-lg font-bold">{number}</h3>
      <p className="text-[11px] text-white/55">{label}</p>
    </div>
  );
}

function MapButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-full lg:rounded-xl bg-[#061a33]/80 border border-white/10 text-xl hover:bg-white/10"
    >
      {label}
    </button>
  );
}

function Recommendations({ stops, activeStop, onView, myTrip, onToggleTrip }) {
  return (
    <section className="px-3 lg:px-5 pb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">
            Recommended for your journey
          </h2>
          <p className="text-white/55 text-sm">
            AI optimized places using ML model, weather, seasonality and route
            planning.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg border border-cyan-400/50 text-cyan-400 px-5 py-3 text-sm hover:bg-cyan-400/10 transition-colors">
            Filter ⚱
          </button>
          <button className="rounded-lg border border-cyan-400/50 text-cyan-400 px-5 py-3 text-sm hover:bg-cyan-400/10 transition-colors">
            Sort by: Best Match ⌄
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {stops.map((stop, i) => {
          const isAdded = myTrip.some((s) => s.title === stop.title);
          return (
            <RecommendationCard
              key={`${stop.title}-${i}`}
              stop={stop}
              active={activeStop === i}
              onView={() => onView(i)}
              topPick={i === 0}
              isAdded={isAdded}
              onToggleTrip={() => onToggleTrip(stop)}
            />
          );
        })}
      </div>
    </section>
  );
}

function RecommendationCard({ stop, active, onView, topPick, isAdded, onToggleTrip }) {
  const weatherText = stop.weather
    ? `${stop.weather.condition || "Weather"} ${stop.weather.temperature ? `${Math.round(stop.weather.temperature)}°C` : ""
    }`
    : "Weather not checked";

  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-[230px_1fr_120px_170px_180px_40px] gap-5 rounded-2xl border p-3 lg:p-4 bg-white/[0.04] transition ${active
          ? "border-[#f4c542]/70"
          : "border-white/10 hover:border-white/25"
        }`}
    >
      <div className="relative h-[135px] rounded-xl overflow-hidden bg-white/10">
        <img
          src={stop.image}
          alt={stop.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?q=80&w=800&auto=format&fit=crop";
          }}
        />
        {topPick && (
          <span className="absolute left-3 bottom-3 rounded-full bg-[#f4c542] text-black text-[10px] font-bold px-3 py-1">
            TOP PICK
          </span>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <h3 className="text-xl font-bold">
          {stop.title} <span className="text-sm">{stop.emoji}</span>
        </h3>
        <p className="text-sm text-white/55 mt-1">
          {stop.location} <span className="mx-1">•</span> {stop.category}
        </p>
        <p className="text-sm text-white/70 mt-3 leading-relaxed line-clamp-3">
          {stop.info}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {stop.seasonalityScore !== null && stop.seasonalityScore !== undefined && (
            <span className="rounded-full bg-green-400/10 border border-green-400/20 px-3 py-1 text-green-200">
              Seasonality {Math.round(stop.seasonalityScore)}%
            </span>
          )}

          <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-cyan-200">
            {weatherText}
          </span>
        </div>
      </div>

      <div className="flex xl:flex-col items-center justify-center border-white/10 xl:border-l xl:border-r gap-2">
        <span className="text-3xl font-bold text-green-400">{stop.match}%</span>
        <span className="text-sm">Match</span>
      </div>

      <div className="flex xl:flex-col justify-center gap-2 text-sm text-white/70">
        <p>☀️ Best Time</p>
        <p>🌞 {stop.bestTime}</p>
        {stop.distance && <p>🛣️ {stop.distance}</p>}
        {stop.time && <p>⏱️ {stop.time}</p>}
      </div>

      <div className="flex xl:flex-col justify-center gap-3">
        <button
          onClick={onView}
          className="rounded-lg border border-cyan-400/50 text-cyan-400 px-4 py-3 text-sm font-bold hover:bg-cyan-400/10 transition-colors"
        >
          ⌖ View on Map
        </button>
        {/* SECONDARY CTA - AQUA SOLID BUTTON */}
        <button
          onClick={onToggleTrip}
          className={`rounded-lg px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all w-full xl:w-auto ${isAdded
              ? "bg-transparent text-red-300 border border-red-500/50 hover:bg-red-500/20"
              : "bg-cyan-400 text-[#071a33] border border-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            }`}
        >
          {isAdded ? "Remove -" : "Add to Trip +"}
        </button>
      </div>

      <div className="hidden xl:flex items-center justify-center text-2xl text-white/60">
        {isAdded ? <span className="text-[#f4c542]">♥</span> : "♡"}
      </div>
    </div>
  );
}

function SimplePanel({ title, text }) {
  return (
    <section className="p-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-white/60 mt-2">{text}</p>
      </div>
    </section>
  );
}

function Accommodation({ stops }) {
  const hotels = stops.slice(0, 4).map((stop, index) => ({
    name: `${stop.city} Stay ${index + 1}`,
    place: stop.city,
    price: ["$120 / night", "$95 / night", "$110 / night", "$90 / night"][index] || "$100 / night",
  }));

  return (
    <section className="p-5 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {hotels.map((hotel) => (
        <div
          key={`${hotel.name}-${hotel.place}`}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="h-36 rounded-xl bg-white/10 mb-4" />
          <h3 className="font-bold">{hotel.name}</h3>
          <p className="text-white/50 text-sm">{hotel.place}</p>
          <p className="text-[#f4c542] mt-2">★★★★★</p>
          <p className="mt-2">{hotel.price}</p>
          <button className="mt-4 w-full rounded-lg border border-white/15 py-3 hover:bg-white/10">
            View Details
          </button>
        </div>
      ))}
    </section>
  );
}

function Itinerary({ stops, dayPlan, onView, myTrip, onRemoveFromTrip }) {
  return (
    <div className="p-5">
      {/* Custom Trip Section */}
      {myTrip && myTrip.length > 0 && (
        <section className="mb-8 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl text-[#f4c542]">★</span>
            <h2 className="text-xl font-bold font-serif">My Custom Trip</h2>
          </div>
          {myTrip.map((stop, i) => (
            <div
              key={`mytrip-${i}`}
              className="flex items-center gap-4 rounded-2xl border border-[#f4c542]/40 bg-[#f4c542]/5 p-4"
            >
              <span className="text-3xl">{stop.emoji}</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#f4c542]">{stop.title}</h3>
                <p className="text-white/70 text-sm">{stop.location}</p>
              </div>
              <button
                onClick={() => onRemoveFromTrip(stop)}
                className="rounded-lg border border-red-500/30 text-red-300 px-4 py-2 text-sm hover:bg-red-500/20"
              >
                Remove
              </button>
            </div>
          ))}
        </section>
      )}

      {/* AI Generated / Recommended Route Section */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold font-serif mb-4 pt-2">
          {dayPlan?.length > 0 ? "AI Generated Itinerary" : "Suggested Route"}
        </h2>

        {dayPlan?.length > 0 ? (
          dayPlan.map((day, i) => (
            <div
              key={`day-plan-${i}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <h3 className="font-bold text-lg">Day {day.day || i + 1}</h3>
              {day.route && (
                <p className="text-cyan-200 text-sm mt-1">Route: {day.route}</p>
              )}
              {Array.isArray(day.places) && (
                <p className="text-white/70 text-sm mt-2">
                  Places: {day.places.join(", ")}
                </p>
              )}
              {day.note && <p className="text-white/55 text-sm mt-2">{day.note}</p>}
            </div>
          ))
        ) : (
          stops.map((stop, i) => (
            <button
              key={`${stop.label}-${i}`}
              onClick={() => onView(i)}
              className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.08]"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: DAY_COLORS[stop.day] || "#38bdf8" }}
              />
              <span className="text-2xl">{stop.emoji}</span>
              <div>
                <h3 className="font-bold">{stop.label}</h3>
                <p className="text-white/55 text-sm">{stop.info}</p>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}