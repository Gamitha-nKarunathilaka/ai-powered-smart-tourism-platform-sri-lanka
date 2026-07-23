/**
 * CeylonExplorer.jsx
 *
 * Component-based rewrite of the original monolithic file.
 * This file now only:
 *  - wires together the two custom hooks (map + trip planner)
 *  - holds UI-only state (activeTab, activeStop)
 *  - composes presentational components
 *
 * All business logic lives in hooks/, all static data in constants.js,
 * all pure helpers in utils/, and every visual section is its own
 * component under components/.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeafletMap } from "../hooks/useLeafletMap";
import { useTripPlanner } from "../hooks/useTripPlanner";

import Navbar from "../components/recomender/Navbar";
import TripPlannerSidebar from "../components/recomender/SideBar";
import HeroSection from "../components/recomender/Hero";
import TabBar from "../components/recomender/TabBar";
import Recommendations from "../components/recomender/Recommendation";
// SimplePanel ඉවත් කර ඇති නිසා එය මෙතනින්ද ඉවත් කළ හැක
import Accommodation from "../components/recomender/Accomodation";
import Itinerary from "../components/recomender/Itinery";

export default function CeylonExplorer() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("recommendations");
  const [activeStop, setActiveStop] = useState(null);

  const planner = useTripPlanner();
  
  // 🌟 වෙනස 1: මෙතනට 'accommodationsData' අලුතින් එකතු කළා
  const { 
    tripStops, 
    routeCoordinates, 
    dayPlan, 
    myTrip, 
    handleToggleTrip, 
    accommodationsData 
  } = planner;

  const { mapRef, flyToStop, zoomIn, zoomOut, fitAllStops } = useLeafletMap({
    tripStops,
    routeCoordinates,
  });

  const viewStop = (index) => {
    const stop = tripStops[index];
    if (!stop) return;
    setActiveStop(index);
    // setActiveTab("map"); <--- Map tab එක නැති නිසා මෙය ඉවත් කළ යුතුයි
    flyToStop(index, stop);
  };

  // Sends the recommended (or hand-picked "My Trip") places over to the
  // Road Planner page so the user can generate a real driving route
  // through them. Read on the other side via useLocation().state.places.
  const handlePlanRoadRoute = () => {
    const placesForRoadPlanner = myTrip && myTrip.length > 0 ? myTrip : tripStops;
    navigate("/map", { state: { places: placesForRoadPlanner } });
  };

  return (
    <div className="min-h-screen bg-[#020b1c] text-white font-sans overflow-hidden">
      <Navbar onPlanTripClick={() => setActiveTab("recommendations")} />

      <div className="h-[calc(100vh-74px)] flex overflow-hidden">
        <TripPlannerSidebar
          planner={planner}
          tripStops={tripStops}
          activeStop={activeStop}
          onViewStop={viewStop}
          onViewFullItinerary={() => setActiveTab("itinerary")}
        />

        <main className="flex-1 overflow-y-auto bg-[#06162e]">
          <div className="mx-auto max-w-[1280px] p-3 lg:p-4">
            <div className="rounded-xl lg:rounded-2xl border border-white/10 bg-[#071a33]/80 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10">
                <TabBar activeTab={activeTab} onChange={setActiveTab} />
              </div>

              <HeroSection
                mapRef={mapRef}
                days={planner.days}
                tripStopsCount={tripStops.length}
                totalDistance={planner.totalDistance}
                totalDuration={planner.totalDuration}
                recommendedPlaces={myTrip && myTrip.length > 0 ? myTrip : tripStops}
                // onViewFullMap={() => setActiveTab("map")}
                onFlyToStart={() => tripStops[0] && viewStop(0)}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onFitAll={fitAllStops}
              />

              {activeTab === "recommendations" && (
                <Recommendations
                  stops={tripStops}
                  activeStop={activeStop}
                  onView={viewStop}
                  myTrip={myTrip}
                  onToggleTrip={handleToggleTrip}
                />
              )}
    
              {/* 🌟 වෙනස 2: tripStops වෙනුවට accommodationsData යැවීම */}
              {activeTab === "accommodation" && (
                <Accommodation stops={accommodationsData || tripStops} />
              )}

              {activeTab === "itinerary" && (
                <Itinerary
                  stops={tripStops}
                  dayPlan={dayPlan}
                  onView={viewStop}
                  myTrip={myTrip}
                  onRemoveFromTrip={handleToggleTrip}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}