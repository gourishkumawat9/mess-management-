// Formatting helpers. Dates are formatted by hand in IST so the server and the
// browser always render the same text (no hydration mismatches across ICU builds).

const IST_OFFSET_MS = 330 * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ist(d: Date | string) {
  return new Date(new Date(d).getTime() + IST_OFFSET_MS);
}

export function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatQty(n: number, unit?: string) {
  const text = String(Math.round(n * 100) / 100);
  return unit ? `${text} ${unit}` : text;
}

export function formatTime(d: Date | string) {
  const t = ist(d);
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function formatDate(d: Date | string) {
  const t = ist(d);
  return `${DAYS[t.getUTCDay()]}, ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
}

export function formatDateTime(d: Date | string) {
  return `${formatDate(d)}, ${formatTime(d)}`;
}

export function timeAgo(d: Date | string, now = new Date()) {
  const s = Math.max(0, Math.round((now.getTime() - new Date(d).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.round(h / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDays(days: number | null) {
  if (days === null) return "—";
  if (days < 1) return "< 1 day";
  const r = Math.round(days * 10) / 10;
  return `${r} day${r === 1 ? "" : "s"}`;
}

/** Time only for today (IST), otherwise date and time. */
export function formatWhen(d: Date | string, now = new Date()) {
  const a = ist(d);
  const b = ist(now);
  const sameDay = a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
  return sameDay ? formatTime(d) : `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]}, ${formatTime(d)}`;
}

/** "Today", "Tomorrow" or the date, in IST. */
export function formatDay(d: Date | string, now = new Date()) {
  const key = (x: Date | string) => {
    const t = ist(x);
    return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  };
  const diff = Math.round((key(d) - key(now)) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return formatDate(d);
}
