import { describe, expect, it } from "vitest";
import { averageDailyUsage, roundQty, stockInsight, type StockItemInput } from "@/lib/inventory";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-29T06:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);

const item = (over: Partial<StockItemInput> = {}): StockItemInput => ({
  quantity: 100,
  reorderLevel: 20,
  parLevel: 150,
  shelfLifeDays: null,
  lastRestockedAt: null,
  createdAt: daysAgo(60),
  ...over,
});

describe("averageDailyUsage", () => {
  it("averages usage and wastage over the 14 day window", () => {
    const movements = [
      { type: "USAGE", change: -70, createdAt: daysAgo(3) },
      { type: "WASTAGE", change: -14, createdAt: daysAgo(5) },
      { type: "RESTOCK", change: 200, createdAt: daysAgo(4) },
      { type: "USAGE", change: -500, createdAt: daysAgo(20) }, // outside the window
    ];
    expect(averageDailyUsage(movements, daysAgo(60), now)).toBeCloseTo(84 / 14);
  });

  it("does not under-estimate items tracked for only a few days", () => {
    const movements = [{ type: "USAGE", change: -30, createdAt: daysAgo(1) }];
    expect(averageDailyUsage(movements, daysAgo(2), now)).toBeCloseTo(15);
  });

  it("returns null when nothing has been used", () => {
    expect(averageDailyUsage([{ type: "RESTOCK", change: 10, createdAt: daysAgo(1) }], daysAgo(30), now)).toBeNull();
  });

  it("ignores count corrections", () => {
    expect(averageDailyUsage([{ type: "ADJUSTMENT", change: -10, createdAt: daysAgo(1) }], daysAgo(30), now)).toBeNull();
  });
});

describe("stockInsight", () => {
  it("flags items with no stock as out", () => {
    expect(stockInsight(item({ quantity: 0 }), 5, now).status).toBe("OUT");
  });

  it("flags items at or below the reorder level as low, due now", () => {
    const s = stockInsight(item({ quantity: 20 }), 5, now);
    expect(s.status).toBe("LOW");
    expect(s.restockBy?.getTime()).toBe(now.getTime());
  });

  it("warns when the reorder level will be hit by tomorrow", () => {
    // 25 kg left, alert at 20, using 6 a day: hits 20 in under a day.
    const s = stockInsight(item({ quantity: 25 }), 6, now);
    expect(s.status).toBe("RUNNING_OUT");
    expect(s.daysLeft).toBeCloseTo(25 / 6);
    // 30 kg left: hits 20 in 1.7 days, so no warning yet.
    expect(stockInsight(item({ quantity: 30 }), 6, now).status).toBe("OK");
  });

  it("is OK with plenty of stock and predicts the restock date", () => {
    const s = stockInsight(item({ quantity: 100 }), 10, now);
    expect(s.status).toBe("OK");
    expect(s.daysLeft).toBe(10);
    expect(s.restockBy?.getTime()).toBe(now.getTime() + 8 * DAY);
  });

  it("is OK and has no forecast when usage is unknown", () => {
    const s = stockInsight(item({ quantity: 50 }), null, now);
    expect(s).toMatchObject({ status: "OK", daysLeft: null, restockBy: null });
  });

  it("suggests topping up to the full stock target", () => {
    expect(stockInsight(item({ quantity: 37.5 }), 5, now).suggestedOrder).toBe(113);
    expect(stockInsight(item({ quantity: 10, parLevel: 0, reorderLevel: 20 }), 5, now).suggestedOrder).toBe(30);
    expect(stockInsight(item({ quantity: 200 }), 5, now).suggestedOrder).toBe(0);
  });

  it("flags perishables close to their use-by time", () => {
    const curd = item({ shelfLifeDays: 2, lastRestockedAt: daysAgo(1.9) });
    expect(stockInsight(curd, 5, now).expiringSoon).toBe(true);
    const fresh = item({ shelfLifeDays: 2, lastRestockedAt: daysAgo(0.2) });
    expect(stockInsight(fresh, 5, now).expiringSoon).toBe(false);
    expect(stockInsight({ ...curd, quantity: 0 }, 5, now).expiringSoon).toBe(false);
  });
});

describe("roundQty", () => {
  it("removes floating point noise", () => {
    expect(roundQty(0.1 + 0.2)).toBe(0.3);
  });
});
