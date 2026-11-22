import clsx from "clsx";

// A round badge whose ring of text slowly rotates, like a stamp on the page.
export function Sticker({
  text = "LATE NIGHT CRAVINGS • SORTED • ",
  center,
  className,
  tone = "gold",
}: {
  text?: string;
  center: React.ReactNode;
  /** Include a position utility (absolute/relative); defaults to relative. */
  className?: string;
  tone?: "gold" | "red" | "ink";
}) {
  const positioned = /\b(absolute|relative|fixed)\b/.test(className ?? "");
  return (
    <div
      className={clsx(
        "flex h-32 w-32 items-center justify-center rounded-full border-2 border-ink shadow-hard",
        tone === "gold" && "bg-gold-400 text-ink",
        tone === "red" && "bg-brand-600 text-white",
        tone === "ink" && "bg-ink text-gold-300",
        !positioned && "relative",
        className,
      )}
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full animate-spin-slow" aria-hidden>
        <defs>
          <path id="sticker-circle" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
        </defs>
        <text className="fill-current font-sans text-[10px] font-extrabold uppercase tracking-[0.22em]">
          <textPath href="#sticker-circle">{text}</textPath>
        </text>
      </svg>
      <div className="relative">{center}</div>
    </div>
  );
}
