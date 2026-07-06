import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import BlogCard from "../components/blog/BlogCard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

function getArticleDate(article) {
  const value =
    article.created_at ||
    article.published_date ||
    article.date;

  const timestamp = value ? new Date(value).getTime() : 0;

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function BlogPageLoader() {
  return (
    <div className="min-h-screen px-6 py-28 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-44 animate-pulse rounded-full bg-cyan-300/10" />
        <div className="mt-6 h-16 max-w-3xl animate-pulse rounded-2xl bg-white/[0.05]" />
        <div className="mt-4 h-6 max-w-xl animate-pulse rounded-xl bg-white/[0.04]" />

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]"
            >
              <div className="h-56 animate-pulse bg-white/[0.05]" />
              <div className="space-y-4 p-6">
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.05]" />
                <div className="h-7 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/articles`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load articles"
        );
      }

      const articleList = Array.isArray(data)
        ? data
        : data.articles || [];

      setArticles(articleList);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load articles"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const sortedArticles = useMemo(() => {
    return [...articles].sort(
      (first, second) =>
        getArticleDate(second) - getArticleDate(first)
    );
  }, [articles]);

  const featuredArticle = useMemo(() => {
    return (
      sortedArticles.find(
        (article) =>
          article.is_featured === true ||
          article.featured === true
      ) || sortedArticles[0] || null
    );
  }, [sortedArticles]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      sortedArticles
        .map((article) => article.category)
        .filter(Boolean)
    );

    return ["All", ...uniqueCategories];
  }, [sortedArticles]);

  const filteredArticles = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return sortedArticles.filter((article) => {
      const isFeatured =
        featuredArticle &&
        article.slug === featuredArticle.slug;

      const categoryMatch =
        activeCategory === "All" ||
        article.category === activeCategory;

      const searchableContent = [
        article.title,
        article.subtitle,
        article.category,
        article.author,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      return !isFeatured && categoryMatch && searchMatch;
    });
  }, [
    activeCategory,
    featuredArticle,
    search,
    sortedArticles,
  ]);

  const trendingArticles = useMemo(() => {
    return [...sortedArticles]
      .filter(
        (article) =>
          !featuredArticle ||
          article.slug !== featuredArticle.slug
      )
      .sort(
        (first, second) =>
          (second.views || 0) - (first.views || 0)
      )
      .slice(0, 3);
  }, [featuredArticle, sortedArticles]);

  if (loading) {
    return <BlogPageLoader />;
  }

  return (
    <div className="min-h-screen text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,212,255,.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,.08),transparent_30%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pb-24 lg:pt-28">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Stories from the island
          </p>

          <h1 className="mt-5 max-w-4xl font-serif text-5xl font-semibold leading-[1.05] md:text-7xl">
            Explore Sri Lanka
            <span className="block text-cyan-300">
              Through Our Stories
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 md:text-lg">
            Travel guides, local experiences, destination inspiration,
            and practical tips for your Sri Lankan journey.
          </p>

          <div className="mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-2 backdrop-blur-xl">
            <span className="pl-3 text-white/40">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search stories and travel guides..."
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-white/35"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-xl px-3 py-2 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        {error && (
          <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-red-300/20 bg-red-400/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={loadArticles}
              className="w-fit rounded-full border border-red-200/25 px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-red-100"
            >
              Try Again
            </button>
          </div>
        )}

        {featuredArticle && (
          <section>
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Editor&apos;s choice
                </p>

                <h2 className="mt-3 font-serif text-4xl font-semibold">
                  Featured Story
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() =>
                      setActiveCategory(category)
                    }
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                      activeCategory === category
                        ? "border-cyan-300 bg-cyan-400/15 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                        : "border-white/10 bg-white/[0.035] text-white/55 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <article className="group grid overflow-hidden rounded-[30px] border border-cyan-300/20 bg-white/[0.04] shadow-[0_0_60px_rgba(34,211,238,0.07)] lg:grid-cols-[1.35fr_.9fr]">
              <Link
                to={`/blog/${featuredArticle.slug}`}
                className="relative min-h-[360px] overflow-hidden lg:min-h-[500px]"
              >
                <img
                  src={featuredArticle.hero_image}
                  alt={featuredArticle.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#081328]/65 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#081328]/30" />
              </Link>

              <div className="flex flex-col justify-center p-8 md:p-12">
                <span className="w-fit rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                  {featuredArticle.category}
                </span>

                <h3 className="mt-6 font-serif text-4xl font-semibold leading-tight md:text-5xl">
                  {featuredArticle.title}
                </h3>

                <p className="mt-5 text-base leading-7 text-white/58">
                  {featuredArticle.subtitle}
                </p>

                <div className="mt-7 flex flex-wrap gap-3 text-xs text-white/45">
                  <span>
                    {featuredArticle.author}
                  </span>
                  <span>•</span>
                  <span>
                    {featuredArticle.published_date}
                  </span>
                  <span>•</span>
                  <span>
                    {featuredArticle.read_time}
                  </span>
                </div>

                <Link
                  to={`/blog/${featuredArticle.slug}`}
                  className="mt-8 inline-flex w-fit items-center gap-3 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:-translate-y-1 hover:bg-cyan-400/20 hover:shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                >
                  Read Featured Story
                  <span>→</span>
                </Link>
              </div>
            </article>
          </section>
        )}

        {!featuredArticle && !error && (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-12 text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Blog
            </p>

            <h2 className="mt-4 font-serif text-4xl font-semibold">
              No articles published yet
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Add a published article to the MongoDB
              <code className="mx-1 text-cyan-300">
                articles
              </code>
              collection and it will appear here automatically.
            </p>
          </div>
        )}

        {featuredArticle && (
          <section className="mt-20 grid gap-12 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Latest articles
                  </p>

                  <h2 className="mt-3 font-serif text-4xl font-semibold">
                    Travel Inspiration
                  </h2>
                </div>

                <p className="text-sm text-white/40">
                  {filteredArticles.length}
                  {filteredArticles.length === 1
                    ? " article"
                    : " articles"}
                </p>
              </div>

              {filteredArticles.length > 0 ? (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredArticles.map((article) => (
                    <BlogCard
                      key={article._id || article.slug}
                      article={article}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-10 text-center">
                  <h3 className="font-serif text-3xl font-semibold">
                    No matching stories
                  </h3>

                  <p className="mt-3 text-sm text-white/45">
                    Try another category or search phrase.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("All");
                    }}
                    className="mt-6 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-cyan-200"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            <aside className="space-y-8">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Trending now
                </p>

                <div className="mt-5 space-y-5">
                  {trendingArticles.map(
                    (article, index) => (
                      <Link
                        key={article._id || article.slug}
                        to={`/blog/${article.slug}`}
                        className="group flex gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 font-black text-cyan-300">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                            {article.category}
                          </p>

                          <h4 className="mt-1 text-sm font-semibold leading-5 text-white/80 transition group-hover:text-white">
                            {article.title}
                          </h4>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-6 shadow-[0_0_45px_rgba(34,211,238,0.08)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Plan smarter
                </p>

                <h3 className="mt-4 font-serif text-3xl font-semibold">
                  Build your perfect Sri Lanka trip with AI
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/55">
                  Get personalized destinations, routes,
                  hotels, and travel ideas.
                </p>

                <Link
                  to="/plan-trip"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#061225] shadow-[0_0_24px_rgba(34,211,238,0.36)] transition hover:-translate-y-1 hover:shadow-[0_0_34px_rgba(34,211,238,0.58)]"
                >
                  Plan Your Trip
                  <span>→</span>
                </Link>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
