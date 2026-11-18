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
