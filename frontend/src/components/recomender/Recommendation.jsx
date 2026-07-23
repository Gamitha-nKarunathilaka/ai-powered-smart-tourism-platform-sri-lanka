import RecommendationCard from "./RecommendationCard";

export default function Recommendations({ stops, activeStop, onView, myTrip, onToggleTrip }) {
  return (
    <section className="px-3 lg:px-5 pb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">
            Recommended for your journey
          </h2>
          <p className="text-white/55 text-sm">
            AI optimized places using ML model, weather, seasonality and route
            planning.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg border border-cyan-400/50 text-cyan-400 px-5 py-3 text-sm hover:bg-cyan-400/10 transition-colors">
            Filter ⚱
          </button>
          <button className="rounded-lg border border-cyan-400/50 text-cyan-400 px-5 py-3 text-sm hover:bg-cyan-400/10 transition-colors">
            Sort by: Best Match ⌄
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {stops.map((stop, i) => {
          const isAdded = myTrip.some((s) => s.title === stop.title);
          return (
            <RecommendationCard
              key={`${stop.title}-${i}`}
              stop={stop}
              active={activeStop === i}
              onView={() => onView(i)}
              topPick={i === 0}
              isAdded={isAdded}
              onToggleTrip={() => onToggleTrip(stop)}
            />
          );
        })}
      </div>
    </section>
  );
}