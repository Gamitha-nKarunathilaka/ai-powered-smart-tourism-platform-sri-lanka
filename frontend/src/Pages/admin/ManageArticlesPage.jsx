import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const FALLBACK_IMAGE =
  "https://placehold.co/240x160?text=No+Image";

export default function ManageArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

      setArticles(
        Array.isArray(data)
          ? data
          : data.articles || []
      );
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

  async function handleDelete(article) {
    const confirmed = window.confirm(
      `Delete "${article.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingSlug(article.slug);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/articles/${encodeURIComponent(
          article.slug
        )}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to delete article"
        );
      }

      setArticles((current) =>
        current.filter(
          (item) => item.slug !== article.slug
        )
      );
      setMessage(data.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete article"
      );
    } finally {
      setDeletingSlug("");
    }
  }

  return (
    <div className="min-h-screen bg-[#081328] px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Blog Administration
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold">
              Manage Articles
            </h1>
          </div>

          <Link
            to="/admin/articles/create"
            className="inline-flex w-fit rounded-full bg-cyan-300 px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#061225]"
          >
            + New Article
          </Link>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-300/20 bg-red-400/[0.06] p-4 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4 text-emerald-200">
            {message}
          </div>
        )}

        {loading ? (
          <p className="mt-12 text-white/50">
            Loading articles...
          </p>
        ) : articles.length === 0 ? (
          <div className="mt-12 rounded-[26px] border border-white/10 bg-white/[0.03] p-12 text-center">
            <h2 className="font-serif text-3xl font-semibold">
              No articles found
            </h2>
            <Link
              to="/admin/articles/create"
              className="mt-6 inline-block text-cyan-300"
            >
              Create the first article
            </Link>
          </div>
        ) : (
          <div className="mt-10 overflow-hidden rounded-[26px] border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/[0.04]">
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-white/45">
                    <th className="px-5 py-4">Article</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Views</th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10 bg-white/[0.02]">
                  {articles.map((article) => (
                    <tr key={article._id || article.slug}>
                      <td className="px-5 py-5">
                        <div className="flex min-w-[280px] items-center gap-4">
                          <img
                            src={
                              article.hero_image ||
                              FALLBACK_IMAGE
                            }
                            alt={article.title}
                            onError={(event) => {
                              event.currentTarget.onerror =
                                null;
                              event.currentTarget.src =
                                FALLBACK_IMAGE;
                            }}
                            className="h-16 w-20 rounded-xl object-cover"
                          />

                          <div>
                            <p className="font-semibold">
                              {article.title}
                            </p>
                            <p className="mt-1 text-xs text-white/40">
                              {article.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-sm text-white/60">
                        {article.category}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            article.published
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-amber-400/10 text-amber-300"
                          }`}
                        >
                          {article.published
                            ? "Published"
                            : "Draft"}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-sm text-white/60">
                        {article.views || 0}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/blog/${article.slug}`}
                            className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/65"
                          >
                            View
                          </Link>

                          <Link
                            to={`/admin/articles/${article.slug}/edit`}
                            className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-200"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            disabled={
                              deletingSlug === article.slug
                            }
                            onClick={() =>
                              handleDelete(article)
                            }
                            className="rounded-full border border-red-300/20 bg-red-400/[0.06] px-4 py-2 text-xs text-red-200 disabled:opacity-40"
                          >
                            {deletingSlug === article.slug
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
