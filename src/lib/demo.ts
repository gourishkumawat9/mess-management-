// Presentation demo mode. While DEMO_OPEN_ACCESS is "1" on the server, staff and
// student pages open without the login form: a visitor with no session is
// signed in as a demo account (see src/app/demo/[role]/route.ts), and those
// demo sessions are read-only. Remove the env var (or set it to anything else)
// and redeploy to turn it off. Edge-safe: used by the middleware.

export function demoOpenAccess() {
  return process.env.DEMO_OPEN_ACCESS === "1";
}

export const DEMO_ROLES = {
  owner: { role: "ADMIN", home: "/staff" },
  canteen: { role: "CANTEEN", home: "/staff" },
  mess: { role: "MESS", home: "/staff" },
  student: { role: "USER", home: "/orders" },
} as const;

export type DemoRole = keyof typeof DEMO_ROLES;

// While the demo is open to anyone with the link, contact details of real
// accounts must not show. The seeded demo accounts keep their made-up details;
// every other account's email and phone are replaced before they reach a page.
const DEMO_CONTACTS: Record<string, string | null> = {
  "admin@iimsambalpur.ac.in": null,
  "staff@iimsambalpur.ac.in": "98765 43210",
  "canteen@iimsambalpur.ac.in": "98765 43211",
  "mess@iimsambalpur.ac.in": "98765 43212",
  "student@iimsambalpur.ac.in": "91234 56789",
  "aarav.s@iimsambalpur.ac.in": null,
  "priya.n@iimsambalpur.ac.in": null,
  "rohan.d@iimsambalpur.ac.in": null,
  "sneha.p@iimsambalpur.ac.in": null,
  "k.mishra@iimsambalpur.ac.in": null,
};

export function redactContact<T extends { email?: string; phone?: string | null }>(user: T): T {
  const email = user.email?.toLowerCase();
  if (email && email in DEMO_CONTACTS) return { ...user, phone: DEMO_CONTACTS[email] };
  return { ...user, ...(user.email !== undefined ? { email: "hidden in demo" } : {}), phone: null };
}
