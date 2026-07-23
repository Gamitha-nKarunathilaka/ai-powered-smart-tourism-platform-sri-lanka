
import { useState } from "react";
import { useLocation } from "react-router-dom"; // 1. useLocation import කරගත්තා
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import { useRouteMap } from "../hooks/useRouteMap";

import StepLabel from "../components/route_planner/StepLabel";
import LocationControls from "../components/route_planner/LocationControls";
import DestinationPicker from "../components/route_planner/DestinationPicker";
import RouteSummaryCard from "../components/route_planner/RouteSummaryCard";
import DirectionPanel from "../components/route_planner/DirectionPanel";
import RouteStopBar from "../components/route_planner/RouteStopBar";


export default function RoutePlanner() {
 
  const location = useLocation();
  
  const receivedPlaces = location.state?.recommendedPlaces || location.state?.places || [];

  console.log("RoutePlanner වෙත location හරහා ලැබුණු Places ටික:", receivedPlaces);

  const trip = useRoutePlanner(receivedPlaces);
  
  const { mapRef, mapApi } = useRouteMap({
    displayedRoute: trip.displayedRoute,
    routeGeoJson: trip.routeGeoJson,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

  return (
    <div className="text-white bg-[#020b1c] pt-1">
      <div className="lg:h-[calc(100vh-40px)] min-h-[700px] flex flex-col lg:flex-row lg:overflow-hidden">
        <div
          className={`relative shrink-0 bg-[#071a33]/95 border-r border-white/10 transition-all duration-300 ease-in-out ${
            sidebarOpen ? "lg:w-[360px]" : "lg:w-14"
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            title={sidebarOpen ? "Collapse panel" : "Expand panel"}
            className="hidden lg:flex absolute -right-3 top-8 z-[800] w-7 h-7 rounded-full bg-[#f4c542] text-black items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <span
              className={`text-sm leading-none transition-transform duration-300 ${
                sidebarOpen ? "" : "rotate-180"
              }`}
            >
              ‹
            </span>
          </button>

          {sidebarOpen ? (
            <aside className="p-6 pb-28 overflow-y-auto lg:h-full mt-16 ">
              <h1 className="text-2xl font-bold">
                Real Road <span className="text-[#22d3ee]">Planner</span>
              </h1>
              <p className="text-white/55 text-sm mt-5">
                Pick a start, an end, and the places to visit along the way.
              </p>

              <StepLabel title="WHERE ARE YOU STARTING?" />
              <LocationControls
                destinations={trip.destinations} 
                useCurrentAsStart={trip.useCurrentAsStart}
                locationLoading={trip.locationLoading}
                onEnableCurrentLocation={() => trip.enableCurrentLocationStart(mapApi)}
                onDisableCurrentLocation={() => trip.disableCurrentLocationStart(mapApi)}
                startId={trip.startId}
                endId={trip.endId}
                onStartChange={trip.handleStartChange}
                onEndChange={trip.handleEndChange}
              />

              <StepLabel title="PLACES TO VISIT" />
              <DestinationPicker
                destinations={trip.destinations} 
                startId={trip.startId}
                endId={trip.endId}
                selectedIds={trip.selectedIds}
                useCurrentAsStart={trip.useCurrentAsStart}
                onToggle={trip.toggleDestination}
              />

              <StepLabel title="YOUR ROUTE" />
              <RouteSummaryCard
                routeStart={trip.routeStart}
                routeSummary={trip.routeSummary}
                previewDistance={trip.previewDistance}
              />

              {trip.error && (
                <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200 break-words">
                  {trip.error}
                </div>
              )}

              <button
                type="button"
                onClick={trip.generateBestRoadRoute}
                disabled={trip.loading}
                className="mt-4 w-full rounded-xl bg-cyan-400/80 text-white font-bold py-4 disabled:opacity-60 disabled:cursor-wait"
              >
                {trip.loading ? "GENERATING ROUTE..." : "GENERATE BEST ROAD ROUTE"}
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {!trip.navigationStarted ? (
                  <button
                    type="button"
                    onClick={() => trip.startNavigation(mapApi)}
                    disabled={trip.routeSteps.length === 0}
                    className="rounded-xl bg-[#03284f] text-white border border-white/10 font-bold py-3 text-sm disabled:opacity-40"
                  >
                    START NAV
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={trip.stopNavigation}
                    className="rounded-xl bg-red-500 text-white font-bold py-3 text-sm"
                  >
                    STOP NAV
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => trip.fitRoute(mapApi)}
                  className="rounded-xl border border-white/15 bg-white/[0.04] py-3 text-sm font-semibold hover:bg-white/10"
                >
                  FIT ROUTE
                </button>
              </div>
            </aside>
          ) : (
           
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="hidden lg:flex h-full w-full items-center justify-center hover:bg-white/5 transition-colors"
              title="Expand panel"
            >
              <span className="text-white/35 text-[10px] font-bold tracking-widest [writing-mode:vertical-rl] rotate-180">
                PLANNER
              </span>
            </button>
          )}
        </div>

        {/* MAP */}
        <main className="relative flex-1 min-h-[560px] lg:min-h-0 overflow-hidden bg-gradient-to-br from-[#020617] via-[#06314d] to-[#020617]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.25),transparent_55%)] animate-pulse" />
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent)]" />
          <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,.85)]" />

          <DirectionPanel
            routeSteps={trip.routeSteps}
            activeStep={trip.activeStep}
            onFocusStep={(index) => trip.focusDirectionStep(index, mapApi)}
          />

          <RouteStopBar
            displayedRoute={trip.displayedRoute}
            collapsed={timelineCollapsed}
            onToggleCollapse={() => setTimelineCollapsed((c) => !c)}
          />

          <div ref={mapRef} className="absolute inset-0 z-10" />
        </main>
      </div>
    </div>
  );
}