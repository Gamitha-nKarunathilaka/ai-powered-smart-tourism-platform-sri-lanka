export default function RecommendationCard({
  stop,
  active,
  onView,
  topPick,
  isAdded,
  onToggleTrip,
}) {
  const weatherText = stop.weather
    ? `${stop.weather.condition || "Weather"} ${
        stop.weather.temperature ? `${Math.round(stop.weather.temperature)}°C` : ""
      }`
    : "Weather not checked";

  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-[230px_1fr_120px_170px_180px_40px] gap-5 rounded-2xl border p-3 lg:p-4 bg-white/[0.04] transition ${
        active ? "border-[#f4c542]/70" : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="relative h-[135px] rounded-xl overflow-hidden bg-white/10">
        <img
          src={stop.image}
          alt={stop.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?q=80&w=800&auto=format&fit=crop";
          }}
        />
        {topPick && (
          <span className="absolute left-3 bottom-3 rounded-full bg-[#f4c542] text-black text-[10px] font-bold px-3 py-1">
            TOP PICK
          </span>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <h3 className="text-xl font-bold">
          {stop.title} <span className="text-sm">{stop.emoji}</span>
        </h3>
        <p className="text-sm text-white/55 mt-1">
          {stop.location} <span className="mx-1">•</span> {stop.category}
        </p>
        <p className="text-sm text-white/70 mt-3 leading-relaxed line-clamp-3">
          {stop.info}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {stop.seasonalityScore !== null && stop.seasonalityScore !== undefined && (
            <span className="rounded-full bg-green-400/10 border border-green-400/20 px-3 py-1 text-green-200">
              Seasonality {Math.round(stop.seasonalityScore)}%
            </span>
          )}

          <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-cyan-200">
            {weatherText}
          </span>
        </div>
      </div>

      <div className="flex xl:flex-col items-center justify-center border-white/10 xl:border-l xl:border-r gap-2">
        <span className="text-3xl font-bold text-green-400">{stop.match}%</span>
        <span className="text-sm">Match</span>
      </div>

      <div className="flex xl:flex-col justify-center gap-2 text-sm text-white/70">
        <p>☀️ Best Time</p>
        <p>🌞 {stop.bestTime}</p>
        {stop.distance && <p>🛣️ {stop.distance}</p>}
        {stop.time && <p>⏱️ {stop.time}</p>}
      </div>

      <div className="flex xl:flex-col justify-center gap-3">
        <button
          onClick={onView}
          className="rounded-lg border border-cyan-400/50 text-cyan-400 px-4 py-3 text-sm font-bold hover:bg-cyan-400/10 transition-colors cursor-pointer"
        >
          ⌖ View on Map
        </button>
        <button
          onClick={onToggleTrip}
          className={`rounded-lg px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all w-full xl:w-auto ${
            isAdded
              ? "bg-transparent text-red-300 border border-red-500/50 hover:bg-red-500/20"
              : "bg-[#03284f] text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          }`}
        >
          {isAdded ? "Remove -" : "Add to Trip +"}
        </button>
      </div>

      <div className="hidden xl:flex items-center justify-center text-2xl text-white/60">
        {isAdded ? <span className="text-[#f4c542]">♥</span> : "♡"}
      </div>
    </div>
  );
}