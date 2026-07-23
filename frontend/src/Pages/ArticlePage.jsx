import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ArticleHero from "../components/blog/ArticleHero";
import ArticleSection from "../components/blog/ArticleSection";
import ShareButtons from "../components/blog/ShareButtons";
import ArticleLoader from "../components/blog/ArticleLoader";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -70px 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const hiddenTransform =
    direction === "left"
      ? "translate3d(-56px, 20px, 0) scale(.985)"
      : direction === "right"
        ? "translate3d(56px, 20px, 0) scale(.985)"
        : "translate3d(0, 52px, 0) scale(.985)";

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate3d(0, 0, 0) scale(1)"
          : hiddenTransform,
        filter: visible ? "blur(0px)" : "blur(6px)",
        transition: `
          opacity 850ms ease ${delay}ms,
          transform 1050ms cubic-bezier(.16,1,.3,1) ${delay}ms,
          filter 900ms ease ${delay}ms
        `,
      }}
    >
      {children}
    </div>
  );
}

export default function ArticlePage() {
  const { slug } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const progressRef = useRef(null);
  const heroImageRef = useRef(null);
  const heroContentRef = useRef(null);
  const heroOverlayRef = useRef(null);
  const glowLeftRef = useRef(null);
  const glowRightRef = useRef(null);
  const glowBottomRef = useRef(null);
  const scrollHintRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://127.0.0.1:8000/api/articles/${encodeURIComponent(slug)}`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Article not found");
        }

        setArticle(data);
        document.title = `${data.title} | Sri Lanka Travel`;
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load article"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!article) return undefined;

    let frameId = null;

    const updateParallax = () => {
      frameId = null;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const maxScroll =
        document.documentElement.scrollHeight - viewportHeight;

      const pageProgress =
        maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1) : 0;

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${pageProgress})`;
      }

      const heroHeight = Math.max(viewportHeight, 760);
      const heroProgress = clamp(scrollY / heroHeight, 0, 1.25);

      if (heroImageRef.current) {
        const translateY = Math.min(scrollY * 0.5, 420);
        const scale = 1.08 + heroProgress * 0.17;

        heroImageRef.current.style.transform = `
          translate3d(0, ${translateY}px, 0)
          scale(${scale})
        `;
      }

      if (heroContentRef.current) {
        const translateY = -Math.min(scrollY * 0.25, 200);
        const scale = 1 - heroProgress * 0.06;
        const opacity = clamp(1 - heroProgress * 1.3, 0, 1);

        heroContentRef.current.style.opacity = opacity;
        heroContentRef.current.style.transform = `
          translate3d(0, ${translateY}px, 0)
          scale(${scale})
        `;
      }

      if (heroOverlayRef.current) {
        heroOverlayRef.current.style.opacity =
          0.26 + heroProgress * 0.62;
      }

      if (glowLeftRef.current) {
        glowLeftRef.current.style.transform = `
          translate3d(${scrollY * 0.11}px, ${scrollY * 0.19}px, 0)
          scale(${1 + heroProgress * 0.2})
        `;
      }

      if (glowRightRef.current) {
        glowRightRef.current.style.transform = `
          translate3d(${-scrollY * 0.09}px, ${scrollY * 0.13}px, 0)
          scale(${1 + heroProgress * 0.16})
        `;
      }

      if (glowBottomRef.current) {
        glowBottomRef.current.style.transform = `
          translate3d(-50%, ${-scrollY * 0.12}px, 0)
          scale(${1 + heroProgress * 0.22})
        `;
      }

      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity =
          clamp(1 - heroProgress * 2.1, 0, 1);
      }
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [article]);

  if (loading) {
    return <ArticleLoader />;
  }

  if (error || !article) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div className="max-w-lg text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Article Error
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold">
            Article could not be loaded
          </h1>

          <p className="mt-4 text-foreground/55">
            {error || "The requested article was not found."}
          </p>

          <Link
            to="/blog"
            className="mt-7 inline-flex rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-primary"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        ref={progressRef}
        className="fixed left-0 top-0 z-[1200] h-[3px] w-full origin-left scale-x-0 bg-primary shadow-[0_0_18px_rgba(34,211,238,0.9)]"
      />

      <ArticleHero
        article={article}
        heroImageRef={heroImageRef}
        heroContentRef={heroContentRef}
        heroOverlayRef={heroOverlayRef}
        glowLeftRef={glowLeftRef}
        glowRightRef={glowRightRef}
        glowBottomRef={glowBottomRef}
        scrollHintRef={scrollHintRef}
      />

      <section className="border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-5 text-xs text-foreground/40 lg:px-8">
          <Link
            to="/"
            className="transition hover:text-primary"
          >
            Home
          </Link>

          <span>›</span>

          <Link
            to="/blog"
            className="transition hover:text-primary"
          >
            Travel Insights
          </Link>

          <span>›</span>

          <span className="max-w-[360px] truncate text-foreground/65">
            {article.title}
          </span>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl justify-center gap-8 px-6 py-20 lg:grid-cols-[64px_minmax(0,880px)_64px] lg:px-8 lg:py-28">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="mb-5 text-center text-sm text-foreground/55">
              Share
            </p>

            <ShareButtons
              vertical
              showLabel={false}
            />
          </div>
        </aside>

        <main className="mx-auto w-full max-w-[880px]">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                {article.category}
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight drop-shadow-[0_0_20px_rgba(34,211,238,0.18)] md:text-6xl">
                {article.intro_title}
              </h2>
            </div>

            <p className="mx-auto mt-10 max-w-3xl text-center text-lg leading-9 text-foreground/70">
              {article.intro}
            </p>

            <div className="mx-auto mt-8 max-w-3xl space-y-7 text-left">
              {article.paragraphs?.map((paragraph, index) => (
                <div
                  key={`${paragraph}-${index}`}
                  className="text-lg leading-9 text-foreground/70 [&>h2]:font-serif [&>h2]:text-3xl [&>h2]:font-semibold [&>h2]:text-primary [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:font-serif [&>h3]:text-2xl [&>h3]:text-cyan-100 [&>h3]:mt-8 [&>h3]:mb-3 [&>p]:mb-5 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-5 [&>ul>li]:mb-2 [&>ul>li>b]:text-cyan-200"
                  dangerouslySetInnerHTML={{ __html: paragraph }}
                />
              ))}
            </div>
          </Reveal>

          <div className="mt-20 space-y-24">
            {article.sections?.map((section, index) => (
              <Reveal
                key={`${section.heading}-${index}`}
                delay={index * 90}
                direction={index % 2 === 0 ? "left" : "right"}
              >
                <ArticleSection section={section} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-24">
            <section className="relative overflow-hidden rounded-[30px] border border-primary/25 bg-primary/[0.06] p-8 text-center shadow-[0_0_65px_rgba(34,211,238,0.15)] md:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/20 blur-[85px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-blue-500/15 blur-[95px]" />

              <p className="relative text-xs font-black uppercase tracking-[0.22em] text-primary">
                Plan Your Journey
              </p>

              <h3 className="relative mx-auto mt-5 max-w-3xl font-serif text-4xl font-semibold drop-shadow-[0_0_20px_rgba(34,211,238,0.2)] md:text-5xl">
                Turn this inspiration into your own Sri Lanka itinerary
              </h3>

              <p className="relative mx-auto mt-5 max-w-2xl text-base leading-7 text-foreground/60">
                Use the AI trip planner to select destinations, organize the
                route, estimate travel time, and build a more efficient journey.
              </p>

              <Link
                to="/plan-trip"
                className="relative mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-background shadow-[0_0_28px_rgba(34,211,238,0.48)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_44px_rgba(34,211,238,0.75)]"
              >
                Plan Your Trip →
              </Link>
            </section>
          </Reveal>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-9">
            <Link
              to="/blog"
              className="text-xs font-black uppercase tracking-[0.18em] text-primary"
            >
              ← Back to All Articles
            </Link>

            <ShareButtons />
          </div>
        </main>

        <div
          className="hidden lg:block"
          aria-hidden="true"
        />
      </div>
    </article>
  );
}