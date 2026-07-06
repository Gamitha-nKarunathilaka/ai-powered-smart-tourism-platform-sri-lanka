import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
  Project root .env file:
  VITE_ORS_API_KEY=your_full_openrouteservice_key

  Restart Vite after editing .env:
  npm run dev
*/

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

const DESTINATIONS = [
  { id: 1, name: "Colombo", lat: 6.9271, lng: 79.8612, type: "City", emoji: "🏙️" },
  { id: 2, name: "Sigiriya", lat: 7.957, lng: 80.7603, type: "Heritage", emoji: "🪨" },
  { id: 3, name: "Kandy", lat: 7.2906, lng: 80.6337, type: "Culture", emoji: "🛕" },
  { id: 4, name: "Nuwara Eliya", lat: 6.9497, lng: 80.7891, type: "Mountain", emoji: "🍃" },
  { id: 5, name: "Ella", lat: 6.8667, lng: 81.0466, type: "Hiking", emoji: "🌄" },
  { id: 6, name: "Mirissa", lat: 5.9483, lng: 80.455, type: "Beach", emoji: "🐋" },
  { id: 7, name: "Galle", lat: 6.0269, lng: 80.217, type: "Fort", emoji: "🏰" },
];

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function buildPreviewRoute(start, destinations, end) {
  const unvisited = [...destinations];
  const route = [start];
  let current = start;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    unvisited.forEach((place, index) => {
      const distance = distanceKm(current, place);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const next = unvisited.splice(nearestIndex, 1)[0];
    route.push(next);
    current = next;
  }

  route.push(end);
  return route;
}

function makeIcon(color, emoji) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:34px;
        height:34px;
        background:${color};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
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

function formatDuration(seconds = 0) {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours === 0 ? `${minutes} min` : `${hours}h ${minutes}m`;
}

function formatStepDistance(distance = 0) {
  return distance < 1000
    ? `${Math.round(distance)} m`
    : `${(distance / 1000).toFixed(1)} km`;
}

function getDirectionIcon(type) {
  const icons = {
    0: "↰",
    1: "↱",
    2: "⬅",
    3: "➡",
    4: "↖",
    5: "↗",
    6: "↑",
    7: "⟳",
    8: "↗",
    9: "↩",
    10: "🏁",
    11: "🚗",
    12: "↖",
    13: "↗",
  };

  return icons[type] || "↑";
}

function speakDirection(instruction) {
  if (!instruction || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const message = new SpeechSynthesisUtterance(instruction);
  message.lang = "en-US";
  message.rate = 0.95;
  message.pitch = 1;

  window.speechSynthesis.speak(message);
}

function getCurrentDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser does not support location services."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          id: "current-location",
          name: "Current Location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          type: "Live GPS Location",
          emoji: "📍",
        });
      },
      (locationError) => {
        if (locationError.code === 1) {
          reject(new Error("Location permission was denied."));
        } else if (locationError.code === 2) {
          reject(new Error("Current location is unavailable."));
        } else {
          reject(new Error("Location request timed out."));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  });
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  const routeCoordinatesRef = useRef([]);
  const routeStepsRef = useRef([]);
  const activeStepRef = useRef(0);

  const [startId, setStartId] = useState(1);
  const [endId, setEndId] = useState(7);
  const [selectedIds, setSelectedIds] = useState([2, 3, 4, 5, 6]);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [useCurrentAsStart, setUseCurrentAsStart] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [routeOrder, setRouteOrder] = useState([]);
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [navigationStarted, setNavigationStarted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedStart = DESTINATIONS.find(
    (destination) => destination.id === Number(startId)
  );

  const end = DESTINATIONS.find(
    (destination) => destination.id === Number(endId)
  );

  const routeStart =
    useCurrentAsStart && currentLocation
      ? currentLocation
      : selectedStart;

  const selectedPlaces = useMemo(
    () =>
      DESTINATIONS.filter((destination) => {
        const isSelected = selectedIds.includes(destination.id);
        const isEnd = destination.id === Number(endId);
        const isManualStart =
          !useCurrentAsStart &&
          destination.id === Number(startId);

        return isSelected && !isEnd && !isManualStart;
      }),
    [selectedIds, startId, endId, useCurrentAsStart]
  );

  const previewRoute = useMemo(
    () => buildPreviewRoute(routeStart, selectedPlaces, end),
    [routeStart, selectedPlaces, end]
  );

  const displayedRoute =
    routeOrder.length > 0 ? routeOrder : previewRoute;

  const previewDistance = useMemo(
    () =>
      previewRoute
        .slice(0, -1)
        .reduce(
          (sum, place, index) =>
            sum + distanceKm(place, previewRoute[index + 1]),
          0
        ),
    [previewRoute]
  );

  useEffect(() => {
    routeStepsRef.current = routeSteps;
  }, [routeSteps]);

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
      }
    ).addTo(map);

    map.createPane("routePane");
    map.getPane("routePane").style.zIndex = "450";
    map.getPane("routePane").style.pointerEvents = "none";

    mapInstanceRef.current = map;

    window.setTimeout(() => {
      map.invalidateSize(true);
    }, 200);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      window.speechSynthesis?.cancel();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || displayedRoute.length < 2) return;

    if (layerRef.current) {
      layerRef.current.remove();
    }

    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    let boundsLayer;

    if (routeGeoJson) {
      const coordinates =
        routeGeoJson?.features?.[0]?.geometry?.coordinates ?? [];

      const routeLatLngs = coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);

      routeCoordinatesRef.current = routeLatLngs;

      L.polyline(routeLatLngs, {
        pane: "routePane",
        color: "#38bdf8",
        weight: 12,
        opacity: 0.25,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      boundsLayer = L.polyline(routeLatLngs, {
        pane: "routePane",
        color: "#f4c542",
        weight: 6,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);
    } else {
      const previewCoordinates = displayedRoute.map((place) => [
        place.lat,
        place.lng,
      ]);

      routeCoordinatesRef.current = [];

      L.polyline(previewCoordinates, {
        pane: "routePane",
        color: "#38bdf8",
        weight: 10,
        opacity: 0.18,
      }).addTo(group);

      boundsLayer = L.polyline(previewCoordinates, {
        pane: "routePane",
        color: "#f4c542",
        weight: 4,
        opacity: 0.95,
        dashArray: "8,8",
      }).addTo(group);
    }

    displayedRoute.forEach((place, index) => {
      const isStart = index === 0;
      const isEnd = index === displayedRoute.length - 1;
      const color = isStart
        ? "#22c55e"
        : isEnd
          ? "#ef4444"
          : "#f4c542";

      const emoji = isStart
        ? "🚩"
        : isEnd
          ? "🏁"
          : place.emoji;

      L.marker([place.lat, place.lng], {
        icon: makeIcon(color, emoji),
      })
        .addTo(group)
        .bindPopup(`
          <div style="
            background:#071a33;
            color:white;
            padding:12px;
            border-radius:14px;
            border:1px solid rgba(255,255,255,.15)
          ">
            <b style="color:#f4c542">${index + 1}. ${place.name}</b>
            <p style="font-size:12px;margin-top:6px;color:rgba(255,255,255,.7)">
              ${place.type}
            </p>
          </div>
        `);
    });

    const bounds = boundsLayer.getBounds();

    if (bounds.isValid()) {
      map.invalidateSize(true);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [displayedRoute, routeGeoJson]);

  useEffect(() => {
    if (!navigationStarted || !routeSteps[activeStep]) return;

    speakDirection(routeSteps[activeStep].instruction);
  }, [activeStep, navigationStarted, routeSteps]);

  async function enableCurrentLocationStart() {
    setError("");
    setLocationLoading(true);

    try {
      const location = await getCurrentDeviceLocation();

      resetGeneratedRoute();
      setCurrentLocation(location);
      setUseCurrentAsStart(true);

      const map = mapInstanceRef.current;

      if (map) {
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.circleMarker(
            [location.lat, location.lng],
            {
              radius: 10,
              color: "#ffffff",
              weight: 3,
              fillColor: "#2563eb",
              fillOpacity: 1,
            }
          )
            .addTo(map)
            .bindPopup("Your current location");
        } else {
          userMarkerRef.current.setLatLng([
            location.lat,
            location.lng,
          ]);
        }

        userMarkerRef.current.openPopup();

        map.flyTo([location.lat, location.lng], 14, {
          animate: true,
          duration: 1,
        });
      }
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : "Unable to get your current location."
      );
    } finally {
      setLocationLoading(false);
    }
  }

  function disableCurrentLocationStart() {
    setUseCurrentAsStart(false);
    resetGeneratedRoute();

    if (
      userMarkerRef.current &&
      mapInstanceRef.current &&
      !navigationStarted
    ) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
  }

  async function generateBestRoadRoute() {
    setError("");

    if (!ORS_API_KEY) {
      setError(
        "VITE_ORS_API_KEY is missing. Add the full key to the project root .env file and restart npm run dev."
      );
      return;
    }

    if (!routeStart || !end) {
      setError("Please select valid start and end destinations.");
      return;
    }

    if (
      !useCurrentAsStart &&
      routeStart.id === end.id
    ) {
      setError("Start and end destinations must be different.");
      return;
    }

    setLoading(true);

    try {
      let optimizedStops = selectedPlaces;

      if (selectedPlaces.length > 0) {
        const optimizationResponse = await fetch(
          "https://api.openrouteservice.org/optimization",
          {
            method: "POST",
            headers: {
              Authorization: ORS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jobs: selectedPlaces.map((place) => ({
                id: place.id,
                location: [place.lng, place.lat],
              })),
              vehicles: [
                {
                  id: 1,
                  profile: "driving-car",
                  start: [routeStart.lng, routeStart.lat],
                  end: [end.lng, end.lat],
                },
              ],
            }),
          }
        );

        if (!optimizationResponse.ok) {
          const responseText =
            await optimizationResponse.text();

          throw new Error(
            `Optimization failed (${optimizationResponse.status}): ${responseText}`
          );
        }

        const optimizationData =
          await optimizationResponse.json();

        const optimizedRoute =
          optimizationData?.routes?.[0];

        if (!optimizedRoute) {
          throw new Error(
            "OpenRouteService returned no optimized route."
          );
        }

        optimizedStops = optimizedRoute.steps
          .filter((step) => step.type === "job")
          .map((step) =>
            DESTINATIONS.find(
              (destination) =>
                destination.id === step.job
            )
          )
          .filter(Boolean);
      }

      const fullOrder = [
        routeStart,
        ...optimizedStops,
        end,
      ];

      const coordinates = fullOrder.map((place) => [
        place.lng,
        place.lat,
      ]);

      const directionsResponse = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates,
            instructions: true,
            geometry: true,
            language: "en",
          }),
        }
      );

      if (!directionsResponse.ok) {
        const responseText =
          await directionsResponse.text();

        throw new Error(
          `Directions failed (${directionsResponse.status}): ${responseText}`
        );
      }

      const directionsData =
        await directionsResponse.json();

      const feature =
        directionsData?.features?.[0];

      const summary =
        feature?.properties?.summary;

      const geometryCoordinates =
        feature?.geometry?.coordinates;

      if (!summary) {
        throw new Error(
          "OpenRouteService returned no directions summary."
        );
      }

      if (
        !Array.isArray(geometryCoordinates) ||
        geometryCoordinates.length < 2
      ) {
        throw new Error(
          "OpenRouteService returned no route geometry."
        );
      }

      const steps =
        feature?.properties?.segments?.flatMap(
          (segment) => segment.steps || []
        ) || [];

      setRouteOrder(fullOrder);
      setRouteSummary(summary);
      setRouteSteps(steps);
      setActiveStep(0);
      setRouteGeoJson(directionsData);
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate the route."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetGeneratedRoute() {
    stopNavigation();
    setRouteOrder([]);
    setRouteGeoJson(null);
    setRouteSummary(null);
    setRouteSteps([]);
    setActiveStep(0);
    setError("");
  }

  function toggleDestination(id) {
    resetGeneratedRoute();

    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter(
            (destinationId) => destinationId !== id
          )
        : [...previous, id]
    );
  }

  function handleStartChange(value) {
    setUseCurrentAsStart(false);
    setStartId(Number(value));
    resetGeneratedRoute();
  }

  function handleEndChange(value) {
    setEndId(Number(value));
    resetGeneratedRoute();
  }

  function fitRoute() {
    const map = mapInstanceRef.current;
    if (!map || displayedRoute.length < 2) return;

    if (routeCoordinatesRef.current.length > 1) {
      map.fitBounds(
        routeCoordinatesRef.current,
        { padding: [60, 60] }
      );
      return;
    }

    map.fitBounds(
      displayedRoute.map((place) => [
        place.lat,
        place.lng,
      ]),
      { padding: [60, 60] }
    );
  }

  function focusDirectionStep(index) {
    setActiveStep(index);

    const step = routeSteps[index];
    const pointIndex = step?.way_points?.[0];
    const coordinate =
      routeCoordinatesRef.current[pointIndex];

    if (coordinate && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        coordinate,
        16,
        {
          animate: true,
          duration: 0.8,
        }
      );
    }
  }

  function startNavigation() {
    if (routeSteps.length === 0) {
      setError(
        "Generate the road route before starting navigation."
      );
      return;
    }

    if (!navigator.geolocation) {
      setError(
        "Location tracking is not supported by this browser."
      );
      return;
    }

    setError("");
    setNavigationStarted(true);
    setActiveStep(0);
    speakDirection(routeSteps[0]?.instruction);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );
    }

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const map = mapInstanceRef.current;
          if (!map) return;

          const lat =
            position.coords.latitude;

          const lng =
            position.coords.longitude;

          const currentLatLng =
            L.latLng(lat, lng);

          if (!userMarkerRef.current) {
            userMarkerRef.current =
              L.circleMarker([lat, lng], {
                radius: 9,
                color: "#ffffff",
                weight: 3,
                fillColor: "#2563eb",
                fillOpacity: 1,
              })
                .addTo(map)
                .bindPopup(
                  "Your current location"
                );
          } else {
            userMarkerRef.current.setLatLng([
              lat,
              lng,
            ]);
          }

          map.panTo([lat, lng]);

          const currentStepIndex =
            activeStepRef.current;

          const currentStep =
            routeStepsRef.current[
              currentStepIndex
            ];

          const endPointIndex =
            currentStep?.way_points?.[1];

          const stepEndCoordinate =
            routeCoordinatesRef.current[
              endPointIndex
            ];

          if (stepEndCoordinate) {
            const remainingDistance =
              currentLatLng.distanceTo(
                L.latLng(stepEndCoordinate)
              );

            if (
              remainingDistance < 60 &&
              currentStepIndex <
                routeStepsRef.current.length - 1
            ) {
              setActiveStep(
                currentStepIndex + 1
              );
            }
          }
        },
        (locationError) => {
          console.error(locationError);

          if (locationError.code === 1) {
            setError(
              "Location permission was denied."
            );
          } else {
            setError(
              "Unable to access the current device location."
            );
          }

          setNavigationStarted(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 15000,
        }
      );
  }

  function stopNavigation() {
    setNavigationStarted(false);
    window.speechSynthesis?.cancel();

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }
  }

  return (
    <div className="min-h-screen  text-white">
      <div className="min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-[360px_1fr] lg:overflow-hidden">
        <aside className="z-[700] bg-[#071a33]/95 border-r border-white/10 p-5 overflow-y-auto">
          <h1 className="text-2xl font-bold">
            Real Road{" "}
            <span className="text-[#f4c542]">
              Planner
            </span>
          </h1>

          <p className="text-white/55 text-sm mt-1">
            ORS optimized road route with current-location navigation.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={enableCurrentLocationStart}
              disabled={locationLoading}
              className={`w-full rounded-xl border px-4 py-3 font-semibold transition ${
                useCurrentAsStart
                  ? "border-blue-400 bg-blue-500/20 text-blue-200"
                  : "border-white/15 bg-white/[0.05] hover:bg-white/10"
              } disabled:opacity-50`}
            >
              {locationLoading
                ? "GETTING CURRENT LOCATION..."
                : useCurrentAsStart
                  ? "📍 CURRENT LOCATION SELECTED"
                  : "◎ USE MY CURRENT LOCATION"}
            </button>

            {useCurrentAsStart && (
              <button
                type="button"
                onClick={disableCurrentLocationStart}
                className="w-full rounded-xl border border-white/10 py-2 text-xs text-white/60 hover:bg-white/10"
              >
                Use selected start destination instead
              </button>
            )}

            <DestinationSelect
              label="Start Destination"
              value={startId}
              onChange={handleStartChange}
              disabled={useCurrentAsStart}
            />

            <DestinationSelect
              label="End Destination"
              value={endId}
              onChange={handleEndChange}
            />
          </div>

          <div className="mt-6">
            <h2 className="text-sm  mb-3">
              Select Places to Cover
            </h2>

            <div className="space-y-2">
              {DESTINATIONS.map((place) => {
                const disabled =
                  place.id === Number(endId) ||
                  (
                    !useCurrentAsStart &&
                    place.id === Number(startId)
                  );

                const selected =
                  selectedIds.includes(place.id) ||
                  disabled;

                return (
                  <button
                    type="button"
                    key={place.id}
                    disabled={disabled}
                    onClick={() =>
                      toggleDestination(place.id)
                    }
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "bg-[#f4c542]/15 border-[#f4c542]/50"
                        : "bg-white/[0.05] border-white/10"
                    } ${
                      disabled
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xl">
                      {place.emoji}
                    </span>

                    <div className="flex-1">
                      <p className="font-semibold">
                        {place.name}
                      </p>

                      <p className="text-xs text-white/45">
                        {place.type}
                      </p>
                    </div>

                    <span className="text-xs text-white/60">
                      {disabled
                        ? "Fixed"
                        : selectedIds.includes(
                              place.id
                            )
                          ? "Added"
                          : "Add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/[0.06] border border-white/10 p-4">
            <p className="text-white/55 text-sm">
              Start
            </p>

            <p className="font-semibold mt-1">
              {routeStart?.emoji}{" "}
              {routeStart?.name}
            </p>

            <p className="text-white/55 text-sm mt-4">
              {routeSummary
                ? "Real Road Distance"
                : "Preview Distance"}
            </p>

            <h3 className="text-3xl font-semibold text-[#f4c542] mt-1">
              {routeSummary
                ? `${(
                    routeSummary.distance / 1000
                  ).toFixed(1)} km`
                : `${previewDistance.toFixed(
                    0
                  )} km`}
            </h3>

            {routeSummary ? (
              <>
                <p className="text-white/55 text-sm mt-4">
                  Estimated Driving Time
                </p>

                <h3 className="text-2xl font-bold mt-1">
                  {formatDuration(
                    routeSummary.duration
                  )}
                </h3>
              </>
            ) : (
              <p className="text-white/45 text-xs mt-1">
                Generate the route to calculate real road information.
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200 break-words">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={generateBestRoadRoute}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#d6a72d] to-[#f6d86b] text-black font-bold py-4 disabled:opacity-60 disabled:cursor-wait"
          >
            {loading
              ? "GENERATING ROUTE..."
              : "GENERATE BEST ROAD ROUTE"}
          </button>

          {!navigationStarted ? (
            <button
              type="button"
              onClick={startNavigation}
              disabled={routeSteps.length === 0}
              className="mt-3 w-full rounded-xl bg-green-500 text-white font-bold py-4 disabled:opacity-40"
            >
              START NAVIGATION
            </button>
          ) : (
            <button
              type="button"
              onClick={stopNavigation}
              className="mt-3 w-full rounded-xl bg-red-500 text-white font-bold py-4"
            >
              STOP NAVIGATION
            </button>
          )}

          <button
            type="button"
            onClick={fitRoute}
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 font-semibold hover:bg-white/10"
          >
            FIT FULL ROUTE
          </button>
        </aside>

        <main className="relative min-h-[760px] lg:min-h-0 overflow-hidden bg-gradient-to-br from-[#020617] via-[#06314d] to-[#020617]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.25),transparent_55%)] animate-pulse" />
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent)]" />
          <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,.85)]" />

          <div className="absolute top-5 left-5 right-5 z-[650] flex items-center justify-between rounded-2xl bg-[#071a33]/80 border border-white/10 backdrop-blur-xl px-5 py-4">
            <div>
              <h2 className="font-bold text-lg">
                Sri Lanka Turn-by-Turn Route
              </h2>

              <p className="text-white/50 text-xs">
                {routeGeoJson
                  ? `Optimized road route from ${routeStart.name} to ${end.name}`
                  : `Preview route from ${routeStart.name} to ${end.name}`}
              </p>
            </div>
          </div>

          {routeSteps.length > 0 && (
            <aside className="absolute z-[700] top-28 right-5 bottom-36 w-[350px] max-md:left-4 max-md:right-4 max-md:top-auto max-md:bottom-36 max-md:w-auto max-md:h-[310px] rounded-2xl border border-white/10 bg-[#071a33]/95 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 bg-[#0b2444]">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/50">
                    NEXT DIRECTION
                  </p>

                  <span className="text-xs text-white/40">
                    {activeStep + 1}/
                    {routeSteps.length}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-[#f4c542] text-black flex items-center justify-center text-3xl font-bold">
                    {getDirectionIcon(
                      routeSteps[activeStep]?.type
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-tight">
                      {
                        routeSteps[activeStep]
                          ?.instruction
                      }
                    </h3>

                    <p className="text-[#f4c542] text-sm mt-1">
                      {formatStepDistance(
                        routeSteps[activeStep]
                          ?.distance
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[calc(100%-126px)] overflow-y-auto p-3">
                {routeSteps.map(
                  (step, index) => (
                    <button
                      key={`${step.instruction}-${index}`}
                      type="button"
                      onClick={() =>
                        focusDirectionStep(
                          index
                        )
                      }
                      className={`w-full flex items-start gap-3 text-left rounded-xl p-3 mb-2 border transition ${
                        activeStep === index
                          ? "bg-[#f4c542]/15 border-[#f4c542]/50"
                          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                      }`}
                    >
                      <span className="w-10 h-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                        {getDirectionIcon(
                          step.type
                        )}
                      </span>

                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {step.instruction}
                        </p>

                        <div className="flex gap-3 mt-1 text-xs text-white/45">
                          <span>
                            {formatStepDistance(
                              step.distance
                            )}
                          </span>

                          <span>
                            {formatDuration(
                              step.duration
                            )}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </aside>
          )}

          <div className="absolute bottom-5 left-5 right-5 z-[650] rounded-2xl bg-[#071a33]/85 border border-white/10 backdrop-blur-xl p-4 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {displayedRoute.map(
                (place, index) => (
                  <div
                    key={`${place.id}-${index}`}
                    className="flex items-center gap-3"
                  >
                    <div className="rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3">
                      <p className="text-xs text-white/45">
                        Stop {index + 1}
                      </p>

                      <p className="font-bold text-sm">
                        {place.emoji}{" "}
                        {place.name}
                      </p>
                    </div>

                    {index !==
                      displayedRoute.length - 1 && (
                      <span className="text-[#f4c542]">
                        →
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <div
            ref={mapRef}
            className="absolute inset-0 z-10"
          />
        </main>
      </div>
    </div>
  );
}

function DestinationSelect({
  label,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <label className="text-xs text-white/50">
        {label}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {DESTINATIONS.map(
          (destination) => (
            <option
              key={destination.id}
              value={destination.id}
              className="text-black"
            >
              {destination.name}
            </option>
          )
        )}
      </select>
    </div>
  );
}
