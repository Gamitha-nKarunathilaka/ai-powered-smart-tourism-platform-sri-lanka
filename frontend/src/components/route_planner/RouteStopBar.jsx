// components/route_planner/RouteStopBar.jsx
export default function RouteStopBar({ displayedRoute, collapsed, onToggleCollapse }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[650] rounded-2xl bg-[#071a33]/85 border border-white/10 backdrop-blur-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/60 hover:text-white transition-colors"
      >
        <span className="font-semibold">
          {displayedRoute.length} Stop{displayedRoute.length !== 1 ? "s" : ""}
        </span>
        <span
          className={`inline-block text-sm transition-transform duration-200 ${
            collapsed ? "rotate-180" : ""
          }`}
        >
          ˅
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            {displayedRoute.map((place, index) => (
              <div key={`${place.id}-${index}`} className="flex items-center gap-3">
                <div className="rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3">
                  <p className="text-xs text-white/45">Stop {index + 1}</p>
                  <p className="font-bold text-sm">
                    {place.emoji} {place.name}
                  </p>
                </div>
                {index !== displayedRoute.length - 1 && (
                  <span className="text-[#f4c542]">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}