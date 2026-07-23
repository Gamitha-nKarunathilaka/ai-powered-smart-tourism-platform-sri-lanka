// utils/mapIcons.js
import L from "leaflet";

export function makeIcon(color, emoji) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:34px;height:34px;background:${color};border:3px solid white;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 10px 24px rgba(0,0,0,.45);
      ">
        <span style="transform:rotate(45deg);font-size:15px">${emoji}</span>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  });
}