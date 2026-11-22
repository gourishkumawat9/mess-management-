import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { checkoutSignatureValid, paymentOptions, toPaise, webhookSignatureValid } = await import("@/server/payments");
const { settingsSchema } = await import("@/lib/validation");
const { canTransition, customerCanCancel, orderTotal } = await import("@/lib/orders");

const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("hex");

describe("Razorpay signatures", () => {
  beforeEach(() => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "key-secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "hook-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a genuine checkout signature and rejects a forged one", () => {
    const sig = sign("order_1|pay_1", "key-secret");
    expect(checkoutSignatureValid("order_1", "pay_1", sig)).toBe(true);
    expect(checkoutSignatureValid("order_1", "pay_2", sig)).toBe(false);
    expect(checkoutSignatureValid("order_2", "pay_1", sig)).toBe(false);
    expect(checkoutSignatureValid("order_1", "pay_1", sign("order_1|pay_1", "guess"))).toBe(false);
    expect(checkoutSignatureValid("order_1", "pay_1", "")).toBe(false);
  });

  it("checks webhooks against the raw body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(webhookSignatureValid(body, sign(body, "hook-secret"))).toBe(true);
    expect(webhookSignatureValid(body + " ", sign(body, "hook-secret"))).toBe(false);
    expect(webhookSignatureValid(body, sign(body, "key-secret"))).toBe(false);
  });

  it("never verifies anything when the secrets are missing", () => {
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    expect(checkoutSignatureValid("order_1", "pay_1", sign("order_1|pay_1", ""))).toBe(false);
    expect(webhookSignatureValid("{}", sign("{}", ""))).toBe(false);
  });

  it("offers online payment only when keys are set", () => {
    expect(paymentOptions()).toEqual({ online: true, counter: true });
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");
    vi.stubEnv("PAY_AT_COUNTER", "false");
    expect(paymentOptions()).toEqual({ online: false, counter: false });
  });

  it("converts rupees to paise", () => {
    expect(toPaise(65)).toBe(6500);
  });
});

describe("money and order rules", () => {
  it("rejects negative, fractional or zero-quantity lines", () => {
    expect(orderTotal([{ price: 80, quantity: 2 }, { price: 55, quantity: 1 }])).toBe(215);
    expect(() => orderTotal([{ price: -80, quantity: 1 }])).toThrow();
    expect(() => orderTotal([{ price: 80, quantity: 0 }])).toThrow();
    expect(() => orderTotal([{ price: 80, quantity: 1.5 }])).toThrow();
  });

  it("never lets staff push an unpaid online order to the kitchen", () => {
    expect(canTransition("AWAITING_PAYMENT", "PLACED")).toBe(false);
    expect(canTransition("AWAITING_PAYMENT", "PREPARING")).toBe(false);
    expect(canTransition("PLACED", "AWAITING_PAYMENT")).toBe(false);
    expect(customerCanCancel("AWAITING_PAYMENT")).toBe(true);
    expect(customerCanCancel("PREPARING")).toBe(false);
  });

  it("only saves canteen hours it can enforce", () => {
    expect(settingsSchema.safeParse({ canteenHours: "9:00 PM – 4:00 AM" }).success).toBe(true);
    expect(settingsSchema.safeParse({ canteenHours: "evenings" }).success).toBe(false);
  });
});
