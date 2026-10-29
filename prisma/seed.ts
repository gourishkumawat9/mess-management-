/**
 * Demo data: accounts, a placeholder canteen menu, mess inventory with two
 * weeks of stock history, and a few canteen orders.
 *
 *   npm run db:seed    seeds an empty database (refuses if data exists)
 *   npm run db:reset   wipes the database and seeds it again
 *
 * Replace the placeholder menu from the staff "Canteen menu" screen (or edit
 * MENU below and reset) once the real menu is ready.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { startOfDayIST } from "../src/lib/orders";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Deterministic randomness so every reset gives the same demo data.
let seed = 20261029;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min: number, max: number) => min + rand() * (max - min);
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

// ------------------------------------------------------------------ accounts

const DOMAIN = "iimsambalpur.ac.in";
const ACCOUNTS = [
  { name: "Mess Admin", email: `admin@${DOMAIN}`, role: "ADMIN", password: process.env.SEED_ADMIN_PASSWORD || "Admin@123" },
  { name: "Ramesh Kumar", email: `staff@${DOMAIN}`, role: "STAFF", password: process.env.SEED_STAFF_PASSWORD || "Staff@123", phone: "98765 43210" },
  { name: "Demo Student", email: `student@${DOMAIN}`, role: "USER", password: process.env.SEED_STUDENT_PASSWORD || "Student@123", phone: "91234 56789" },
  // Extra members so the order board looks lived-in. They share the student password.
  { name: "Aarav Sharma", email: `aarav.s@${DOMAIN}`, role: "USER", password: process.env.SEED_STUDENT_PASSWORD || "Student@123" },
  { name: "Priya Nair", email: `priya.n@${DOMAIN}`, role: "USER", password: process.env.SEED_STUDENT_PASSWORD || "Student@123" },
  { name: "Rohan Das", email: `rohan.d@${DOMAIN}`, role: "USER", password: process.env.SEED_STUDENT_PASSWORD || "Student@123" },
  { name: "Sneha Patel", email: `sneha.p@${DOMAIN}`, role: "USER", password: process.env.SEED_STUDENT_PASSWORD || "Student@123" },
  { name: "Prof. K. Mishra", email: `k.mishra@${DOMAIN}`, role: "USER", password: process.env.SEED_STUDENT_PASSWORD || "Student@123" },
];

// ---------------------------------------------------------------------- menu
// Placeholder menu: prices in whole rupees. [name, price, isVeg, emoji, description, bestseller?, available?]
type Dish = [string, number, boolean, string, string, boolean?, boolean?];
const MENU: Record<string, Dish[]> = {
  "Tea & Coffee": [
    ["Masala Chai", 15, true, "☕", "Kadak chai with ginger and elaichi", true],
    ["Filter Coffee", 20, true, "☕", "South Indian style, strong and frothy"],
    ["Hot Chocolate", 40, true, "🍫", "Rich cocoa with hot milk"],
    ["Green Tea", 20, true, "🍵", "Light and refreshing"],
  ],
  "Shakes & Coolers": [
    ["Cold Coffee", 50, true, "🧋", "Thick, chilled and lightly sweet", true],
    ["Fresh Lime Soda", 35, true, "🍋", "Sweet, salted or mixed"],
    ["Mango Shake", 60, true, "🥭", "Made with Alphonso pulp"],
    ["Sweet Lassi", 40, true, "🥛", "Thick curd lassi, served chilled"],
    ["Oreo Shake", 70, true, "🥤", "Blended with vanilla ice cream"],
  ],
  Snacks: [
    ["Samosa (2 pcs)", 25, true, "🥟", "Crispy, with green and tamarind chutney", true],
    ["Veg Puff", 25, true, "🥐", "Flaky pastry with spiced veggies"],
    ["Egg Puff", 30, false, "🥐", "Flaky pastry with masala egg"],
    ["French Fries", 60, true, "🍟", "Salted, crisp and golden"],
    ["Peri Peri Fries", 70, true, "🍟", "Tossed in spicy peri peri"],
    ["Paneer Pakoda", 60, true, "🧀", "Gram flour fritters with mint chutney"],
  ],
  "Maggi & Noodles": [
    ["Plain Maggi", 35, true, "🍜", "The hostel classic"],
    ["Masala Veg Maggi", 45, true, "🍜", "Loaded with onion, tomato and peas"],
    ["Cheese Maggi", 55, true, "🧀", "Extra cheesy, extra comforting", true],
    ["Egg Maggi", 55, false, "🍳", "With scrambled egg"],
    ["Veg Hakka Noodles", 80, true, "🥢", "Wok-tossed with crunchy veggies"],
    ["Chicken Hakka Noodles", 100, false, "🥢", "Wok-tossed with shredded chicken"],
  ],
  "Momos, Rolls & Sandwiches": [
    ["Veg Momos (6 pcs)", 60, true, "🥟", "Steamed, with spicy red chutney", true],
    ["Chicken Momos (6 pcs)", 80, false, "🥟", "Steamed, with spicy red chutney"],
    ["Veg Grilled Sandwich", 50, true, "🥪", "Toasted with veggies and mint mayo"],
    ["Cheese Corn Sandwich", 60, true, "🥪", "Sweet corn, cheese and herbs"],
    ["Paneer Tikka Roll", 80, true, "🌯", "Smoky paneer tikka in a rumali wrap", true],
    ["Egg Roll", 50, false, "🌯", "Kolkata style, double egg"],
    ["Chicken Roll", 90, false, "🌯", "Tandoori chicken with onions and sauce", true],
  ],
  Meals: [
    ["Veg Fried Rice", 80, true, "🍚", "Indo-Chinese style"],
    ["Egg Fried Rice", 90, false, "🍚", "With scrambled egg and spring onion"],
    ["Chole Bhature", 70, true, "🫓", "Two bhature with spicy chole"],
    ["Pav Bhaji", 70, true, "🍛", "Buttery bhaji with two pav"],
  ],
  "Desserts & Ice Cream": [
    ["Vanilla Ice Cream Cup", 30, true, "🍨", "Classic vanilla"],
    ["Chocolate Ice Cream Cup", 35, true, "🍫", "Double chocolate"],
    ["Butterscotch Ice Cream Cup", 35, true, "🍦", "Crunchy butterscotch", false, false],
    ["Chocolate Brownie", 60, true, "🍰", "Warm, fudgy brownie"],
    ["Gulab Jamun (2 pcs)", 30, true, "🍡", "Soft and syrupy"],
  ],
};

// ----------------------------------------------------------------- inventory
// [name, category, unit, target stock now, reorder level, full stock, ₹/unit, uses per day, restock every N days, shelf life days?, supplier]
type Stock = [string, string, string, number, number, number, number, number, number, number | null, string];
const VEG = "Sambalpur Sabzi Mandi";
const DAIRY = "Local dairy (placeholder)";
const WHOLESALE = "Agro wholesale (placeholder)";
const FROZEN = "Ice cream distributor (placeholder)";
const INVENTORY: Stock[] = [
  ["Potato", "VEGETABLES", "kg", 140, 60, 250, 25, 28, 4, null, VEG],
  ["Onion", "VEGETABLES", "kg", 95, 50, 200, 32, 22, 4, null, VEG],
  ["Tomato", "VEGETABLES", "kg", 18, 25, 80, 30, 14, 3, 6, VEG],
  ["Green Chilli", "VEGETABLES", "kg", 5, 2, 8, 60, 1.2, 3, 5, VEG],
  ["Ginger", "VEGETABLES", "kg", 6, 2, 10, 120, 0.8, 5, null, VEG],
  ["Garlic", "VEGETABLES", "kg", 7, 2, 10, 140, 0.7, 5, null, VEG],
  ["Cauliflower", "VEGETABLES", "kg", 22, 10, 40, 35, 8, 3, 4, VEG],
  ["Cabbage", "VEGETABLES", "kg", 30, 10, 40, 22, 6, 4, 6, VEG],
  ["Bhindi (Lady Finger)", "VEGETABLES", "kg", 13, 8, 30, 45, 6, 3, 3, VEG],
  ["Palak (Spinach)", "VEGETABLES", "kg", 7, 5, 20, 30, 4, 2, 2, VEG],
  ["Coriander Leaves", "VEGETABLES", "kg", 2.5, 1, 4, 80, 0.8, 2, 3, VEG],
  ["Carrot", "VEGETABLES", "kg", 24, 8, 30, 40, 3.5, 5, 10, VEG],
  ["Capsicum", "VEGETABLES", "kg", 12, 4, 15, 60, 2, 4, 6, VEG],
  ["Banana", "FRUITS", "dozen", 30, 15, 60, 50, 12, 3, 4, VEG],
  ["Lemon", "FRUITS", "kg", 4, 2, 6, 80, 0.6, 5, 10, VEG],
  ["Milk", "DAIRY", "L", 150, 120, 350, 54, 160, 1, 2, DAIRY],
  ["Curd", "DAIRY", "kg", 45, 30, 90, 70, 38, 2, 2, DAIRY],
  ["Paneer", "DAIRY", "kg", 14, 10, 30, 340, 5, 3, 3, DAIRY],
  ["Butter", "DAIRY", "kg", 6, 3, 10, 520, 0.6, 7, 30, DAIRY],
  ["Eggs", "DAIRY", "dozen", 35, 20, 60, 72, 9, 4, 14, DAIRY],
  ["Cheese Slices", "DAIRY", "packets", 9, 6, 20, 140, 1.5, 5, 30, DAIRY],
  ["Vanilla Ice Cream Cups", "FROZEN", "pcs", 140, 60, 250, 20, 30, 5, 180, FROZEN],
  ["Chocolate Ice Cream Cups", "FROZEN", "pcs", 85, 60, 200, 22, 24, 5, 180, FROZEN],
  ["Butterscotch Ice Cream Cups", "FROZEN", "pcs", 0, 40, 150, 22, 16, 6, 180, FROZEN],
  ["Kulfi", "FROZEN", "pcs", 40, 25, 100, 25, 8, 7, 180, FROZEN],
  ["Ice Cream Family Tubs (4 L)", "FROZEN", "tubs", 5, 3, 10, 650, 0.8, 7, 180, FROZEN],
  ["Frozen Green Peas", "FROZEN", "kg", 16, 8, 30, 120, 2, 7, 180, FROZEN],
  ["Basmati Rice", "GRAINS", "kg", 220, 100, 400, 95, 18, 10, null, WHOLESALE],
  ["Sona Masoori Rice", "GRAINS", "kg", 480, 200, 800, 52, 55, 7, null, WHOLESALE],
  ["Wheat Atta", "GRAINS", "kg", 320, 150, 600, 38, 45, 7, null, WHOLESALE],
  ["Toor Dal", "GRAINS", "kg", 70, 40, 150, 135, 9, 10, null, WHOLESALE],
  ["Moong Dal", "GRAINS", "kg", 38, 20, 60, 120, 4, 10, null, WHOLESALE],
  ["Kabuli Chana", "GRAINS", "kg", 22, 15, 40, 110, 3, 10, null, WHOLESALE],
  ["Rajma", "GRAINS", "kg", 12, 15, 40, 140, 2.5, 12, null, WHOLESALE],
  ["Poha", "GRAINS", "kg", 18, 10, 30, 55, 3, 10, null, WHOLESALE],
  ["Suji (Rava)", "GRAINS", "kg", 14, 8, 25, 45, 2, 10, null, WHOLESALE],
  ["Besan", "GRAINS", "kg", 15, 10, 30, 90, 2.5, 10, null, WHOLESALE],
  ["Sugar", "GRAINS", "kg", 65, 40, 120, 44, 8, 10, null, WHOLESALE],
  ["Maggi Noodles", "GRAINS", "packets", 160, 100, 400, 14, 45, 7, 240, WHOLESALE],
  ["Salt", "SPICES", "kg", 38, 15, 50, 22, 2.5, 14, null, WHOLESALE],
  ["Turmeric Powder", "SPICES", "kg", 4.5, 2, 6, 240, 0.3, 14, null, WHOLESALE],
  ["Red Chilli Powder", "SPICES", "kg", 5, 2, 6, 320, 0.35, 14, null, WHOLESALE],
  ["Garam Masala", "SPICES", "kg", 1.8, 1.5, 4, 600, 0.2, 14, null, WHOLESALE],
  ["Jeera (Cumin)", "SPICES", "kg", 3, 1, 5, 450, 0.2, 14, null, WHOLESALE],
  ["Mustard Seeds", "SPICES", "kg", 2.5, 1, 4, 140, 0.15, 14, null, WHOLESALE],
  ["Refined Sunflower Oil", "OILS", "L", 110, 60, 200, 145, 14, 7, null, WHOLESALE],
  ["Mustard Oil", "OILS", "L", 32, 20, 60, 175, 3, 10, null, WHOLESALE],
  ["Desi Ghee", "OILS", "kg", 9, 5, 15, 620, 0.9, 10, null, DAIRY],
  ["Tea Leaves", "BEVERAGES", "kg", 9, 4, 15, 420, 1.1, 7, null, WHOLESALE],
  ["Coffee Powder", "BEVERAGES", "kg", 1.2, 1.5, 5, 900, 0.35, 10, null, WHOLESALE],
  ["Bread Loaves", "BAKERY", "pcs", 30, 20, 60, 45, 18, 2, 3, "Local bakery (placeholder)"],
  ["Pav Buns", "BAKERY", "packets", 14, 10, 30, 30, 6, 2, 3, "Local bakery (placeholder)"],
  ["LPG Cylinders (Commercial)", "SUPPLIES", "cylinders", 6, 4, 12, 1850, 1.2, 5, null, "Gas agency (placeholder)"],
  ["Dishwash Liquid", "SUPPLIES", "L", 14, 8, 25, 110, 1.6, 10, null, WHOLESALE],
];

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("The database already has data, so nothing was seeded.");
    console.log("Run `npm run db:reset` to wipe it and load the demo data again.");
    return;
  }

  const now = new Date();
  const today = startOfDayIST(now);

  // Accounts
  const users: Record<string, { id: string; name: string }> = {};
  for (const a of ACCOUNTS) {
    const u = await prisma.user.create({
      data: {
        name: a.name,
        email: a.email,
        role: a.role,
        phone: "phone" in a ? a.phone : null,
        passwordHash: await bcrypt.hash(a.password, 10),
        createdAt: new Date(today.getTime() - 20 * DAY),
      },
    });
    users[a.email] = u;
  }
  const staffId = users[`staff@${DOMAIN}`].id;

  // Settings
  await prisma.setting.createMany({
    data: [
      { key: "canteen_open", value: "true" },
      { key: "canteen_hours", value: "8:00 AM – 11:30 PM" },
    ],
  });

  // Menu
  const dishes: { id: string; name: string; price: number; isVeg: boolean; isAvailable: boolean }[] = [];
  let catOrder = 0;
  for (const [category, items] of Object.entries(MENU)) {
    const cat = await prisma.menuCategory.create({ data: { name: category, sortOrder: ++catOrder } });
    let itemOrder = 0;
    for (const [name, price, isVeg, emoji, description, bestseller = false, available = true] of items) {
      dishes.push(
        await prisma.menuItem.create({
          data: { categoryId: cat.id, name, price, isVeg, emoji, description, isBestseller: bestseller, isAvailable: available, sortOrder: ++itemOrder },
        }),
      );
    }
  }

  // Inventory with 14 days of history
  const HISTORY_DAYS = 14;
  for (const [name, category, unit, target, reorderLevel, parLevel, cost, daily, every, shelfLife, supplier] of INVENTORY) {
    // Things you count (cups, cylinders, packets) move in whole numbers.
    const dp = ["kg", "g", "L", "ml"].includes(unit) ? 2 : 0;
    const usages: number[] = [];
    const restocks: number[] = [];
    for (let d = HISTORY_DAYS; d >= 1; d--) {
      usages.push(Math.max(dp ? 0.01 : 1, round(daily * between(0.8, 1.2), dp)));
      restocks.push((HISTORY_DAYS - d) % every === 0 ? round(daily * every * between(0.95, 1.1), dp ? 1 : 0) : 0);
    }
    // Pick the opening stock so the history adds up to today's target. If the
    // deliveries alone overshoot it, trim the latest delivery instead.
    let net = restocks.reduce((s, r) => s + r, 0) - usages.reduce((s, u) => s + u, 0);
    if (net > target) {
      const last = restocks.findLastIndex((r) => r > 0);
      const trimmed = Math.max(round(restocks[last] * 0.3, dp ? 1 : 0), round(restocks[last] - (net - target), dp ? 1 : 0));
      net -= restocks[last] - trimmed;
      restocks[last] = trimmed;
    }
    let opening = Math.max(0, round(target - net));
    let lowest = 0;
    let running = 0;
    for (let i = 0; i < HISTORY_DAYS; i++) {
      running += restocks[i] - usages[i];
      lowest = Math.min(lowest, running);
    }
    if (opening + lowest < 0) opening = round(-lowest);

    const createdAt = new Date(today.getTime() - (HISTORY_DAYS + 1) * DAY);
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        unit,
        quantity: 0,
        reorderLevel,
        parLevel,
        costPerUnit: cost,
        supplier,
        shelfLifeDays: shelfLife,
        createdAt,
      },
    });

    const movements: { type: string; change: number; balanceAfter: number; unitCost?: number; note: string; createdAt: Date }[] = [];
    let balance = opening;
    let lastRestockedAt: Date | null = null;
    if (opening > 0) {
      movements.push({ type: "ADJUSTMENT", change: opening, balanceAfter: opening, note: "Opening stock", createdAt: new Date(createdAt.getTime() + 10 * HOUR) });
      lastRestockedAt = new Date(createdAt.getTime() + 10 * HOUR);
    }
    for (let i = 0; i < HISTORY_DAYS; i++) {
      const dayStart = new Date(today.getTime() - (HISTORY_DAYS - i) * DAY);
      if (restocks[i] > 0) {
        balance = round(balance + restocks[i], 3);
        const at = new Date(dayStart.getTime() + 7.5 * HOUR);
        movements.push({ type: "RESTOCK", change: restocks[i], balanceAfter: balance, unitCost: cost, note: `Delivery from ${supplier}`, createdAt: at });
        lastRestockedAt = at;
      }
      let used = Math.min(usages[i], balance);
      if (target === 0 && i === HISTORY_DAYS - 1) used = balance; // finish it off: shows as out of stock
      if (used > 0) {
        balance = round(balance - used, 3);
        movements.push({ type: "USAGE", change: -round(used, 3), balanceAfter: balance, note: "Daily stock count", createdAt: new Date(dayStart.getTime() + 21.5 * HOUR) });
      }
      if (i === 9 && shelfLife && shelfLife <= 3 && balance > daily) {
        const spoiled = Math.max(dp ? 0.1 : 1, round(daily * 0.15, dp));
        balance = round(balance - spoiled, 3);
        movements.push({ type: "WASTAGE", change: -spoiled, balanceAfter: balance, note: "Spoiled", createdAt: new Date(dayStart.getTime() + 22 * HOUR) });
      }
    }
    await prisma.stockMovement.createMany({ data: movements.map((m) => ({ ...m, itemId: item.id, userId: staffId })) });
    await prisma.inventoryItem.update({ where: { id: item.id }, data: { quantity: balance, lastRestockedAt } });
  }

  // Canteen orders: three past days plus today
  const members = Object.values(users).filter((_, i) => ACCOUNTS[i].role === "USER");
  const sellable = dishes.filter((d) => d.isAvailable);
  type Plan = { at: Date; status: string; user: { id: string }; note?: string };
  const plans: Plan[] = [];
  for (let d = 3; d >= 1; d--) {
    const dayStart = today.getTime() - d * DAY;
    const count = 9 + Math.floor(rand() * 6);
    for (let i = 0; i < count; i++) {
      plans.push({
        at: new Date(dayStart + between(9, 23) * HOUR),
        status: rand() < 0.07 ? "CANCELLED" : "COMPLETED",
        user: pick(members),
      });
    }
  }
  const student = users[`student@${DOMAIN}`];
  const todayPlan: [number, string, { id: string }, string?][] = [
    [95, "COMPLETED", pick(members)],
    [88, "COMPLETED", pick(members)],
    [80, "COMPLETED", student],
    [71, "CANCELLED", pick(members)],
    [64, "COMPLETED", pick(members)],
    [55, "COMPLETED", pick(members)],
    [41, "COMPLETED", pick(members)],
    [26, "READY", student],
    [18, "PREPARING", users[`priya.n@${DOMAIN}`], "Less spicy please"],
    [14, "PREPARING", users[`aarav.s@${DOMAIN}`]],
    [7, "PLACED", users[`rohan.d@${DOMAIN}`], "Extra cheese"],
    [3, "PLACED", users[`k.mishra@${DOMAIN}`]],
  ];
  for (const [minsAgo, status, user, note] of todayPlan) {
    plans.push({ at: new Date(Math.max(now.getTime() - minsAgo * 60 * 1000, today.getTime() + 60 * 1000)), status, user, note });
  }
  plans.sort((a, b) => a.at.getTime() - b.at.getTime());

  const tokens = new Map<number, number>();
  for (const p of plans) {
    const day = startOfDayIST(p.at).getTime();
    const token = (tokens.get(day) ?? 0) + 1;
    tokens.set(day, token);

    const lineCount = 1 + Math.floor(rand() * 3);
    const lines = new Map<string, { menuItemId: string; name: string; price: number; isVeg: boolean; quantity: number }>();
    for (let i = 0; i < lineCount; i++) {
      const dish = pick(sellable);
      const line = lines.get(dish.id) ?? { menuItemId: dish.id, name: dish.name, price: dish.price, isVeg: dish.isVeg, quantity: 0 };
      line.quantity += rand() < 0.75 ? 1 : 2;
      lines.set(dish.id, line);
    }
    const items = [...lines.values()];
    const total = items.reduce((s, l) => s + l.price * l.quantity, 0);
    const t = p.at.getTime();
    const later = (mins: number) => new Date(Math.min(t + mins * 60 * 1000, now.getTime()));
    const stage = ["PLACED", "PREPARING", "READY", "COMPLETED"].indexOf(p.status); // -1 when cancelled

    await prisma.order.create({
      data: {
        token,
        userId: p.user.id,
        status: p.status,
        total,
        paymentMethod: rand() < 0.7 ? "UPI" : "CASH",
        isPaid: p.status === "COMPLETED",
        note: p.note ?? null,
        createdAt: p.at,
        updatedAt: stage === 3 ? later(18) : stage === -1 ? later(3) : p.at,
        preparingAt: stage >= 1 ? later(2) : null,
        readyAt: stage >= 2 ? later(12) : null,
        completedAt: stage === 3 ? later(18) : null,
        cancelledAt: p.status === "CANCELLED" ? later(3) : null,
        cancelReason: p.status === "CANCELLED" ? "Item ran out" : null,
        items: { create: items },
      },
    });
  }

  console.log("Seeded demo data:");
  console.log(`  ${ACCOUNTS.length} accounts, ${dishes.length} menu items, ${INVENTORY.length} inventory items, ${plans.length} orders`);
  console.log("\nDemo logins:");
  for (const a of ACCOUNTS.slice(0, 3)) console.log(`  ${a.role.padEnd(5)}  ${a.email}  /  ${a.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
