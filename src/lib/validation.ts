import { z } from "zod";
import {
  INVENTORY_CATEGORY_IDS,
  INVENTORY_UNITS,
  MAX_ITEM_QUANTITY,
  MAX_ORDER_LINES,
  MOVEMENT_TYPES,
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
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email").max(200),
  password: z.string().min(1, "Enter your password").max(100),
});

// ------------------------------------------------------------- inventory

const qty = z.coerce.number().finite().min(0).max(1_000_000);

export const inventoryItemSchema = z.object({
  name: trimmed(80).min(2, "Name is too short"),
  category: z.enum(INVENTORY_CATEGORY_IDS),
  unit: z.enum(INVENTORY_UNITS),
  reorderLevel: qty,
  parLevel: qty,
  costPerUnit: qty.optional().nullable(),
  supplier: optionalText(80),
  shelfLifeDays: z.coerce.number().int().min(1).max(3650).optional().nullable(),
  notes: optionalText(500),
});

export const createInventoryItemSchema = inventoryItemSchema.extend({
  quantity: qty.default(0),
});

export const updateInventoryItemSchema = inventoryItemSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const movementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES),
  // For ADJUSTMENT this is the counted quantity; otherwise the amount moved.
  quantity: z.coerce.number().finite().min(0).max(1_000_000),
  unitCost: qty.optional().nullable(),
  note: optionalText(200),
});

export const stockCountSchema = z.object({
  entries: z
    .array(z.object({ itemId: z.string().min(1).max(40), counted: qty }))
    .min(1, "Enter at least one count")
    .max(500),
  note: optionalText(200),
});

export const deliverySchema = z.object({
  entries: z
    .array(
      z.object({
        itemId: z.string().min(1).max(40),
        quantity: z.coerce.number().finite().positive().max(1_000_000),
        unitCost: qty.optional().nullable(),
      }),
    )
    .min(1, "Select at least one item")
    .max(500),
  note: optionalText(200),
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
});

export const staffOrderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  isPaid: z.boolean().optional(),
  cancelReason: optionalText(200),
});

export const settingsSchema = z.object({
  canteenOpen: z.boolean().optional(),
  canteenHours: trimmed(60).min(1).optional(),
});

// ----------------------------------------------------------------- admin

export const updateUserSchema = z.object({
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
});
