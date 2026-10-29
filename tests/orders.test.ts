import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@/lib/constants";
import { canTransition, customerCanCancel, istDateKey, nextStatus, orderTotal, startOfDayIST, statusTimestampField } from "@/lib/orders";

describe("order status flow", () => {
  it("moves forward one step at a time", () => {
    expect(nextStatus("PLACED")).toBe("PREPARING");
    expect(nextStatus("PREPARING")).toBe("READY");
    expect(nextStatus("READY")).toBe("COMPLETED");
    expect(nextStatus("COMPLETED")).toBeNull();
    expect(nextStatus("CANCELLED")).toBeNull();
  });

  it("does not allow skipping steps or reopening finished orders", () => {
    expect(canTransition("PLACED", "READY")).toBe(false);
    expect(canTransition("PLACED", "COMPLETED")).toBe(false);
    expect(canTransition("COMPLETED", "PLACED")).toBe(false);
    expect(canTransition("CANCELLED", "PREPARING")).toBe(false);
  });

  it("lets staff cancel any active order", () => {
    expect(canTransition("PLACED", "CANCELLED")).toBe(true);
    expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
    expect(canTransition("READY", "CANCELLED")).toBe(true);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
  });

  it("lets customers cancel only before cooking starts", () => {
    expect(ORDER_STATUSES.filter(customerCanCancel)).toEqual(["PLACED"]);
  });

  it("stamps the time of each step", () => {
    expect(statusTimestampField("READY")).toBe("readyAt");
    expect(statusTimestampField("PLACED")).toBeNull();
  });
});

describe("startOfDayIST", () => {
  it("returns Indian midnight as a UTC instant", () => {
    // 29 Oct 10:00 IST
    expect(startOfDayIST(new Date("2026-10-29T04:30:00Z")).toISOString()).toBe("2026-10-28T18:30:00.000Z");
  });

  it("rolls over at IST midnight, not UTC midnight", () => {
    // 29 Oct 00:15 IST is still 28 Oct in UTC
    expect(startOfDayIST(new Date("2026-10-28T18:45:00Z")).toISOString()).toBe("2026-10-28T18:30:00.000Z");
    // 28 Oct 23:50 IST
    expect(startOfDayIST(new Date("2026-10-28T18:20:00Z")).toISOString()).toBe("2026-10-27T18:30:00.000Z");
  });
});

describe("istDateKey", () => {
  it("names the Indian calendar day", () => {
    expect(istDateKey(new Date("2026-10-28T18:45:00Z"))).toBe("2026-10-29");
    expect(istDateKey(new Date("2026-10-28T18:20:00Z"))).toBe("2026-10-28");
  });
});

describe("orderTotal", () => {
  it("multiplies price by quantity", () => {
    expect(orderTotal([{ price: 55, quantity: 2 }, { price: 15, quantity: 3 }])).toBe(155);
  });
});
