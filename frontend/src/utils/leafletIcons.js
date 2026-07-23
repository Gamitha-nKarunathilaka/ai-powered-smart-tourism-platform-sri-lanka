// utils/leafletIcons.js

import L from "leaflet";

export function makePinIcon(color, emoji) {
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