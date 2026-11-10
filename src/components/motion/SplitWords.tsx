// Headline whose words rise out of a mask one after another on load.
export function SplitWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="split-word" aria-hidden>
          <span style={{ "--i": i } as React.CSSProperties}>{w}</span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
