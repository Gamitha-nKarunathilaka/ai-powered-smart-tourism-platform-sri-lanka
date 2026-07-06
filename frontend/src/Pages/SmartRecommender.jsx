import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STOPS = [
  {
    label: "Day 1: Arrival & Colombo",
    title: "Colombo City Tour",
    location: "Colombo",
    category: "City Life",
    lat: 6.9271,
    lng: 79.8612,
    day: 1,
    info: "Explore the vibrant capital city with modern life and colonial heritage.",
    emoji: "🏙️",
    image: "/places/colombo.jpg",
    match: 94,
    distance: "0 km",
    time: "Arrival",
    bestTime: "Evening",
  },
  {
    label: "Day 2: Sigiriya Rock",
    title: "Sigiriya Rock Fortress",
    location: "Sigiriya",
    category: "Cultural Heritage",
    lat: 7.957,
    lng: 80.7603,
    day: 2,
    info: "Ancient rock fortress and UNESCO World Heritage Site with stunning views.",
    emoji: "🪨",
    image: "/places/sigiriya.jpg",
    match: 95,
    distance: "169 km",
    time: "3h 45m",
    bestTime: "Morning",
  },
  {
    label: "Day 3: Kandy Temple",
    title: "Temple of the Tooth",
    location: "Kandy",
    category: "Cultural Heritage",
    lat: 7.2906,
    lng: 80.6337,
    day: 3,
    info: "Sacred Buddhist temple housing the relic of the Tooth of Buddha.",
    emoji: "🛕",
    image: "/places/kandy.jpg",
    match: 92,
    distance: "115 km",
    time: "2h 30m",
    bestTime: "Morning",
  },
  {
    label: "Day 4: Nuwara Eliya",
    title: "Nuwara Eliya Tea Hills",
    location: "Nuwara Eliya",
    category: "Mountain Hiking",
    lat: 6.9497,
    lng: 80.7891,
    day: 4,
    info: "Hill country tea estates, waterfalls, cool misty weather and scenic views.",
    emoji: "🍃",
    image: "/places/nuwara-eliya.jpg",
    match: 91,
    distance: "76 km",
    time: "2h 15m",
    bestTime: "Morning",
  },
  {
    label: "Day 5: Ella Rock Sunrise",
    title: "Ella Rock Sunrise",
    location: "Ella",
    category: "Mountain Hiking",
    lat: 6.8667,
    lng: 81.0466,
    day: 5,
    info: "Epic sunrise hike with beautiful valleys, tea fields and mountain views.",
    emoji: "🌅",
    image: "/places/ella.jpg",
    match: 90,
    distance: "60 km",
    time: "1h 50m",
    bestTime: "Sunrise",
  },
  {
    label: "Day 6: Mirissa Whale Watching",
    title: "Mirissa Beach",
    location: "Mirissa",
    category: "Beach Life",
    lat: 5.9483,
    lng: 80.455,
    day: 6,
    info: "Whale watching, golden beaches, coconut trees and sunset vibes.",
    emoji: "🐋",
    image: "/places/mirissa.jpg",
    match: 89,
    distance: "138 km",
    time: "2h 45m",
    bestTime: "Afternoon",
  },
  {
    label: "Day 7: Galle Fort",
    title: "Galle Fort",
    location: "Galle",
    category: "Cultural Heritage",
    lat: 6.0269,
    lng: 80.217,
    day: 7,
    info: "Dutch colonial fort, ocean views, cafes, boutique shops and heritage streets.",
    emoji: "🏰",
    image: "/places/galle.jpg",
    match: 88,
    distance: "45 km",
    time: "1h 10m",
    bestTime: "Evening",
  },
  {
    label: "Day 8: Trincomalee",
    title: "Trincomalee Beach",
    location: "Trincomalee",
    category: "Beach Life",
    lat: 8.5874,
    lng: 81.2152,
    day: 8,
    info: "Pristine beaches, clear water, diving spots and ancient Hindu temples.",
    emoji: "⛱️",
    image: "/places/trincomalee.jpg",
    match: 87,
    distance: "220 km",
    time: "4h 30m",
    bestTime: "Morning",
  },
];

const INTERESTS = [
  { id: "beach", label: "BEACH LIFE", emoji: "🏖️" },
  { id: "mountain", label: "MOUNTAIN HIKING", emoji: "⛰️" },
  { id: "culture", label: "CULTURAL HERITAGE", emoji: "🏛️" },
  { id: "wildlife", label: "WILDLIFE SAFARI", emoji: "🐘" },
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
};

const TABS = [
  { id: "recommendations", label: "RECOMMENDATIONS", icon: "☆" },
  { id: "map", label: "MAP", icon: "⌖" },
  { id: "accommodation", label: "ACCOMMODATION", icon: "▱" },
  { id: "itinerary", label: "ITINERARY", icon: "▣" },
  { id: "budget", label: "BUDGET", icon: "$" },
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

export default function CeylonExplorer() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [activeTab, setActiveTab] = useState("recommendations");
  const [activeStop, setActiveStop] = useState(null);
  const [travelStyle, setTravelStyle] = useState("Solo");
  const [activeInterests, setActiveInterests] = useState([
    "beach",
    "mountain",
    "culture",
  ]);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [7.8, 80.5],
      zoom: 7,
      minZoom: 6,
      maxZoom: 11,
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

    const coords = STOPS.map((s) => [s.lat, s.lng]);

    L.polyline(coords, {
      color: "#38bdf8",
      weight: 8,
      opacity: 0.2,
    }).addTo(map);

    L.polyline(coords, {
      color: "#ffffff",
      weight: 2.8,
      opacity: 0.95,
      dashArray: "7,7",
    }).addTo(map);

    markersRef.current = STOPS.map((stop) =>
      L.marker([stop.lat, stop.lng], {
        icon: makePinIcon(DAY_COLORS[stop.day], stop.emoji),
      })
        .addTo(map)
        .bindPopup(`
          <div style="background:#071a33;color:white;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.12)">
            <b style="color:#f4c542">${stop.title}</b>
            <p style="font-size:12px;margin-top:6px;color:rgba(255,255,255,.7)">${stop.info}</p>
          </div>
        `)
    );

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

  const toggleInterest = (id) => {
    setActiveInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const flyToStop = (index) => {
    setActiveStop(index);
    setActiveTab("map");
    mapInstanceRef.current?.setView(
      [STOPS[index].lat, STOPS[index].lng],
      11,
      { animate: true }
    );
    markersRef.current[index]?.openPopup();
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
          <button className="hidden md:flex items-center gap-2 rounded-full border border-cyan-400/50 px-6 py-3 text-xs tracking-widest font-bold">
            PLAN YOUR TRIP <span>↗</span>
          </button>
        </div>
      </nav>

      <div className="h-[calc(100vh-74px)] flex overflow-hidden">
        <aside className="hidden lg:block w-[286px] shrink-0 bg-[#071a33] border-r border-white/10 rounded-tr-xl overflow-y-auto">
          <div className="p-5">
            <h2 className="font-serif text-sm font-bold mb-7">
              CREATE YOUR JOURNEY
            </h2>

            <SectionLabel step="STEP 1:" title="TRIP DURATION" />
            <div className="h-10 flex items-center justify-between rounded-lg bg-white/[0.07] border border-white/10 px-3 text-xs text-white/85 mb-6">
              <span>▣ OCT 10 – OCT 18, 2024 · 8 Days</span>
              <span>⌄</span>
            </div>

            <SectionLabel step="STEP 2:" title="YOUR INTERESTS" />
            <div className="grid grid-cols-2 gap-2 mb-7">
              {INTERESTS.map((item) => {
                const active = activeInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`h-[72px] rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                      active
                        ? "bg-white/[0.09] border-cyan-400/50"
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
              {["Solo", "Couple"].map((style) => (
                <button
                  key={style}
                  onClick={() => setTravelStyle(style)}
                  className={`rounded-full py-2 text-xs border transition ${
                    travelStyle === style
                      ? "border-cyan-400 bg-cyan-400/10 text-white"
                      : "border-white/15 text-white/60"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <button className="w-full h-12 rounded-lg bg-gradient-to-r from-[#d6a72d] to-[#f6d86b] text-[#130d03] text-xs tracking-[2px] font-bold mb-4">
              GENERATE 3D ITINERARY
            </button>

            <div className="rounded-xl bg-white/[0.035] border border-white/10 p-2">
              {STOPS.slice(0, 6).map((stop, i) => (
                <button
                  key={i}
                  onClick={() => flyToStop(i)}
                  className={`w-full flex items-center gap-2 px-2 py-3 rounded-lg border-b border-white/[0.06] last:border-none text-left ${
                    activeStop === i ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DAY_COLORS[stop.day] }}
                  />
                  <span className="flex-1 text-xs text-white/70">
                    {stop.label}
                  </span>
                  <span>{stop.emoji}</span>
                </button>
              ))}
            </div>

            <button className="w-full mt-3 h-10 rounded-lg border border-white/10 text-xs">
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
                    className={`min-w-max flex items-center gap-3 px-5 lg:px-8 h-[54px] text-xs font-bold tracking-[1.5px] border-b-2 transition ${
                      activeTab === tab.id
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

                  <div className="relative z-[500] grid lg:grid-cols-[360px_1fr] h-full">
                    <div className="p-6 lg:p-8">
                      <h1 className="font-serif text-4xl lg:text-5xl font-bold leading-none">
                        Ceylon{" "}
                        <span className="text-[#f4c542]">Explorer</span>
                      </h1>
                      <p className="mt-5 text-white/80">
                        8 Days <span className="mx-2 text-white/40">•</span> 7
                        Nights <span className="mx-2 text-white/40">•</span>{" "}
                        Sri Lanka
                      </p>

                      <div className="mt-7 grid grid-cols-3 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden">
                        <Stat number="12" label="Places" />
                        <Stat number="320 km" label="Total Distance" />
                        <Stat number="18h 45m" label="Est. Travel Time" />
                      </div>

                      <button
                        onClick={() => setActiveTab("map")}
                        className="mt-5 rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold hover:bg-white/10"
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
                    {["➤", "+", "−", "⛶"].map((x) => (
                      <button
                        key={x}
                        className="w-11 h-11 rounded-full lg:rounded-xl bg-[#061a33]/80 border border-white/10 text-xl"
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {activeTab === "recommendations" && (
                <Recommendations
                  activeStop={activeStop}
                  onView={flyToStop}
                />
              )}

              {activeTab === "map" && (
                <SimplePanel title="Map View" text="Use the 3D Sri Lanka map above to view the selected route and destination markers." />
              )}

              {activeTab === "accommodation" && (
                <Accommodation />
              )}

              {activeTab === "itinerary" && (
                <Itinerary onView={flyToStop} />
              )}

              {activeTab === "budget" && (
                <Budget />
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
    <div className="mb-2">
      <p className="text-[11px] text-white/35 tracking-widest mb-2">{step}</p>
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

function Recommendations({ activeStop, onView }) {
  return (
    <section className="px-3 lg:px-5 pb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">
            Recommended for your journey
          </h2>
          <p className="text-white/55 text-sm">
            Top places matched with your interests and travel style
          </p>
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg border border-white/15 px-5 py-3 text-sm">
            Filter ⚱
          </button>
          <button className="rounded-lg border border-white/15 px-5 py-3 text-sm">
            Sort by: Best Match ⌄
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {STOPS.slice(1, 7).map((stop, i) => (
          <RecommendationCard
            key={stop.title}
            stop={stop}
            active={activeStop === i + 1}
            onView={() => onView(i + 1)}
            topPick={i === 0}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({ stop, active, onView, topPick }) {
  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-[230px_1fr_120px_140px_180px_40px] gap-5 rounded-2xl border p-3 lg:p-4 bg-white/[0.04] transition ${
        active
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
        <p className="text-sm text-white/70 mt-3 leading-relaxed">
          {stop.info}
        </p>
      </div>

      <div className="flex xl:flex-col items-center justify-center border-white/10 xl:border-l xl:border-r gap-2">
        <span className="text-3xl font-bold text-green-400">
          {stop.match}%
        </span>
        <span className="text-sm">Match</span>
      </div>

      <div className="flex xl:flex-col justify-center gap-2 text-sm text-white/70">
        <p>☀️ Best Time</p>
        <p>🌞 {stop.bestTime}</p>
      </div>

      <div className="flex xl:flex-col justify-center gap-3">
        <button
          onClick={onView}
          className="rounded-lg border border-white/15 px-4 py-3 text-sm font-bold hover:bg-white/10"
        >
          ⌖ View on Map
        </button>
        <button className="rounded-lg bg-gradient-to-r from-[#d6a72d] to-[#f6d86b] text-black px-4 py-3 text-sm font-bold">
          Add to Trip +
        </button>
      </div>

      <div className="hidden xl:flex items-center justify-center text-2xl text-white/60">
        ♡
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

function Accommodation() {
  const hotels = [
    ["Cinnamon Lakeside", "Colombo", "$120 / night"],
    ["Sigiriya Jungle Resort", "Sigiriya", "$95 / night"],
    ["Earls Regency", "Kandy", "$110 / night"],
    ["Ella Green Hills", "Ella", "$90 / night"],
  ];

  return (
    <section className="p-5 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {hotels.map(([name, place, price]) => (
        <div
          key={name}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="h-36 rounded-xl bg-white/10 mb-4" />
          <h3 className="font-bold">{name}</h3>
          <p className="text-white/50 text-sm">{place}</p>
          <p className="text-[#f4c542] mt-2">★★★★★</p>
          <p className="mt-2">{price}</p>
          <button className="mt-4 w-full rounded-lg border border-white/15 py-3">
            View Details
          </button>
        </div>
      ))}
    </section>
  );
}

function Itinerary({ onView }) {
  return (
    <section className="p-5 space-y-3">
      {STOPS.map((stop, i) => (
        <button
          key={stop.label}
          onClick={() => onView(i)}
          className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.08]"
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: DAY_COLORS[stop.day] }}
          />
          <span className="text-2xl">{stop.emoji}</span>
          <div>
            <h3 className="font-bold">{stop.label}</h3>
            <p className="text-white/55 text-sm">{stop.info}</p>
          </div>
        </button>
      ))}
    </section>
  );
}

function Budget() {
  const rows = [
    ["Hotels", "$320"],
    ["Transport", "$180"],
    ["Food", "$140"],
    ["Activities", "$95"],
  ];

  return (
    <section className="p-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 max-w-xl">
        <h2 className="text-2xl font-bold mb-5">Budget Plan</h2>
        <div className="space-y-3">
          {rows.map(([label, price]) => (
            <div
              key={label}
              className="flex justify-between rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3"
            >
              <span className="text-white/70">{label}</span>
              <span className="font-bold">{price}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-between rounded-xl bg-[#f4c542]/15 border border-[#f4c542]/40 px-4 py-4">
          <span className="font-bold">Total</span>
          <span className="text-[#f4c542] font-bold">$735</span>
        </div>
      </div>
    </section>
  );
}