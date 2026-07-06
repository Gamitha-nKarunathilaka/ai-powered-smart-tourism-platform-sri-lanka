function ShareButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-xs font-bold text-white/65 shadow-[0_0_0_rgba(34,211,238,0)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-cyan-200 hover:shadow-[0_0_22px_rgba(34,211,238,0.22)]"
    >
      {label}
    </button>
  );
}

export default function ShareButtons({
  vertical = false,
  showLabel = true,
}) {
  const shareArticle = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=${title}&body=${url}`,
    };

    const target = links[platform];

    if (platform === "email") {
      window.location.href = target;
      return;
    }

    window.open(
      target,
      "_blank",
      "noopener,noreferrer,width=720,height=600"
    );
  };

  return (
    <div
      className={
        vertical
          ? "flex flex-col items-center gap-3"
          : "flex flex-wrap items-center gap-3"
      }
    >
      {showLabel && (
        <span className="text-xs text-white/45">
          Share:
        </span>
      )}

      <ShareButton
        label="f"
        onClick={() => shareArticle("facebook")}
      />

      <ShareButton
        label="𝕏"
        onClick={() => shareArticle("x")}
      />

      <ShareButton
        label="in"
        onClick={() => shareArticle("linkedin")}
      />

      <ShareButton
        label="✉"
        onClick={() => shareArticle("email")}
      />
    </div>
  );
}
