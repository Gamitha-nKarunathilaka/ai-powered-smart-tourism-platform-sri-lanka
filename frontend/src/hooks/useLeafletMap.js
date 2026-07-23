// hooks/useLeafletMap.js
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { makePinIcon } from "../utils/leafletIcons";
import { safeNumber } from "../utils/mapHelpers";
import { DAY_COLORS } from "../constant";

export function useLeafletMap({ tripStops, routeCoordinates }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayersRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current || mapRef.current._leaflet_id) {
      return;
    }

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

    let cancelled = false;
    const resizeTimer = setTimeout(() => {
      if (cancelled || mapInstanceRef.current !== map) return;
      map.invalidateSize();
      map.fitBounds(imageBounds);
    }, 300);

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

    markersRef.current = validStops.map((stop) => {
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

    map.fitBounds(stopCoords, { padding: [40, 40] });
  }, [tripStops, routeCoordinates]);

  const flyToStop = (index, stop) => {
    if (!stop) return;
    mapInstanceRef.current?.setView([Number(stop.lat), Number(stop.lng)], 11, {
      animate: true,
    });
    markersRef.current[index]?.openPopup();
  };

  const zoomIn = () => mapInstanceRef.current?.zoomIn();
  const zoomOut = () => mapInstanceRef.current?.zoomOut();

  const fitAllStops = () => {
    const coords = tripStops
      .filter((s) => safeNumber(s.lat) !== null && safeNumber(s.lng) !== null)
      .map((s) => [Number(s.lat), Number(s.lng)]);

    if (coords.length > 0) {
      mapInstanceRef.current?.fitBounds(coords, { padding: [40, 40] });
    }
  };

  return { mapRef, flyToStop, zoomIn, zoomOut, fitAllStops };
}