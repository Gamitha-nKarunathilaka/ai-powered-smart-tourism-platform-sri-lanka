import { DAY_COLORS } from "../../constant";

export default function Itinerary({ stops, dayPlan, onView, myTrip, onRemoveFromTrip }) {
  return (
    <div className="p-5">
      {myTrip && myTrip.length > 0 && (
        <section className="mb-8 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl text-[#f4c542]">★</span>
            <h2 className="text-xl font-bold font-serif">My Custom Trip</h2>
          </div>
          {myTrip.map((stop, i) => (
            <div
              key={`mytrip-${i}`}
              className="flex items-center gap-4 rounded-2xl border border-[#f4c542]/40 bg-[#f4c542]/5 p-4"
            >
              <span className="text-3xl">{stop.emoji}</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#f4c542]">{stop.title}</h3>
                <p className="text-white/70 text-sm">{stop.location}</p>
              </div>
              <button
                onClick={() => onRemoveFromTrip(stop)}
                className="rounded-lg border border-red-500/30 text-red-300 px-4 py-2 text-sm hover:bg-red-500/20"
              >
                Remove
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold font-serif mb-4 pt-2">
          {dayPlan?.length > 0 ? "AI Generated Itinerary" : "Suggested Route"}
        </h2>

        {dayPlan?.length > 0 ? (
          dayPlan.map((day, i) => (
            <div
              key={`day-plan-${i}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <h3 className="font-bold text-lg">Day {day.day || i + 1}</h3>
              {day.route && (
                <p className="text-cyan-200 text-sm mt-1">Route: {day.route}</p>
              )}
              {Array.isArray(day.places) && (
                <p className="text-white/70 text-sm mt-2">
                  Places: {day.places.join(", ")}
                </p>
              )}
              {day.note && <p className="text-white/55 text-sm mt-2">{day.note}</p>}
            </div>
          ))
        ) : (
          stops.map((stop, i) => (
            <button
              key={`${stop.label}-${i}`}
              onClick={() => onView(i)}
              className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.08]"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: DAY_COLORS[stop.day] || "#38bdf8" }}
              />
              <span className="text-2xl">{stop.emoji}</span>
              <div>
                <h3 className="font-bold">{stop.label}</h3>
                <p className="text-white/55 text-sm">{stop.info}</p>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}