import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// -----------------------------------------------------------------------
// Backend config
// -----------------------------------------------------------------------
const API_BASE = "http://127.0.0.1:8000";

const DAY_COLORS = [
  "#7baaff", "#c9a84c", "#f97316", "#34d399", "#a78bfa",
  "#38bdf8", "#f472b6", "#fb923c", "#4ade80", "#f87171",
];

const INTERESTS = [
  { id: "beach",    label: "BEACH LIFE",        emoji: "🏖️" },
  { id: "mountain", label: "MOUNTAIN HIKING",   emoji: "🏔️" },
  { id: "culture",  label: "CULTURAL HERITAGE", emoji: "🏛️" },
  { id: "wildlife", label: "WILDLIFE SAFARI",   emoji: "🐘" },
];

const EMOJI_BY_CATEGORY = {
  Beaches: "🏖️",
  "Historic Sites": "🏛️",
  "Religious Sites": "🛕",
  Museums: "🏺",
  Wildlife: "🐘",
  Mountains: "🏔️",
  default: "📍",
};

// Leaflet popup global styles injected once
const POPUP_STYLE = `
  .ce-popup .leaflet-popup-content-wrapper {
    background: #12203a; border: 0.5px solid rgba(201,168,76,0.45);
    border-radius: 10px; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }
  .ce-popup .leaflet-popup-tip { background: #12203a; }
  .ce-popup .leaflet-popup-content { margin: 10px 14px; font-family: inherit; }
  .popup-title { color: #c9a84c; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
  .popup-sub   { color: rgba(255,255,255,0.65); font-size: 10px; line-height: 1.5; }
  .popup-day   { display:inline-block; background:rgba(201,168,76,0.15); color:#c9a84c;
                 font-size:9px; padding:2px 8px; border-radius:4px; margin-top:6px; }
  .leaflet-control-zoom a { background:#12203a !important; color:#c9a84c !important; border-color:rgba(255,255,255,0.15) !important; }
  .leaflet-control-zoom a:hover { background:#1e3558 !important; }
`;

function injectPopupStyles() {
  if (document.getElementById("ce-popup-styles")) return;
  const s = document.createElement("style");
  s.id = "ce-popup-styles";
  s.textContent = POPUP_STYLE;
  document.head.appendChild(s);
}

function makePinIcon(color, emoji) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:${color};border:2.5px solid #fff;border-radius:50% 50% 50% 0;
        width:28px;height:28px;transform:rotate(-45deg);display:flex;align-items:center;
        justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.45)">
        <span style="transform:rotate(45deg);font-size:12px;line-height:1">${emoji}</span>
      </div>
    </div>`,
    iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -38],
  });
}

// Turn a backend `selected_places` entry into the shape the map/sidebar use.
function toStop(place) {
  const day = place.day || 1;
  return {
    label: `Day ${day}: ${place.place_name}`,
    lat: place.lat,
    lng: place.lng,
    day,
    info: place.why_we_recommend || place.location || "",
    emoji: EMOJI_BY_CATEGORY[place.category] || EMOJI_BY_CATEGORY.default,
  };
}

function buildQuery(activeInterests) {
  const interestLabels = INTERESTS
    .filter((it) => activeInterests.includes(it.id))
    .map((it) => it.label.toLowerCase());
  if (interestLabels.length === 0) return "A great trip around Sri Lanka";
  return `A trip focused on ${interestLabels.join(", ")}`;
}

export default function CeylonExplorer() {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef     = useRef([]);
  const routeLinesRef  = useRef([]);

  const [activeInterests, setActiveInterests] = useState(["beach", "mountain", "culture"]);
  const [travelStyle, setTravelStyle]         = useState("Solo");
  const [days, setDays]                       = useState(8);
  const [travelDate, setTravelDate]           = useState("2026-10-10");
  const [activeDay, setActiveDay]             = useState(null);

  const [stops, setStops]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [reasoning, setReasoning] = useState("");

  // ── Map init (runs once) ──
  useEffect(() => {
    if (mapInstanceRef.current) return;
    injectPopupStyles();

    const map = L.map(mapRef.current, {
      center: [7.8, 80.5],
      zoom: 7,
      minZoom: 6,
      maxZoom: 10,
      zoomControl: false,
    });

    const imageBounds = [[5.5, 79.0], [10.2, 82.5]];
    const imageUrl = "/sri-lanka-3d.png";

    L.imageOverlay(imageUrl, imageBounds, { opacity: 1, zIndex: 1 }).addTo(map);
    map.fitBounds(imageBounds);

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // ── Redraw markers + route whenever `stops` changes ──
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // clear previous layers
    markersRef.current.forEach((m) => map.removeLayer(m));
    routeLinesRef.current.forEach((l) => map.removeLayer(l));
    markersRef.current = [];
    routeLinesRef.current = [];

    if (stops.length === 0) return;

    const coords = stops.map((s) => [s.lat, s.lng]);
    const glow = L.polyline(coords, { color: "#38bdf8", weight: 6, opacity: 0.2 }).addTo(map);
    const line = L.polyline(coords, { color: "#ffffff", weight: 2.5, opacity: 0.9, dashArray: "5,5" }).addTo(map);
    routeLinesRef.current = [glow, line];

    markersRef.current = stops.map((s) =>
      L.marker([s.lat, s.lng], { icon: makePinIcon(DAY_COLORS[(s.day - 1) % DAY_COLORS.length], s.emoji) })
        .addTo(map)
        .bindPopup(
          `<div class="popup-title">${s.label.replace(/Day \d+: /, "")}</div>
           <div class="popup-sub">${s.info}</div>
           <div class="popup-day">${s.label.split(":")[0]}</div>`,
          { className: "ce-popup" }
        )
    );

    map.fitBounds(coords, { padding: [40, 40] });
  }, [stops]);

  const toggleInterest = (id) =>
    setActiveInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const flyToStop = (i) => {
    setActiveDay(i);
    mapInstanceRef.current?.setView([stops[i].lat, stops[i].lng], 12, { animate: true });
    markersRef.current[i]?.openPopup();
  };

  // ── Call the Flask backend ──
  async function generateItinerary() {
    setLoading(true);
    setError(null);
    setActiveDay(null);

    try {
      const response = await fetch(`${API_BASE}/api/agent-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: buildQuery(activeInterests),
          start_location: "Colombo",
          end_location: "Colombo",
          travel_date: travelDate,
          days,
          travelers: travelStyle === "Couple" ? 2 : 1,
          transport_type: "car",
          daily_max_travel_hours: 6,
          include_weather: true,
          travel_style: travelStyle,
          include_accommodation: true,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      const selected = data.selected_places || [];

      if (selected.length === 0) {
        setError("No places came back for this trip. Try different interests or a shorter trip.");
        setStops([]);
        return;
      }

      setStops(selected.map(toStop));
      setReasoning(data.agent_reasoning || "");
    } catch (err) {
      setError(err.message || "Could not reach the planning server.");
      setStops([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a2744] font-sans overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-3 bg-[#12203a] border-b border-white/10 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 7 6 7 12s3.5 10 5 10 5-4 5-10S12 2 12 2z" fill="#c9a84c"/>
            <path d="M12 5c0 0-3 3-3 7s1.5 7 3 7 3-3 3-7-3-7-3-7z" fill="#12203a"/>
          </svg>
          <span className="text-white text-xs font-semibold tracking-[2.5px]">
            CEYLON <em className="not-italic text-[#c9a84c]">EXPLORER</em>
          </span>
        </div>
        <div className="flex items-center gap-5">
          {["EXPLORE","ABOUT","PLANNER","SIGN IN","🔍"].map((l) => (
            <a key={l} className="text-white/60 text-[10px] tracking-[1.5px] cursor-pointer hover:text-white transition-colors">
              {l}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-[275px] min-w-[275px] bg-[#1a2744] border-r border-white/[0.08] px-4 py-5 overflow-y-auto flex-shrink-0 scrollbar-thin scrollbar-thumb-white/10">

          <h2 className="text-white text-xs font-semibold tracking-[2px] mb-4">
            CREATE YOUR JOURNEY
          </h2>

          {/* Step 1 */}
          <p className="text-white/40 text-[9px] tracking-[1.2px] mt-3 mb-1">STEP 1:</p>
          <p className="text-white text-[10px] font-medium tracking-[1px] mb-2">TRIP DURATION</p>
          <div className="flex items-center gap-2 bg-white/[0.07] border border-white/[0.14] rounded-lg px-3 py-2 mb-2">
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="bg-transparent text-white/80 text-[10px] flex-1 outline-none [color-scheme:dark]"
            />
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
              className="bg-transparent text-white/80 text-[10px] w-10 outline-none text-right"
            />
            <span className="text-white/40 text-[9px]">days</span>
          </div>

          {/* Step 2 */}
          <p className="text-white/40 text-[9px] tracking-[1.2px] mt-4 mb-1">STEP 2:</p>
          <p className="text-white text-[10px] font-medium tracking-[1px] mb-2">YOUR INTERESTS</p>
          <div className="grid grid-cols-2 gap-[7px] mb-1">
            {INTERESTS.map((it) => {
              const active = activeInterests.includes(it.id);
              return (
                <div
                  key={it.id}
                  onClick={() => toggleInterest(it.id)}
                  className={`flex flex-col items-center gap-1 rounded-[9px] px-2 py-3 cursor-pointer transition-all border
                    ${active
                      ? "bg-[rgba(201,168,76,0.14)] border-[rgba(201,168,76,0.55)]"
                      : "bg-white/[0.06] border-white/10 hover:bg-white/[0.10]"
                    }`}
                >
                  <span className="text-lg leading-none">{it.emoji}</span>
                  <span className={`text-[8px] tracking-[0.8px] text-center leading-tight ${active ? "text-[#c9a84c]" : "text-white/55"}`}>
                    {it.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step 3 */}
          <p className="text-white/40 text-[9px] tracking-[1.2px] mt-4 mb-1">STEP 3:</p>
          <p className="text-white text-[10px] font-medium tracking-[1px] mb-2">TRAVEL STYLE</p>
          <div className="flex gap-2 mb-1">
            {["Solo", "Couple"].map((s) => (
              <button
                key={s}
                onClick={() => setTravelStyle(s)}
                className={`flex-1 py-[7px] rounded-full text-[10px] border transition-all cursor-pointer
                  ${travelStyle === s
                    ? "bg-white/10 text-white border-white/40"
                    : "bg-transparent text-white/55 border-white/20 hover:bg-white/[0.06]"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={generateItinerary}
            disabled={loading}
            className="w-full mt-3 mb-1 py-3 rounded-lg text-[10px] font-semibold tracking-[1.5px] text-[#1a0e00] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #b8922a, #e8c96a)" }}
          >
            {loading ? "PLANNING…" : "GENERATE 3D ITINERARY"}
          </button>

          {error && (
            <p className="text-[9px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-2 mb-2 leading-relaxed">
              {error}
            </p>
          )}

          {!loading && !error && reasoning && (
            <p className="text-[9px] text-white/45 leading-relaxed mb-2 mt-2">
              {reasoning}
            </p>
          )}

          {/* Day list */}
          <div className="flex flex-col mt-2">
            {stops.length === 0 && !loading && (
              <p className="text-white/30 text-[9px] tracking-[0.3px] px-2 py-3">
                Set your trip details and generate an itinerary to see stops here.
              </p>
            )}
            {stops.map((stop, i) => (
              <div
                key={i}
                onClick={() => flyToStop(i)}
                className={`flex items-center gap-2 px-2 py-[7px] rounded-md border-b border-white/[0.06] last:border-b-0 cursor-pointer transition-colors
                  ${activeDay === i ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
              >
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{ background: DAY_COLORS[(stop.day - 1) % DAY_COLORS.length] }} />
                <span className={`text-[9px] tracking-[0.3px] flex-1 transition-colors
                  ${activeDay === i ? "text-[#c9a84c]" : "text-white/55"}`}>
                  {stop.label}
                </span>
                <span className="text-sm flex-shrink-0">{stop.emoji}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Map ── */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute top-5 left-5 z-[500] pointer-events-none">
            <h1 className="text-white text-3xl font-bold tracking-[2px] leading-tight"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.75)" }}>
              CEYLON
              <span className="block text-[#c9a84c]">EXPLORER</span>
            </h1>
          </div>
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}