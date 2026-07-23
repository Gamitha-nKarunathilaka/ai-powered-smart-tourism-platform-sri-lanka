// components/route_planner/LocationControls.jsx
import DestinationSelect from "./DestinationSelect";

export default function LocationControls({
  useCurrentAsStart,
  locationLoading,
  onEnableCurrentLocation,
  onDisableCurrentLocation,
  startId,
  endId,
  onStartChange,
  onEndChange,
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onEnableCurrentLocation}
        disabled={locationLoading}
        className={`w-full rounded-xl border px-4 py-3 font-semibold transition ${
          useCurrentAsStart
            ? "border-blue-400 bg-blue-500/20 text-blue-200"
            : "border-white/15 bg-white/[0.05] hover:bg-white/10"
        } disabled:opacity-50`}
      >
        {locationLoading
          ? "GETTING CURRENT LOCATION..."
          : useCurrentAsStart
            ? "📍 CURRENT LOCATION SELECTED"
            : "◎ USE MY CURRENT LOCATION"}
      </button>

      {useCurrentAsStart && (
        <button
          type="button"
          onClick={onDisableCurrentLocation}
          className="w-full rounded-xl border border-white/10 py-2 text-xs text-white/60 hover:bg-white/10"
        >
          Use selected start destination instead
        </button>
      )}

      <DestinationSelect
        label="Start Destination"
        value={startId}
        onChange={onStartChange}
        disabled={useCurrentAsStart}
      />

      <DestinationSelect label="End Destination" value={endId} onChange={onEndChange} />
    </div>
  );
}