export default function Stat({ number, label }) {
  return (
    <div className="p-4 border-r border-white/10 last:border-r-0">
      <h3 className="text-lg font-bold">{number}</h3>
      <p className="text-[11px] text-white/55">{label}</p>
    </div>
  );
}