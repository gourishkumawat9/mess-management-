import { describe, expect, it } from "vitest";
import { isWithinHours, parseHours } from "@/lib/hours";

// An instant at the given India time on 18 Nov 2026 (IST = UTC+5:30).
const ist = (h: number, m = 0) => new Date(Date.UTC(2026, 10, 18, h, m) - 330 * 60 * 1000);

describe("canteen timings", () => {
  it("reads clock times in common formats", () => {
    expect(parseHours("9:00 PM – 4:00 AM")).toEqual({ opens: 21 * 60, closes: 4 * 60 });
    expect(parseHours("8 am - 11:30 pm")).toEqual({ opens: 8 * 60, closes: 23 * 60 + 30 });
    expect(parseHours("12:00 PM – 12:00 AM")).toEqual({ opens: 12 * 60, closes: 0 });
    expect(parseHours("Late night")).toBeNull();
  });

  it("is open overnight from 9 PM to 4 AM, India time", () => {
    const hours = "9:00 PM – 4:00 AM";
    expect(isWithinHours(hours, ist(18, 51))).toBe(false);
    expect(isWithinHours(hours, ist(20, 59))).toBe(false);
    expect(isWithinHours(hours, ist(21, 0))).toBe(true);
    expect(isWithinHours(hours, ist(23, 30))).toBe(true);
    expect(isWithinHours(hours, ist(2, 0))).toBe(true);
    expect(isWithinHours(hours, ist(3, 59))).toBe(true);
    expect(isWithinHours(hours, ist(4, 0))).toBe(false);
    expect(isWithinHours(hours, ist(12, 0))).toBe(false);
  });

  it("handles same-day timings", () => {
    expect(isWithinHours("8:00 AM – 10:00 PM", ist(7, 59))).toBe(false);
    expect(isWithinHours("8:00 AM – 10:00 PM", ist(13, 0))).toBe(true);
    expect(isWithinHours("8:00 AM – 10:00 PM", ist(22, 0))).toBe(false);
  });

  it("never closes the canteen when the timings can't be read", () => {
    expect(isWithinHours("Late night", ist(12, 0))).toBe(true);
  });
});
