import { describe, expect, it } from "vitest";
import { formatDate, formatDay, formatDays, formatQty, formatTime, formatWhen } from "@/lib/format";

describe("formatting", () => {
  it("formats times in IST", () => {
    expect(formatTime("2026-10-29T04:35:00Z")).toBe("10:05 AM");
    expect(formatTime("2026-10-29T18:30:00Z")).toBe("12:00 AM");
    expect(formatTime("2026-10-29T06:30:00Z")).toBe("12:00 PM");
  });

  it("formats dates in IST", () => {
    expect(formatDate("2026-10-28T19:00:00Z")).toBe("Thu, 29 Oct");
  });

  it("shows only the time for today", () => {
    const now = new Date("2026-10-29T10:00:00Z");
    expect(formatWhen("2026-10-29T04:35:00Z", now)).toBe("10:05 AM");
    expect(formatWhen("2026-10-27T04:35:00Z", now)).toBe("27 Oct, 10:05 AM");
  });

  it("names today and tomorrow (IST)", () => {
    const now = new Date("2026-10-29T17:00:00Z"); // 10:30 PM IST on the 29th
    expect(formatDay("2026-10-29T18:00:00Z", now)).toBe("Today"); // 11:30 PM IST
    expect(formatDay("2026-10-29T19:00:00Z", now)).toBe("Tomorrow"); // 12:30 AM IST on the 30th
    expect(formatDay("2026-11-02T06:00:00Z", now)).toBe("Mon, 2 Nov");
  });

  it("formats quantities and durations", () => {
    expect(formatQty(12.5, "kg")).toBe("12.5 kg");
    expect(formatQty(3)).toBe("3");
    expect(formatQty(0.30000000000000004, "L")).toBe("0.3 L");
    expect(formatDays(null)).toBe("—");
    expect(formatDays(0.4)).toBe("< 1 day");
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(3.26)).toBe("3.3 days");
  });
});
