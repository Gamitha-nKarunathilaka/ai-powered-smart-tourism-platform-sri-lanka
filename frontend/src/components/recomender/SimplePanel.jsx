export default function SimplePanel({ title, text }) {
  return (
    <section className="p-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-white/60 mt-2">{text}</p>
      </div>
    </section>
  );
}