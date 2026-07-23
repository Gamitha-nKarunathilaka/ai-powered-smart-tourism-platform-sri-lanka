export default function MapButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-full lg:rounded-xl bg-[#061a33]/80 border border-white/10 text-xl hover:bg-white/10"
    >
      {label}
    </button>
  );
}