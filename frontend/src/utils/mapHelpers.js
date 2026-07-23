// utils/mapHelpers.js
// Pure functions only — no React, no DOM. Safe to unit test in isolation.

export function safeNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function getCategoryEmoji(category = "") {
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

export function mapApiPlacesToStops(apiPlaces = []) {
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

export function getPlacesFromApiResponse(data) {
  if (!data) return [];

  if (Array.isArray(data.selected_places)) return data.selected_places;
  if (Array.isArray(data.optimized_places)) return data.optimized_places;
  if (Array.isArray(data.recommendations)) return data.recommendations;
  if (Array.isArray(data.places)) return data.places;

  return [];
}

export function getRouteCoordinatesFromApiResponse(data) {
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