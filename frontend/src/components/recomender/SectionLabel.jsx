export default function SectionLabel({ step, title }) {
  return (
    <div className="mb-2 mt-4 first:mt-0">
      <p className="text-[11px] text-white/35 tracking-widest mb-1">{step}</p>
      <p className="text-xs font-bold tracking-wider">{title}</p>
    </div>
  );
}