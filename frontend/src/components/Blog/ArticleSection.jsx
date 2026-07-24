import { useEffect, useRef } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ParallaxImage({ src, alt }) {
  const wrapperRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    let frameId = null;

    const update = () => {
      frameId = null;

      const wrapper = wrapperRef.current;
      const image = imageRef.current;

      if (!wrapper || !image) return;

      const rect = wrapper.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.bottom < -150 || rect.top > viewportHeight + 150) {
        return;
      }

      const centerOffset =
        rect.top + rect.height / 2 - viewportHeight / 2;

      const progress = clamp(
        centerOffset / (viewportHeight / 2 + rect.height / 2),
        -1,
        1
      );

      image.style.transform = `
        translate3d(0, ${progress * -110}px, 0)
        scale(1.18)
      `;
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(update);
      }
    };

    update();

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
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="group relative mb-10 h-[340px] overflow-hidden rounded-[30px] border border-cyan-300/15 shadow-[0_0_50px_rgba(34,211,238,0.11)] md:h-[540px]"
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="absolute -inset-y-[16%] left-0 h-[132%] w-full object-cover will-change-transform transition-[filter] duration-700 group-hover:brightness-110"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071225]/45 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset ring-cyan-200/40 transition duration-500 group-hover:opacity-100" />
    </div>
  );
}

export default function ArticleSection({ section }) {
  // Overview section එකක්ද කියලා අඳුරගන්නවා
  const isOverview = section.label === "Overview" || section.heading === "Overview";

  return (
    <section>
      {/* පින්තූරය හැමවෙලේම පෙන්වනවා */}
      {section.image && (
        <ParallaxImage
          src={section.image}
          alt={section.heading}
        />
      )}

      {/* Overview එකක් නෙමෙයි නම් විතරක් අකුරු ටික පෙන්වනවා */}
      {!isOverview && (
        <div className="mx-auto max-w-3xl text-center">
          {section.label && (
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.65)]">
              {section.label}
            </p>
          )}

          <h3 className="mt-4 font-serif text-4xl font-semibold drop-shadow-[0_0_16px_rgba(34,211,238,0.15)] md:text-5xl">
            {section.heading}
          </h3>

          <div
            className="mt-6 text-lg leading-9 text-white/70 text-left [&>h2]:font-serif [&>h2]:text-3xl [&>h2]:font-semibold [&>h2]:text-cyan-300 [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:font-serif [&>h3]:text-2xl [&>h3]:text-cyan-100 [&>h3]:mt-8 [&>h3]:mb-3 [&>p]:mb-5 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-5 [&>ul>li]:mb-2 [&>ul>li>b]:text-cyan-200"
            dangerouslySetInnerHTML={{ __html: section.text }}
          />
        </div>
      )}
    </section>
  );
}