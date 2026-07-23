// components/route_planner/DestinationSelect.jsx
import { DESTINATIONS } from "../../routePlannerConstant";

export default function DestinationSelect({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="text-xs text-white/50">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {DESTINATIONS.map((destination) => (
          <option key={destination.id} value={destination.id} className="text-black">
            {destination.name}
          </option>
        ))}
      </select>
    </div>
  );
}