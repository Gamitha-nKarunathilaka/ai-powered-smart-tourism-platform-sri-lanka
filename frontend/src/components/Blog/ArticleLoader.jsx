export default function ArticleLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#081328] px-6 text-white">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute inset-0 rounded-full border border-cyan-300/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]" />
          <div className="absolute inset-[10px] rounded-full bg-cyan-300/10 blur-md" />
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
          Loading Article
        </p>

        <p className="mt-3 text-sm text-white/45">
          Preparing your travel story...
        </p>
      </div>
    </div>
  );
}
