// components/HeroSection.jsx

import { useNavigate } from "react-router-dom"; 
import Stat from "./Stat";
import MapButton from "./MapButton";

export default function HeroSection({
  mapRef,
  days,
  tripStopsCount,
  totalDistance,
  totalDuration,
  recommendedPlaces = [], 
  onFlyToStart,
  onZoomIn,
  onZoomOut,
  onFitAll,
}) {
  
  const navigate = useNavigate();

  const handleViewFullMap = () => {
    console.log("HeroSection එකෙන් යවන recommendedPlaces:", recommendedPlaces);
    
    navigate("/map", { 
      state: { recommendedPlaces: recommendedPlaces } 
    });
  };

  return (
    <section className="p-3 lg:p-4">
      <div className="relative min-h-[280px] lg:min-h-[285px] rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-r from-[#071a33] via-[#092447] to-[#073050]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(56,189,248,.25),transparent_45%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent)]" />

        <div className="relative z-[500] grid lg:grid-cols-[390px_1fr] h-full">
          <div className="p-6 lg:p-8">
            <h1 className="text-5xl lg:text-6xl font-serif text-white leading-tight mb-4 drop-shadow-md">
              Explore <br />
              <span className="text-cyan-400 font-light">Sri Lanka</span>
            </h1>

            <p className="mt-5 text-white/80">
              {days} Days <span className="mx-2 text-white/40">•</span>{" "}
              {Math.max(Number(days) - 1, 0)} Nights{" "}
              <span className="mx-2 text-white/40">•</span> Sri Lanka
            </p>

            <div className="mt-7 grid grid-cols-3 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden">
              <Stat number={String(tripStopsCount)} label="Places" />
              <Stat number={totalDistance} label="Total Distance" />
              <Stat number={totalDuration} label="Est. Travel Time" />
            </div>

            <button
              type="button"
              onClick={handleViewFullMap}
              className="mt-5 rounded-lg border border-cyan-400/50 text-cyan-400 px-6 py-3 text-sm font-semibold hover:bg-cyan-400/10 transition-colors"
            >
              View Full Map ↗
            </button>
          </div>

          <div className="relative h-[300px] lg:h-[285px]">
            <div
              ref={mapRef}
              className="absolute inset-0 z-10 drop-shadow-[0_30px_50px_rgba(0,0,0,.75)]"
            />
          </div>
        </div>

        <div className="absolute right-5 top-9 z-[600] flex flex-col gap-4">
          <MapButton label="➤" onClick={onFlyToStart} />
          <MapButton label="+" onClick={onZoomIn} />
          <MapButton label="−" onClick={onZoomOut} />
          <MapButton label="⛶" onClick={onFitAll} />
        </div>
      </div>
    </section>
  );
}