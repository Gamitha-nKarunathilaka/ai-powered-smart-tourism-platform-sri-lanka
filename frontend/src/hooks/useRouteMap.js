// hooks/useRouteMap.js
import { useEffect, useRef } from "react";
import L from "leaflet";
import { makeIcon } from "../utils/mapIcons";

export function useRouteMap({ displayedRoute, routeGeoJson }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeCoordinatesRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current || mapRef.current._leaflet_id) {
      return;
    }

    const map = L.map(mapRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    map.createPane("routePane");
    map.getPane("routePane").style.zIndex = "450";
    map.getPane("routePane").style.pointerEvents = "none";

    mapInstanceRef.current = map;

    let cancelled = false;
    const resizeTimer = window.setTimeout(() => {
      if (cancelled || mapInstanceRef.current !== map) return;
      map.invalidateSize(true);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      map.remove();
      if (mapInstanceRef.current === map) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || displayedRoute.length < 2) return;

    if (layerRef.current) layerRef.current.remove();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    let boundsLayer;

    if (routeGeoJson) {
      const coordinates = routeGeoJson?.features?.[0]?.geometry?.coordinates ?? [];
      const routeLatLngs = coordinates.map(([lng, lat]) => [lat, lng]);
      routeCoordinatesRef.current = routeLatLngs;

      L.polyline(routeLatLngs, {
        pane: "routePane", color: "#38bdf8", weight: 12, opacity: 0.25,
        lineCap: "round", lineJoin: "round",
      }).addTo(group);

      boundsLayer = L.polyline(routeLatLngs, {
        pane: "routePane", color: "#f4c542", weight: 6, opacity: 1,
        lineCap: "round", lineJoin: "round",
      }).addTo(group);
    } else {
      const previewCoordinates = displayedRoute.map((place) => [place.lat, place.lng]);
      routeCoordinatesRef.current = [];

      L.polyline(previewCoordinates, {
        pane: "routePane", color: "#38bdf8", weight: 10, opacity: 0.18,
      }).addTo(group);

      boundsLayer = L.polyline(previewCoordinates, {
        pane: "routePane", color: "#f4c542", weight: 4, opacity: 0.95, dashArray: "8,8",
      }).addTo(group);
    }

    displayedRoute.forEach((place, index) => {
      const isStart = index === 0;
      const isEnd = index === displayedRoute.length - 1;
      const color = isStart ? "#22c55e" : isEnd ? "#ef4444" : "#f4c542";
      const emoji = isStart ? "🚩" : isEnd ? "🏁" : place.emoji;

      L.marker([place.lat, place.lng], { icon: makeIcon(color, emoji) })
        .addTo(group)
        .bindPopup(`
          <div style="background:#071a33;color:white;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.15)">
            <b style="color:#f4c542">${index + 1}. ${place.name}</b>
            <p style="font-size:12px;margin-top:6px;color:rgba(255,255,255,.7)">${place.type}</p>
          </div>
        `);
    });

    const bounds = boundsLayer.getBounds();
    if (bounds.isValid()) {
      map.invalidateSize(true);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [displayedRoute, routeGeoJson]);

  const mapApi = {
    flyTo(latlng, zoom, options) {
      mapInstanceRef.current?.flyTo(latlng, zoom, options);
    },
    panTo(latlng) {
      mapInstanceRef.current?.panTo(latlng);
    },
    fitBounds(coords, options) {
      mapInstanceRef.current?.fitBounds(coords, options);
    },
    invalidateSize() {
      mapInstanceRef.current?.invalidateSize(true);
    },
    getRouteCoordinates() {
      return routeCoordinatesRef.current;
    },
    setUserMarker(lat, lng) {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 10, color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1,
        }).addTo(map).bindPopup("Your current location");
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }
    },
    openUserMarkerPopup() {
      userMarkerRef.current?.openPopup();
    },
    removeUserMarker() {
      if (userMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    },
  };

  return { mapRef, mapApi };
}