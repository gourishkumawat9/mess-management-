"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

// A big statement whose words fill in one by one as it scrolls through the
// viewport (faded words become solid), the scroll-scrubbed text effect.
export function ScrollWords({ text, className, accent = [] }: { text: string; className?: string; accent?: number[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  const [lit, setLit] = useState(words.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block's top enters at 85% of the viewport, 1 when its bottom reaches 45%.
      const start = vh * 0.85;
      const end = vh * 0.45;
      const progress = (start - r.top) / (start - end + r.height);
      setLit(Math.round(Math.min(1, Math.max(0, progress)) * words.length));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [words.length]);

  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          className={clsx("scroll-word", i < lit ? (accent.includes(i) ? "text-brand-600" : "text-ink") : "text-ink/15")}
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
