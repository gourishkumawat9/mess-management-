import clsx from "clsx";

// A round badge whose ring of text slowly rotates, like a stamp on the photo.
export function Sticker({
  text = "IIM SAMBALPUR • MESS & CANTEEN • ",
  center,
  className,
}: {
  text?: string;
  center: React.ReactNode;
  /** Include a position utility (absolute/relative); defaults to relative. */
  className?: string;
}) {
  const positioned = /\b(absolute|relative|fixed)\b/.test(className ?? "");
  return (
    <div className={clsx("flex h-32 w-32 items-center justify-center rounded-full bg-gold-400 text-ink shadow-lift", !positioned && "relative", className)}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full animate-spin-slow" aria-hidden>
        <defs>
          <path id="sticker-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className="fill-current font-display text-[10.5px] font-bold uppercase tracking-[0.2em]">
          <textPath href="#sticker-circle">{text}</textPath>
        </text>
      </svg>
      <div className="relative">{center}</div>
    </div>
  );
}
