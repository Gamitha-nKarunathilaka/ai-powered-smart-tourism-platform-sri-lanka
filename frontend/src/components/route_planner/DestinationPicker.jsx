// 1. පරණ import එක අයින් කරන්න
// import { DESTINATIONS } from "../../routePlannerConstant";

export default function DestinationPicker({
  destinations = [], // 2. destinations කියන prop එක අලුතින් ගන්න
  startId,
  endId,
  selectedIds,
  useCurrentAsStart,
  onToggle,
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* 3. DESTINATIONS වෙනුවට destinations.map කියලා වෙනස් කරන්න */}
      {destinations.map((place) => {
        const disabled =
          place.id === Number(endId) ||
          (!useCurrentAsStart && place.id === Number(startId));

        const selected = selectedIds.includes(place.id) || disabled;

        return (
          <button
            type="button"
            key={place.id}
            disabled={disabled}
            onClick={() => onToggle(place.id)}
            title={disabled ? "Fixed as start/end" : place.type || place.category}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border py-4 px-2 text-center transition ${
              selected
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                    : "border-white/15 text-white/60 hover:bg-white/[0.05]"
            } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/10"}`}
          >
            {selected && !disabled && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f4c542] text-black text-[10px] font-bold flex items-center justify-center">
                ✓
              </span>
            )}

            {/* AI places වලට emoji නැති වෙන්න පුළුවන් නිසා fallback එකක් දැම්මා 📍 */}
            <span className="text-2xl">{place.emoji || "📍"}</span>
            
            {/* AI places වල place_name එක එන්නත් පුළුවන් නිසා එකතු කළා */}
            <p className="text-xs font-semibold leading-tight">
              {place.name || place.place_name || place.title}
            </p>
            
            <p className="text-[10px] text-white/45">
              {disabled ? "Fixed" : (place.type || place.category || "Place")}
            </p>
          </button>
        );
      })}
    </div>
  );
}