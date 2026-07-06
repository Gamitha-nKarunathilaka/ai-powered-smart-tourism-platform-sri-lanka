import { Link } from "react-router-dom";

export default function ArticleHero({
  article,
  heroImageRef,
  heroContentRef,
  heroOverlayRef,
  glowLeftRef,
  glowRightRef,
  glowBottomRef,
  scrollHintRef,
}) {
  return (
    <header className="relative h-[100svh] min-h-[760px] overflow-hidden border-b border-white/10 shadow-[0_35px_140px_rgba(34,211,238,0.12)]">
      <img
        ref={heroImageRef}
        src={article.hero_image}
        alt={article.title}
        className="absolute -inset-[10%] h-[120%] w-[120%] object-cover will-change-transform"
      />

      <div
        ref={heroOverlayRef}
        className="absolute inset-0 bg-[#071225] will-change-[opacity]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#081328] via-[#081328]/20 to-[#061024]/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(4,12,28,.30)_68%,rgba(4,12,28,.72)_100%)]" />

      <div
        ref={glowLeftRef}
        className="absolute -left-32 top-16 h-[430px] w-[430px] rounded-full bg-cyan-400/20 blur-[145px] will-change-transform"
      />

      <div
        ref={glowRightRef}
        className="absolute -right-24 top-1/4 h-[470px] w-[470px] rounded-full bg-blue-500/15 blur-[155px] will-change-transform"
      />

      <div
        ref={glowBottomRef}
        className="absolute bottom-[-150px] left-1/2 h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-[125px] will-change-transform"
      />

      <Link
        to="/blog"
        className="absolute left-6 top-24 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#071225]/35 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-xl transition hover:border-cyan-300/40 hover:bg-cyan-300/10 lg:left-10"
      >
        ← Back to Blog
      </Link>

      <div
        ref={heroContentRef}
        className="relative z-10 mx-auto flex h-[100svh] min-h-[760px] max-w-7xl items-center justify-center px-6 pb-16 pt-32 text-center will-change-transform lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap justify-center gap-2">
            {article.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/80"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mx-auto mt-7 max-w-5xl font-serif text-5xl font-semibold leading-[1.02] drop-shadow-[0_0_34px_rgba(34,211,238,0.26)] md:text-7xl lg:text-[92px]">
            {article.title}
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            {article.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/55">
            <span>{article.author}</span>
            <span>•</span>
            <span>{article.published_date}</span>
            <span>•</span>
            <span>{article.read_time}</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollHintRef}
        className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 text-center transition-opacity"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55">
          Scroll to explore
        </p>

        <div className="mx-auto mt-3 flex h-10 w-6 justify-center rounded-full border border-white/25 pt-2">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.9)]" />
        </div>
      </div>
    </header>
  );
}
