/**
 * Starting data: an admin account and the canteen menu. Unless
 * SEED_DEMO_DATA=false it also adds demo accounts and some canteen orders.
 *
 *   npm run db:seed    seeds an empty database (does nothing if data exists)
 *   npm run db:reset   wipes the database and seeds it again
 *
 * On a live deployment (NODE_ENV=production or on Vercel) the admin password
 * must come from SEED_ADMIN_PASSWORD; the built-in demo passwords are never used.
 *
 * Replace the placeholder menu from the staff "Canteen menu" screen (or edit
 * MENU below and reset) once the real menu is ready.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { istDateKey, startOfDayIST } from "../src/lib/orders";

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
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

// ------------------------------------------------------------------ accounts

const DOMAIN = "iimsambalpur.ac.in";
const LIVE = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
const DEMO = process.env.SEED_DEMO_DATA !== "false";

/**
 * Password for a seeded account. Locally the documented demo password is the
 * fallback. On a live site only a password set in the environment is used;
 * otherwise the account gets a random one nobody knows (null for the admin,
 * which stops the seed).
 */
function seedPassword(envName: string, demo: string, required = false): { value: string; known: boolean } | null {
  const set = process.env[envName];
  if (set && set.length >= 8 && !(LIVE && set === demo)) return { value: set, known: true };
  if (!LIVE) return { value: demo, known: true };
  if (required) return null;
  return { value: randomBytes(24).toString("base64url"), known: false };
}

type Account = {
  name: string;
  email: string;
  role: string;
  password: string;
  known: boolean;
  phone?: string;
  hostel?: string;
  room?: string;
};
function accounts(): Account[] | null {
  const admin = seedPassword("SEED_ADMIN_PASSWORD", "Admin@123", true);
  if (!admin) return null;
  const list: Account[] = [
    {
      name: "Mess Admin",
      email: (process.env.SEED_ADMIN_EMAIL || `admin@${DOMAIN}`).trim().toLowerCase(),
      role: "ADMIN",
      password: admin.value,
      known: admin.known,
    },
  ];
  if (!DEMO) return list;
  const staff = seedPassword("SEED_STAFF_PASSWORD", "Staff@123")!;
  const student = seedPassword("SEED_STUDENT_PASSWORD", "Student@123")!;
  const member = (name: string, email: string, hostel?: string, room?: string) => ({
    name,
    email,
    role: "USER",
    password: student.value,
    known: student.known,
    hostel,
    room,
  });
  const worker = (name: string, email: string, role: string, phone: string) => ({ name, email, role, password: staff.value, known: staff.known, phone });
  return [
    ...list,
    worker("Sunita Behera", `canteen@${DOMAIN}`, "CANTEEN", "98765 43211"),
    { ...member("Demo Student", `student@${DOMAIN}`, "H3", "214"), phone: "91234 56789" },
    // Extra members so the order board looks lived-in. They share the student password.
    member("Aarav Sharma", `aarav.s@${DOMAIN}`, "H1", "108"),
    member("Priya Nair", `priya.n@${DOMAIN}`, "H2", "305"),
    member("Rohan Das", `rohan.d@${DOMAIN}`, "H1", "221"),
    member("Sneha Patel", `sneha.p@${DOMAIN}`, "H2", "117"),
    member("Prof. K. Mishra", `k.mishra@${DOMAIN}`),
  ];
}

// ---------------------------------------------------------------------- menu
// Night Canteen menu (from the printed menu board): prices in whole rupees.
// [name, price, isVeg, emoji, description, bestseller?, available?]
// Bestseller flags are a guess until the canteen confirms its popular items.
type Dish = [string, number, boolean, string, string, boolean?, boolean?];
const MENU: Record<string, Dish[]> = {
  "Maggi Mania": [
    ["Plain Maggi", 55, true, "🍜", ""],
    ["Veg Maggi", 65, true, "🍜", ""],
    ["Egg Maggi", 70, false, "🍳", ""],
    ["Veg Cheese Maggi", 80, true, "🧀", "", true],
    ["Egg Cheese Maggi", 90, false, "🧀", ""],
    ["Chicken Maggi", 110, false, "🍗", ""],
  ],
  Manchurian: [
    ["Manchurian", 80, true, "🥘", ""],
    ["Egg Manchurian", 100, false, "🥘", ""],
    ["Chicken Manchurian", 120, false, "🍗", "", true],
  ],
  Noodles: [
    ["Veg Noodles", 80, true, "🥢", "", true],
    ["Paneer Noodles", 120, true, "🥢", ""],
    ["Egg Noodles", 100, false, "🥢", ""],
    ["Chicken Noodles", 130, false, "🥢", ""],
  ],
  "Egg Items": [
    ["Egg Omelette", 40, false, "🍳", ""],
    ["Bread Egg Omelette", 50, false, "🍞", ""],
  ],
  "Wraps & Rolls": [
    ["Veg Roll", 70, true, "🌯", ""],
    ["Paneer Roll", 90, true, "🌯", "", true],
    ["Egg Roll", 90, false, "🌯", ""],
    ["Chicken Roll", 110, false, "🌯", ""],
    ["Chicken Egg Roll", 130, false, "🌯", "", true],
  ],
};

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("The database already has data, so nothing was seeded.");
    if (!LIVE) console.log("Run `npm run db:reset` to wipe it and load the demo data again.");
    return;
  }
  const ACCOUNTS = accounts();
  if (!ACCOUNTS) {
    console.log("Not seeding: set SEED_ADMIN_PASSWORD (8+ characters, not the demo one) so the live site gets a safe admin login.");
    return;
  }

  const now = new Date();
  const today = startOfDayIST(now);

  // Accounts
  const users: Record<string, { id: string; name: string; hostel: string | null; room: string | null }> = {};
  for (const a of ACCOUNTS) {
    const u = await prisma.user.create({
      data: {
        name: a.name,
        email: a.email,
        role: a.role,
        phone: a.phone ?? null,
        hostel: a.hostel ?? null,
        room: a.room ?? null,
        passwordHash: await bcrypt.hash(a.password, 10),
        createdAt: new Date(today.getTime() - 20 * DAY),
      },
    });
    users[a.email] = u;
  }

  // Settings
  await prisma.setting.createMany({
    data: [
      { key: "canteen_open", value: "true" },
      { key: "canteen_hours", value: "9:00 PM – 4:00 AM" },
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

  if (!DEMO) {
    report(ACCOUNTS, dishes.length, 0);
    return;
  }

  // Canteen orders: three past days plus today
  const members = Object.values(users).filter((_, i) => ACCOUNTS[i].role === "USER");
  const sellable = dishes.filter((d) => d.isAvailable);
  type Plan = { at: Date; status: string; user: { id: string; hostel: string | null; room: string | null }; note?: string };
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
  const todayPlan: [number, string, Plan["user"], string?][] = [
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
    const delivery = !!p.user.hostel && rand() < 0.5;

    await prisma.order.create({
      data: {
        token,
        userId: p.user.id,
        status: p.status,
        total,
        paymentMethod: "COUNTER",
        isPaid: p.status === "COMPLETED",
        note: p.note ?? null,
        fulfilment: delivery ? "DELIVERY" : "PICKUP",
        deliveryHostel: delivery ? p.user.hostel : null,
        deliveryRoom: delivery ? p.user.room : null,
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

  // Continue each day's token numbering from the seeded orders.
  await prisma.dailyCounter.createMany({
    data: [...tokens.entries()].map(([dayStart, value]) => ({ day: istDateKey(new Date(dayStart)), value })),
  });

  report(ACCOUNTS, dishes.length, plans.length);
}

function report(list: Account[], dishCount: number, orderCount: number) {
  console.log(DEMO ? "Seeded demo data:" : "Seeded starting data (no demo data):");
  console.log(`  ${list.length} accounts, ${dishCount} menu items, ${orderCount} orders`);
  console.log("\nLogins:");
  for (const a of list.slice(0, 3)) {
    // Never print passwords on a live deployment (build logs are shared).
    const shown = a.known ? (LIVE ? "(password from your environment settings)" : a.password) : "(random password; not for login)";
    console.log(`  ${a.role.padEnd(7)}  ${a.email}  /  ${shown}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
