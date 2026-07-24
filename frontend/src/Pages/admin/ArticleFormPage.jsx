import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import BlogCard from "../../components/blog/BlogCard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const emptyForm = {
  slug: "",
  title: "",
  subtitle: "",
  category: "Culture",
  author: "",
  published_date: "",
  read_time: "",
  hero_image: "",
  tags: "",
  intro_title: "",
  intro: "",
  paragraphs: [""],
  sections: [
    {
      label: "",
      heading: "",
      text: "",
      image: "",
    },
  ],
  published: true,
  is_featured: false,
};

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40"
    />
  );
}

function Label({ children }) {
  return (
    <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/50">
      {children}
    </label>
  );
}

export default function ArticleFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(slug);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode) return;

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/articles/${encodeURIComponent(
            slug
          )}?increment_views=false`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load article"
          );
        }

        setForm({
          slug: data.slug || "",
          title: data.title || "",
          subtitle: data.subtitle || "",
          category: data.category || "Culture",
          author: data.author || "",
          published_date: String(
            data.published_date || ""
          ).slice(0, 10),
          read_time: data.read_time || "",
          hero_image: data.hero_image || "",
          tags: Array.isArray(data.tags)
            ? data.tags.join(", ")
            : "",
          intro_title: data.intro_title || "",
          intro: data.intro || "",
          paragraphs:
            data.paragraphs?.length > 0
              ? data.paragraphs
              : [""],
          sections:
            data.sections?.length > 0
              ? data.sections.map((section) => ({
                  label: section.label || "",
                  heading: section.heading || "",
                  text: section.text || "",
                  image: section.image || "",
                }))
              : [
                  {
                    label: "",
                    heading: "",
                    text: "",
                    image: "",
                  },
                ],
          published: Boolean(data.published),
          is_featured: Boolean(
            data.is_featured
          ),
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load article"
        );
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [isEditMode, slug]);

  const preview = useMemo(
    () => ({
      _id: "preview",
      slug: form.slug || "preview",
      title: form.title || "Article title",
      subtitle:
        form.subtitle || "Article subtitle",
      category: form.category || "Travel",
      author: form.author || "Author",
      published_date:
        form.published_date || "Publish date",
      read_time: form.read_time || "5 min read",
      hero_image:
        form.hero_image ||
        "https://placehold.co/1200x800?text=Article+Image",
    }),
    [form]
  );

  function updateField(event) {
    const { name, value, type, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  }

  function updateParagraph(index, value) {
    setForm((current) => {
      const paragraphs = [...current.paragraphs];
      paragraphs[index] = value;
      return { ...current, paragraphs };
    });
  }

  function updateSection(index, field, value) {
    setForm((current) => ({
      ...current,
      sections: current.sections.map(
        (section, itemIndex) =>
          itemIndex === index
            ? { ...section, [field]: value }
            : section
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      paragraphs: form.paragraphs
        .map((item) => item.trim())
        .filter(Boolean),
      sections: form.sections.map((section) => ({
        label: section.label.trim() || null,
        heading: section.heading.trim(),
        text: section.text.trim(),
        image: section.image.trim() || null,
      })),
    };

    const url = isEditMode
      ? `${API_BASE_URL}/articles/${encodeURIComponent(
          slug
        )}`
      : `${API_BASE_URL}/articles`;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save article"
        );
      }

      navigate("/admin/articles");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save article"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#081328] text-white">
        Loading article...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081328] px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Blog Administration
            </p>

            <h1 className="mt-4 font-serif text-5xl font-semibold">
              {isEditMode
                ? "Edit Article"
                : "Create Article"}
            </h1>
          </div>

          <Link
            to="/admin/articles"
            className="text-sm text-cyan-300"
          >
            ← Manage Articles
          </Link>
        </div>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {error && (
              <div className="rounded-2xl border border-red-300/20 bg-red-400/[0.06] p-4 text-red-200">
                {error}
              </div>
            )}

            <section className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <h2 className="font-serif text-3xl font-semibold">
                Card Details
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Title</Label>
                  <Input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Subtitle</Label>
                  <TextArea
                    name="subtitle"
                    value={form.subtitle}
                    onChange={updateField}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Slug</Label>
                  <Input
                    name="slug"
                    value={form.slug}
                    onChange={updateField}
                    placeholder="Auto-generated from title"
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Input
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <Label>Author</Label>
                  <Input
                    name="author"
                    value={form.author}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <Label>Read Time</Label>
                  <Input
                    name="read_time"
                    value={form.read_time}
                    onChange={updateField}
                    placeholder="8 min read"
                    required
                  />
                </div>

                <div>
                  <Label>Published Date</Label>
                  <Input
                    type="date"
                    name="published_date"
                    value={form.published_date}
                    onChange={updateField}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <Input
                    name="tags"
                    value={form.tags}
                    onChange={updateField}
                    placeholder="Culture, History, UNESCO"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Hero Image URL</Label>
                  <Input
                    type="text"
                    name="hero_image"
                    value={form.hero_image}
                    onChange={updateField}
                    required
                  />
                </div>

                <label className="flex items-center gap-3 text-sm text-white/60">
                  <input
                    type="checkbox"
                    name="published"
                    checked={form.published}
                    onChange={updateField}
                  />
                  Published
                </label>

                <label className="flex items-center gap-3 text-sm text-white/60">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={form.is_featured}
                    onChange={updateField}
                  />
                  Featured
                </label>
              </div>
            </section>

            <section className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <h2 className="font-serif text-3xl font-semibold">
                Introduction
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <Label>Introduction Title</Label>
                  <Input
                    name="intro_title"
                    value={form.intro_title}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <Label>Introduction Text</Label>
                  <TextArea
                    name="intro"
                    value={form.intro}
                    onChange={updateField}
                    rows={5}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-3xl font-semibold">
                  Paragraphs
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      paragraphs: [
                        ...current.paragraphs,
                        "",
                      ],
                    }))
                  }
                  className="text-sm text-cyan-300"
                >
                  + Add Paragraph
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {form.paragraphs.map(
                  (paragraph, index) => (
                    <div key={index}>
                      <div className="mb-2 flex justify-between">
                        <Label>
                          Paragraph {index + 1}
                        </Label>

                        {form.paragraphs.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                paragraphs:
                                  current.paragraphs.filter(
                                    (_, itemIndex) =>
                                      itemIndex !== index
                                  ),
                              }))
                            }
                            className="text-xs text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <TextArea
                        value={paragraph}
                        onChange={(event) =>
                          updateParagraph(
                            index,
                            event.target.value
                          )
                        }
                        rows={4}
                      />
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-3xl font-semibold">
                  Sections
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      sections: [
                        ...current.sections,
                        {
                          label: "",
                          heading: "",
                          text: "",
                          image: "",
                        },
                      ],
                    }))
                  }
                  className="text-sm text-cyan-300"
                >
                  + Add Section
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {form.sections.map((section, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 p-5"
                  >
                    <div className="mb-4 flex justify-between">
                      <h3 className="font-semibold">
                        Section {index + 1}
                      </h3>

                      {form.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              sections:
                                current.sections.filter(
                                  (_, itemIndex) =>
                                    itemIndex !== index
                                ),
                            }))
                          }
                          className="text-xs text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={section.label}
                          onChange={(event) =>
                            updateSection(
                              index,
                              "label",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label>Heading</Label>
                        <Input
                          value={section.heading}
                          onChange={(event) =>
                            updateSection(
                              index,
                              "heading",
                              event.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Text</Label>
                        <TextArea
                          value={section.text}
                          onChange={(event) =>
                            updateSection(
                              index,
                              "text",
                              event.target.value
                            )
                          }
                          rows={5}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Image URL</Label>
                        <Input
                          type="text"
                          value={section.image}
                          onChange={(event) =>
                            updateSection(
                              index,
                              "image",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#061225] disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEditMode
                  ? "Update Article"
                  : "Create Article"}
            </button>
          </form>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              Card Preview
            </p>

            <BlogCard article={preview} />
          </aside>
        </div>
      </div>
    </div>
  );
}
