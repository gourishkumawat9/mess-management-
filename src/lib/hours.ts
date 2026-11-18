// Canteen timings such as "9:00 PM – 4:00 AM", read as India time.

const IST_OFFSET_MIN = 330; // UTC+5:30, no daylight saving
const DAY_MIN = 24 * 60;

/** Opening and closing time in minutes after midnight, or null if the text has no two clock times. */
export function parseHours(text: string): { opens: number; closes: number } | null {
  const times = [...text.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([AP])\.?\s*M\.?/gi)].map(([, h, m, ap]) => {
    const hour = Number(h);
    const minute = Number(m ?? 0);
    if (hour < 1 || hour > 12 || minute > 59) return null;
    return ((hour % 12) + (ap.toUpperCase() === "P" ? 12 : 0)) * 60 + minute;
  });
  if (times.length < 2 || times[0] == null || times[1] == null) return null;
  return { opens: times[0], closes: times[1] };
}

/**
 * Whether `now` falls inside the timings, in India time. Handles hours that run
 * past midnight (9 PM – 4 AM). Timings that can't be read never close the canteen.
 */
export function isWithinHours(text: string, now: Date): boolean {
  const hours = parseHours(text);
  if (!hours) return true;
  const minute = (now.getUTCHours() * 60 + now.getUTCMinutes() + IST_OFFSET_MIN) % DAY_MIN;
  const { opens, closes } = hours;
  if (opens === closes) return true;
  return opens < closes ? minute >= opens && minute < closes : minute >= opens || minute < closes;
}
