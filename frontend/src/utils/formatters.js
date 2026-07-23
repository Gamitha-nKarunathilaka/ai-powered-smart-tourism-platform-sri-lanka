// utils/formatters.js
export function formatDuration(seconds = 0) {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours === 0 ? `${minutes} min` : `${hours}h ${minutes}m`;
}

export function formatStepDistance(distance = 0) {
  return distance < 1000
    ? `${Math.round(distance)} m`
    : `${(distance / 1000).toFixed(1)} km`;
}

export function getDirectionIcon(type) {
  const icons = {
    0: "↰", 1: "↱", 2: "⬅", 3: "➡", 4: "↖", 5: "↗", 6: "↑",
    7: "⟳", 8: "↗", 9: "↩", 10: "🏁", 11: "🚗", 12: "↖", 13: "↗",
  };
  return icons[type] || "↑";
}