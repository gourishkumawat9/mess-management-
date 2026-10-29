// Allowed values for the string "enum" columns in prisma/schema.prisma.

export const ROLES = ["USER", "STAFF", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Student / Member",
  STAFF: "Mess staff",
  ADMIN: "Admin",
};

export const INVENTORY_CATEGORIES = [
  { id: "VEGETABLES", label: "Vegetables", emoji: "🥬" },
  { id: "FRUITS", label: "Fruits", emoji: "🍌" },
  { id: "DAIRY", label: "Dairy & Eggs", emoji: "🥛" },
  { id: "FROZEN", label: "Frozen & Ice Cream", emoji: "🍨" },
  { id: "GRAINS", label: "Grains & Pulses", emoji: "🌾" },
  { id: "SPICES", label: "Spices & Masala", emoji: "🌶️" },
  { id: "OILS", label: "Oils & Ghee", emoji: "🫙" },
  { id: "BEVERAGES", label: "Tea, Coffee & Drinks", emoji: "☕" },
  { id: "BAKERY", label: "Bread & Bakery", emoji: "🍞" },
  { id: "SUPPLIES", label: "Gas & Supplies", emoji: "🧯" },
  { id: "OTHER", label: "Other", emoji: "📦" },
] as const;
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]["id"];
export const INVENTORY_CATEGORY_IDS = INVENTORY_CATEGORIES.map((c) => c.id) as [
  InventoryCategory,
  ...InventoryCategory[],
];

export function inventoryCategory(id: string) {
  return INVENTORY_CATEGORIES.find((c) => c.id === id) ?? INVENTORY_CATEGORIES[INVENTORY_CATEGORIES.length - 1];
}

export const INVENTORY_UNITS = [
  "kg",
  "g",
  "L",
  "ml",
  "pcs",
  "dozen",
  "packets",
  "tubs",
  "boxes",
  "crates",
  "cylinders",
] as const;

export const MOVEMENT_TYPES = ["RESTOCK", "USAGE", "WASTAGE", "ADJUSTMENT"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  RESTOCK: "Restocked",
  USAGE: "Used",
  WASTAGE: "Wasted / spoiled",
  ADJUSTMENT: "Count corrected",
};

export const ORDER_STATUSES = ["PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["CASH", "UPI"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SETTINGS = {
  canteenOpen: "canteen_open",
  canteenHours: "canteen_hours",
} as const;

export const DEFAULT_CANTEEN_HOURS = "8:00 AM – 11:30 PM";

// Ordering guard rails.
export const MAX_ITEM_QUANTITY = 20;
export const MAX_ORDER_LINES = 30;
export const MAX_ACTIVE_ORDERS_PER_USER = 3;
