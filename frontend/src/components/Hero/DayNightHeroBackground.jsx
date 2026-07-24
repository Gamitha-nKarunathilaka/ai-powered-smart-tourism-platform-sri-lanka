import React, { useState, useEffect, useMemo } from "react";
import { Sunrise, Sun, Sunset, Moon, CloudRain, Cloud } from "lucide-react";

/* ---------- color / value interpolation helpers ---------- */

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.substring(0, 2), 16),
    g: parseInt(v.substring(2, 4), 16),
    b: parseInt(v.substring(4, 6), 16),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

// stops: [[hour, hexColor], ...] sorted ascending, hour 0 and hour 24 should match
function colorAtHour(hour, stops) {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < stops.length - 1; i++) {
    const [h0, c0] = stops[i];
    const [h1, c1] = stops[i + 1];
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0);
      return lerpColor(c0, c1, t);
    }
  }
  return stops[stops.length - 1][1];
}

// stops: [[hour, number], ...]
function valueAtHour(hour, stops) {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < stops.length - 1; i++) {
    const [h0, v0] = stops[i];
    const [h1, v1] = stops[i + 1];
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0);
      return lerp(v0, v1, t);
    }
  }
  return stops[stops.length - 1][1];
}

/* ---------- cycle data ---------- */

const SKY_TOP = [
  [0, "#05060f"], [5, "#0a0f22"], [6.5, "#141b34"], [7.5, "#1c2b46"],
  [9, "#123049"], [12, "#0e2a44"], [15, "#123049"], [17, "#1c2b46"],
  [18.5, "#171029"], [19.5, "#0a0f22"], [21, "#06070f"], [24, "#05060f"],
];

const SKY_BOTTOM = [
  [0, "#0a1024"], [5, "#131a3a"], [6.5, "#4b3a55"], [7.5, "#d98a63"],
  [9, "#2a6f86"], [12, "#1fb6d1"], [15, "#2a6f86"], [17, "#d98a63"],
  [18.5, "#5a3a5c"], [19.5, "#1c1440"], [21, "#0d1128"], [24, "#0a1024"],
];

const BRIGHTNESS = [
  [0, 0.04], [5, 0.04], [6.5, 0.25], [8, 0.7], [10, 0.92], [12, 1],
  [14, 0.92], [16, 0.7], [17.5, 0.35], [19, 0.1], [21, 0.04], [24, 0.04],
];

const STAR_OPACITY = [
  [0, 1], [4, 1], [5.5, 0.4], [7, 0], [17, 0], [18.5, 0.4],
  [20, 0.85], [22, 1], [24, 1],
];

const CLOUD_OPACITY = [
  [0, 0.12], [6, 0.28], [9, 0.5], [12, 0.55], [15, 0.5],
  [18, 0.3], [21, 0.15], [24, 0.12],
];

const DOT_COLOR = [
  [0, "#1a2b52"], [6, "#3a4f7a"], [7.5, "#d98a63"], [12, "#22d3ee"],
  [17, "#d98a63"], [18.5, "#5a3a5c"], [21, "#1a2b52"], [24, "#1a2b52"],
];

function phaseInfo(hour) {
  if (hour >= 5 && hour < 7) return { label: "Dawn", Icon: Sunrise };
  if (hour >= 7 && hour < 11) return { label: "Morning", Icon: Sun };
  if (hour >= 11 && hour < 15) return { label: "Midday", Icon: Sun };
  if (hour >= 15 && hour < 17.5) return { label: "Afternoon", Icon: Sun };
  if (hour >= 17.5 && hour < 19.5) return { label: "Sunset", Icon: Sunset };
  return { label: "Night", Icon: Moon };
}

function formatClock(hour) {
  const totalSeconds = Math.round(hour * 3600);
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${ampm}`;
}

// Maps a weather condition (from weather_service.py's get_weather_service,
// e.g. "Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm", "Mist") to
// visual modifiers: how much extra cloud cover to add, how much to dim
// the sky brightness, how much to desaturate toward grey, and whether
// to show falling rain.
function weatherModifiers(condition) {
  const c = String(condition || "").toLowerCase();

  if (c.includes("thunderstorm")) {
    return { cloudBoost: 0.55, brightnessMul: 0.5, greyOut: 0.55, rain: true, label: "Stormy" };
  }
  if (c.includes("rain") || c.includes("drizzle")) {
    return { cloudBoost: 0.45, brightnessMul: 0.65, greyOut: 0.4, rain: true, label: "Rainy" };
  }
  if (c.includes("cloud")) {
    return { cloudBoost: 0.3, brightnessMul: 0.85, greyOut: 0.22, rain: false, label: "Cloudy" };
  }
  if (c.includes("mist") || c.includes("fog") || c.includes("haze")) {
    return { cloudBoost: 0.25, brightnessMul: 0.78, greyOut: 0.3, rain: false, label: "Misty" };
  }
  if (c.includes("clear") || c.includes("sunny")) {
    return { cloudBoost: 0, brightnessMul: 1, greyOut: 0, rain: false, label: "Clear" };
  }
  // "Unknown" or unrecognized — no adjustment, sky follows the pure day/night cycle
  return { cloudBoost: 0, brightnessMul: 1, greyOut: 0, rain: false, label: null };
}

// Precomputed star field — random but stable across renders
function useStarField(count) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: Math.random() * 62,
      left: Math.random() * 100,
      size: Math.random() * 1.6 + 0.6,
      delay: Math.random() * 4,
      duration: 2.5 + Math.random() * 2.5,
    }));
  }, [count]);
}

/* ---------- main component ---------- */

export default function DayNightHeroBackground({
  mode = "real",            // "real" (actual local time) | "demo" (fast loop, for testing)
  demoCycleSeconds = 42,    // only used when mode="demo"
  showClock = true,
  clockTopClass = "top-28", // Tailwind top-* offset — bump this to clear a fixed navbar
  showDotGrid = true,
  useWeather = false,
  weatherCity = "Colombo",
  weatherApiUrl = "/api/weather",
  weatherRefreshMinutes = 10,
  className = "",
}) {
  const [hour, setHour] = useState(mode === "real" ? new Date().getHours() + new Date().getMinutes() / 60 : 8);
  const [weatherCondition, setWeatherCondition] = useState(null);

  useEffect(() => {
    const tickMs = 100;
    const interval = setInterval(() => {
      if (mode === "real") {
        const now = new Date();
        setHour(now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);
      } else {
        setHour((prev) => (prev + (24 / demoCycleSeconds) * (tickMs / 1000)) % 24);
      }
    }, tickMs);
    return () => clearInterval(interval);
  }, [mode, demoCycleSeconds]);

  // Fetch live weather periodically (default every 10 min) via the
  // backend's /api/weather endpoint, which wraps weather_service.py's
  // get_weather_service(). Falls back silently to no weather effect
  // (pure day/night cycle) if the request fails or useWeather is off —
  // this is a background decoration, so it should never block or error
  // the page if the backend/API key isn't available.
  useEffect(() => {
    if (!useWeather) return;

    let cancelled = false;

    async function fetchWeather() {
      try {
        const res = await fetch(`${weatherApiUrl}?city=${encodeURIComponent(weatherCity)}`);
        const data = await res.json();
        if (!cancelled && data && data.condition) {
          setWeatherCondition(data.condition);
        }
      } catch (e) {
        // Silent — background sky decoration shouldn't surface errors.
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, weatherRefreshMinutes * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [useWeather, weatherCity, weatherApiUrl, weatherRefreshMinutes]);

  const weather = useMemo(() => weatherModifiers(weatherCondition), [weatherCondition]);

  const skyTopRaw = colorAtHour(hour, SKY_TOP);
  const skyBottomRaw = colorAtHour(hour, SKY_BOTTOM);
  const brightness = Math.max(0.04, valueAtHour(hour, BRIGHTNESS) * weather.brightnessMul);
  const starOpacity = valueAtHour(hour, STAR_OPACITY);
  const cloudOpacity = Math.min(1, valueAtHour(hour, CLOUD_OPACITY) + weather.cloudBoost);
  const dotColor = colorAtHour(hour, DOT_COLOR);

  // Weather "grey-out": blend the sky toward an overcast grey when
  // cloudy/rainy/stormy, so mornings (and any hour) visibly reflect
  // current conditions rather than always showing a clear-sky gradient.
  const OVERCAST_GREY = "#5c6470";
  const skyTop = weather.greyOut > 0 ? lerpColor(skyTopRaw, OVERCAST_GREY, weather.greyOut) : skyTopRaw;
  const skyBottom = weather.greyOut > 0 ? lerpColor(skyBottomRaw, OVERCAST_GREY, weather.greyOut) : skyBottomRaw;

  const stars = useStarField(70);
  const { label, Icon } = phaseInfo(hour);

  // Sun visible 5:30–18:30, Moon visible 18:00–6:00 (with soft fade at edges)
  const sunWindow = { start: 5.5, end: 18.5 };
  const moonWindow = { start: 18, end: 30 }; // 30 = 6am next day, handled via wrap below

  function arcPosition(h, win) {
    const span = win.end - win.start;
    let hh = h;
    if (hh < win.start) hh += 24;
    const t = (hh - win.start) / span;
    if (t < 0 || t > 1) return null;
    const fade = Math.min(1, Math.min(t, 1 - t) * 8); // fade in/out near horizon
    return {
      leftPct: t * 100,
      topPct: 82 - 62 * Math.sin(Math.PI * t),
      opacity: Math.max(0, fade),
    };
  }

  const sunPos = arcPosition(hour, sunWindow);
  const moonPos = arcPosition(hour, moonWindow);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes dn-twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @keyframes dn-drift {
          from { left: -25%; }
          to { left: 115%; }
        }
        @keyframes dn-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes dn-rainfall {
          from { transform: translateY(-10%); }
          to { transform: translateY(110%); }
        }
      `}</style>

      {/* sky gradient backdrop */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 100%)`,
          opacity: 0.9,
        }}
      />

      {/* stars */}
      <div className="absolute inset-0" style={{ opacity: starOpacity, transition: "opacity 0.8s" }}>
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animation: `dn-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* clouds */}
      <div className="absolute inset-0" style={{ opacity: cloudOpacity, transition: "opacity 0.8s" }}>
        {[
          { top: "12%", w: 320, h: 60, dur: 50, delay: 0 },
          { top: "22%", w: 240, h: 46, dur: 65, delay: -22 },
          { top: "8%", w: 200, h: 38, dur: 42, delay: -10 },
          { top: "28%", w: 280, h: 52, dur: 58, delay: -35 },
          { top: "17%", w: 180, h: 34, dur: 36, delay: -5 },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-2xl bg-white/80"
            style={{
              top: c.top,
              width: c.w,
              height: c.h,
              left: "-25%",
              animation: `dn-drift ${c.dur}s linear ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* rain — shown when live weather is Rain/Drizzle/Thunderstorm */}
      {weather.rain && (
        <div className="absolute inset-0" style={{ opacity: 0.5 }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 1.2;
            const duration = 0.5 + Math.random() * 0.4;
            return (
              <div
                key={i}
                className="absolute bg-cyan-100/40"
                style={{
                  left: `${left}%`,
                  top: 0,
                  width: 1,
                  height: 14,
                  animation: `dn-rainfall ${duration}s linear ${delay}s infinite`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* dot grid, color synced to cycle */}
      {showDotGrid && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1.4px)`,
            backgroundSize: "24px 24px",
            opacity: 0.35,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* sun */}
      {sunPos && (
        <div
          className="absolute rounded-full"
          style={{
            left: `${sunPos.leftPct}%`,
            top: `${sunPos.topPct}%`,
            width: 30,
            height: 30,
            marginLeft: -15,
            marginTop: -15,
            opacity: sunPos.opacity,
            background: "radial-gradient(circle, #fff2cf 0%, #ffcf6b 55%, rgba(255,207,107,0) 100%)",
            boxShadow: `0 0 ${24 + brightness * 30}px ${8 + brightness * 10}px rgba(255,207,107,${0.35 * brightness + 0.1})`,
            animation: "dn-pulse 6s ease-in-out infinite",
          }}
        />
      )}

      {/* moon */}
      {moonPos && (
        <div
          className="absolute rounded-full"
          style={{
            left: `${moonPos.leftPct}%`,
            top: `${moonPos.topPct}%`,
            width: 24,
            height: 24,
            marginLeft: -12,
            marginTop: -12,
            opacity: moonPos.opacity,
            background: "radial-gradient(circle at 35% 35%, #f3f6ff 0%, #cfd9f0 60%, rgba(207,217,240,0) 100%)",
            boxShadow: "0 0 22px 6px rgba(180,200,255,0.35)",
          }}
        >
          <div className="absolute rounded-full bg-black/10" style={{ top: 5, left: 6, width: 4, height: 4 }} />
          <div className="absolute rounded-full bg-black/10" style={{ top: 12, left: 13, width: 3, height: 3 }} />
        </div>
      )}

      {/* horizon glow line */}
      <div
        className="absolute left-0 right-0 transition-colors duration-700"
        style={{
          bottom: "16%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${skyBottom}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* clock badge */}
    
    </div>
  );
}