// components/route_planner/RouteSummaryCard.jsx
import { formatDuration } from "../../utils/formatters";

export default function RouteSummaryCard({ routeStart, routeSummary, previewDistance }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
      <p className="text-white/55 text-sm">Start</p>
      <p className="font-semibold mt-1">
        {routeStart?.emoji} {routeStart?.name}
      </p>

      <p className="text-white/55 text-sm mt-4">
        {routeSummary ? "Real Road Distance" : "Preview Distance"}
      </p>
      <h3 className="text-3xl font-semibold text-[#f4c542] mt-1">
        {routeSummary
          ? `${(routeSummary.distance / 1000).toFixed(1)} km`
          : `${previewDistance.toFixed(0)} km`}
      </h3>

      {routeSummary ? (
        <>
          <p className="text-white/55 text-sm mt-4">Estimated Driving Time</p>
          <h3 className="text-2xl font-bold mt-1">{formatDuration(routeSummary.duration)}</h3>
        </>
      ) : (
        <p className="text-white/45 text-xs mt-1">
          Generate the route to calculate real road information.
        </p>
      )}
    </div>
  );
}