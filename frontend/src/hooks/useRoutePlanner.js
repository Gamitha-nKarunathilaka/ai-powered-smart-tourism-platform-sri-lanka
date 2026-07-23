// hooks/useRoutePlanner.js

import { useEffect, useMemo, useRef, useState } from "react";
// DESTINATIONS එක DEFAULT_DESTINATIONS විදිහට නම වෙනස් කරලා ගත්තා පැටලෙන්නේ නැති වෙන්න
import { DESTINATIONS as DEFAULT_DESTINATIONS, ORS_API_KEY } from "../routePlannerConstant";
import { buildPreviewRoute, distanceKm } from "../utils/routeMath";
import { getCurrentDeviceLocation, speakDirection } from "../utils/geolocation";

// 1. recommendedPlaces අලුතින් ගත්තා
export function useRoutePlanner(recommendedPlaces = []) {
  const routeStepsRef = useRef([]);
  const activeStepRef = useRef(0);
  const watchIdRef = useRef(null);

  // 2. AI Places සහ Default Places අතර මාරු වෙන Logic එක
  const destinations = useMemo(() => {
    if (!recommendedPlaces || recommendedPlaces.length === 0) {
      return DEFAULT_DESTINATIONS;
    }
    // AI data ආවොත් Map එකට ඕනේ විදිහට format කරනවා
    return recommendedPlaces.map((p, index) => ({
      id: index + 1,
      name: p.title || p.name || `Place ${index + 1}`,
      lat: Number(p.lat),
      lng: Number(p.lng),
      type: p.category || p.type || "Attraction",
      emoji: p.emoji || "📍"
    }));
  }, [recommendedPlaces]);

  // 3. States මුලින්ම set කරනවා
  const [startId, setStartId] = useState(destinations[0]?.id || 1);
  const [endId, setEndId] = useState(destinations[destinations.length - 1]?.id || 7);
  const [selectedIds, setSelectedIds] = useState(destinations.slice(1, -1).map(d => d.id));

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

  // අලුත් Places ආවම ඉබේම Start/End update වෙන්න useEffect එකක්
  useEffect(() => {
    if (destinations.length > 0) {
      setStartId(destinations[0].id);
      setEndId(destinations[destinations.length - 1].id);
      setSelectedIds(destinations.slice(1, -1).map(d => d.id));
      resetGeneratedRoute(); // අලුත් data ආවම පරණ route එක reset කරනවා
    }
  }, [destinations]);

  // 4. DESTINATIONS වෙනුවට හැමතැනම destinations පාවිච්චි කරනවා
  const selectedStart = destinations.find((d) => d.id === Number(startId)) || destinations[0];
  const end = destinations.find((d) => d.id === Number(endId)) || destinations[destinations.length - 1];
  const routeStart = useCurrentAsStart && currentLocation ? currentLocation : selectedStart;

  const selectedPlaces = useMemo(
    () =>
      destinations.filter((destination) => {
        const isSelected = selectedIds.includes(destination.id);
        const isEnd = destination.id === Number(endId);
        const isManualStart = !useCurrentAsStart && destination.id === Number(startId);

        return isSelected && !isEnd && !isManualStart;
      }),
    [destinations, selectedIds, startId, endId, useCurrentAsStart]
  );

  const previewRoute = useMemo(
    () => buildPreviewRoute(routeStart, selectedPlaces, end),
    [routeStart, selectedPlaces, end]
  );

  const displayedRoute = routeOrder.length > 0 ? routeOrder : previewRoute;

  const previewDistance = useMemo(
    () =>
      previewRoute
        .slice(0, -1)
        .reduce((sum, place, i) => sum + distanceKm(place, previewRoute[i + 1]), 0),
    [previewRoute]
  );

  useEffect(() => { routeStepsRef.current = routeSteps; }, [routeSteps]);
  useEffect(() => { activeStepRef.current = activeStep; }, [activeStep]);

  useEffect(() => {
    if (!navigationStarted || !routeSteps[activeStep]) return;
    speakDirection(routeSteps[activeStep].instruction);
  }, [activeStep, navigationStarted, routeSteps]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  function resetGeneratedRoute() {
    stopNavigation();
    setRouteOrder([]);
    setRouteGeoJson(null);
    setRouteSummary(null);
    setRouteSteps([]);
    setActiveStep(0);
    setError("");
  }

  async function enableCurrentLocationStart(mapApi) {
    setError("");
    setLocationLoading(true);

    try {
      const location = await getCurrentDeviceLocation();
      resetGeneratedRoute();
      setCurrentLocation(location);
      setUseCurrentAsStart(true);

      mapApi?.setUserMarker(location.lat, location.lng);
      mapApi?.openUserMarkerPopup();
      mapApi?.flyTo([location.lat, location.lng], 14, { animate: true, duration: 1 });
    } catch (locationError) {
      setError(
        locationError instanceof Error ? locationError.message : "Unable to get your current location."
      );
    } finally {
      setLocationLoading(false);
    }
  }

  function disableCurrentLocationStart(mapApi) {
    setUseCurrentAsStart(false);
    resetGeneratedRoute();
    if (!navigationStarted) mapApi?.removeUserMarker();
  }

  async function generateBestRoadRoute() {
    setError("");

    if (!ORS_API_KEY) {
      setError("VITE_ORS_API_KEY is missing. Add the full key to the project root .env file and restart npm run dev.");
      return;
    }

    if (!routeStart || !end) {
      setError("Please select valid start and end destinations.");
      return;
    }

    if (!useCurrentAsStart && routeStart.id === end.id) {
      setError("Start and end destinations must be different.");
      return;
    }

    setLoading(true);

    try {
      let optimizedStops = selectedPlaces;

      if (selectedPlaces.length > 0) {
        const optimizationResponse = await fetch("https://api.openrouteservice.org/optimization", {
          method: "POST",
          headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            jobs: selectedPlaces.map((place) => ({ id: place.id, location: [place.lng, place.lat] })),
            vehicles: [{
              id: 1, profile: "driving-car",
              start: [routeStart.lng, routeStart.lat],
              end: [end.lng, end.lat],
            }],
          }),
        });

        if (!optimizationResponse.ok) {
          const responseText = await optimizationResponse.text();
          throw new Error(`Optimization failed (${optimizationResponse.status}): ${responseText}`);
        }

        const optimizationData = await optimizationResponse.json();
        const optimizedRoute = optimizationData?.routes?.[0];

        if (!optimizedRoute) throw new Error("OpenRouteService returned no optimized route.");

        optimizedStops = optimizedRoute.steps
          .filter((step) => step.type === "job")
          // DESTINATIONS වෙනුවට destinations පාවිච්චි කළා
          .map((step) => destinations.find((d) => d.id === step.job))
          .filter(Boolean);
      }

      const fullOrder = [routeStart, ...optimizedStops, end];
      const coordinates = fullOrder.map((place) => [place.lng, place.lat]);
      const directionsResponse = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates, instructions: true, geometry: true, language: "en" }),
        }
      );

      if (!directionsResponse.ok) {
        const responseText = await directionsResponse.text();
        throw new Error(`Directions failed (${directionsResponse.status}): ${responseText}`);
      }

      const directionsData = await directionsResponse.json();
      const feature = directionsData?.features?.[0];
      const summary = feature?.properties?.summary;
      const geometryCoordinates = feature?.geometry?.coordinates;

      if (!summary) throw new Error("OpenRouteService returned no directions summary.");
      if (!Array.isArray(geometryCoordinates) || geometryCoordinates.length < 2) {
        throw new Error("OpenRouteService returned no route geometry.");
      }

      const steps = feature?.properties?.segments?.flatMap((segment) => segment.steps || []) || [];

      setRouteOrder(fullOrder);
      setRouteSummary(summary);
      setRouteSteps(steps);
      setActiveStep(0);
      setRouteGeoJson(directionsData);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : "Unable to generate the route.");
    } finally {
      setLoading(false);
    }
  }

  function toggleDestination(id) {
    resetGeneratedRoute();
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((x) => x !== id) : [...previous, id]
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

  function fitRoute(mapApi) {
    if (displayedRoute.length < 2) return;
    const routeCoords = mapApi?.getRouteCoordinates() || [];

    if (routeCoords.length > 1) {
      mapApi?.fitBounds(routeCoords, { padding: [60, 60] });
      return;
    }

    mapApi?.fitBounds(displayedRoute.map((p) => [p.lat, p.lng]), { padding: [60, 60] });
  }

  function focusDirectionStep(index, mapApi) {
    setActiveStep(index);
    const step = routeSteps[index];
    const pointIndex = step?.way_points?.[0];
    const routeCoords = mapApi?.getRouteCoordinates() || [];
    const coordinate = routeCoords[pointIndex];

    if (coordinate) {
      mapApi?.flyTo(coordinate, 16, { animate: true, duration: 0.8 });
    }
  }

  function startNavigation(mapApi) {
    if (routeSteps.length === 0) {
      setError("Generate the road route before starting navigation.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Location tracking is not supported by this browser.");
      return;
    }

    setError("");
    setNavigationStarted(true);
    setActiveStep(0);
    speakDirection(routeSteps[0]?.instruction);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        mapApi?.setUserMarker(lat, lng);
        mapApi?.panTo([lat, lng]);

        const currentStepIndex = activeStepRef.current;
        const currentStep = routeStepsRef.current[currentStepIndex];
        const endPointIndex = currentStep?.way_points?.[1];
        const routeCoords = mapApi?.getRouteCoordinates() || [];
        const stepEndCoordinate = routeCoords[endPointIndex];

        if (stepEndCoordinate) {
          const remainingDistance =
            distanceKm({ lat, lng }, { lat: stepEndCoordinate[0], lng: stepEndCoordinate[1] }) * 1000;
          if (remainingDistance < 60 && currentStepIndex < routeStepsRef.current.length - 1) {
            setActiveStep(currentStepIndex + 1);
          }
        }
      },
      (locationError) => {
        console.error(locationError);
        if (locationError.code === 1) setError("Location permission was denied.");
        else setError("Unable to access the current device location.");
        setNavigationStarted(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  }

  function stopNavigation() {
    setNavigationStarted(false);
    window.speechSynthesis?.cancel();

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  return {
    destinations, // අලුතින් destinations return කරනවා (UI එකේ පෙන්වන්න)
    startId, endId, selectedIds,
    currentLocation, useCurrentAsStart, locationLoading,
    selectedStart, end, routeStart, selectedPlaces,
    toggleDestination, handleStartChange, handleEndChange,
    enableCurrentLocationStart, disableCurrentLocationStart,
    previewRoute, displayedRoute, previewDistance,
    routeOrder, routeGeoJson, routeSummary, loading, error,
    generateBestRoadRoute, resetGeneratedRoute, fitRoute,
    routeSteps, activeStep, navigationStarted,
    startNavigation, stopNavigation, focusDirectionStep,
  };
}