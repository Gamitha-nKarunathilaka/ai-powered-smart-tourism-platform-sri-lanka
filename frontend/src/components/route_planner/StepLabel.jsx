// components/route_planner/StepLabel.jsx
export default function StepLabel({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
     
      <p className="text-xs font-bold tracking-widest text-white/80">{title}</p>
    </div>
  );
}