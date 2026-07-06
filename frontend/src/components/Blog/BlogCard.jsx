import { Link } from "react-router-dom";

export default function BlogCard({ article }) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.06] hover:shadow-[0_18px_50px_rgba(34,211,238,0.10)]">
      <Link
        to={`/blog/${article.slug}`}
        className="block"
        aria-label={`Read ${article.title}`}
      >
        <div className="relative h-56 overflow-hidden">
          <img
            src={article.hero_image}
            alt={article.title}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#071225] via-transparent to-transparent" />

          <span className="absolute left-4 top-4 rounded-full border border-cyan-300/25 bg-[#071225]/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 backdrop-blur-md">
            {article.category}
          </span>
        </div>

        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
            <span>{article.published_date}</span>
            <span>•</span>
            <span>{article.read_time}</span>
          </div>

          <h3 className="font-serif text-2xl font-semibold leading-tight text-white transition group-hover:text-cyan-300">
            {article.title}
          </h3>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
            {article.subtitle}
          </p>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <p className="text-xs font-semibold text-white/65">
              {article.author}
            </p>

            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Read Article
              <span className="transition group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
