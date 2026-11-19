import { z } from "zod";
import { parseHours } from "./hours";
import {
  MAX_ITEM_QUANTITY,
  MAX_ORDER_LINES,
  FULFILMENTS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  ROLES,
} from "./constants";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

// ------------------------------------------------------------------ auth

export const registerSchema = z.object({
  name: trimmed(80).min(2, "Please enter your name"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{0,15}$/, "Enter a valid phone number")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  hostel: optionalText(40),
  room: optionalText(20),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email").max(200),
  password: z.string().min(1, "Enter your password").max(100),
});

// --------------------------------------------------------------- canteen

export const menuItemSchema = z.object({
  categoryId: z.string().min(1).max(40),
  name: trimmed(80).min(2, "Name is too short"),
  description: optionalText(300),
  price: z.coerce.number().int("Price must be in whole rupees").min(0).max(10_000),
  isVeg: z.boolean(),
  emoji: optionalText(8),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => !v || /^https?:\/\//.test(v) || v.startsWith("/"), "Image must be a URL"),
  isAvailable: z.boolean().default(true),
  isBestseller: z.boolean().default(false),
});

export const updateMenuItemSchema = menuItemSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const menuCategorySchema = z.object({
  name: trimmed(40).min(2, "Name is too short"),
});

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1).max(40),
        quantity: z.coerce.number().int().min(1).max(MAX_ITEM_QUANTITY, `You can order at most ${MAX_ITEM_QUANTITY} of one item`),
      }),
    )
    .min(1, "Your cart is empty")
    .max(MAX_ORDER_LINES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  note: optionalText(200),
  fulfilment: z.enum(FULFILMENTS).default("PICKUP"),
  hostel: optionalText(40),
  room: optionalText(20),
}).superRefine((o, ctx) => {
  if (o.fulfilment !== "DELIVERY") return;
  if (!o.hostel) ctx.addIssue({ code: "custom", path: ["hostel"], message: "Enter your hostel for delivery" });
  if (!o.room) ctx.addIssue({ code: "custom", path: ["room"], message: "Enter your room number for delivery" });
});

export const staffOrderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  isPaid: z.boolean().optional(),
  cancelReason: optionalText(200),
});

export const settingsSchema = z.object({
  canteenOpen: z.boolean().optional(),
  // Must contain an opening and a closing time, e.g. "9:00 PM – 4:00 AM";
  // otherwise the hours can't be enforced.
  canteenHours: trimmed(60)
    .min(1)
    .refine((v) => parseHours(v) !== null, "Write the hours like 9:00 PM – 4:00 AM")
    .optional(),
});

// ----------------------------------------------------------------- admin

export const updateUserSchema = z.object({
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
});
