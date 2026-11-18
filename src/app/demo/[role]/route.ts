import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_ROLES, demoOpenAccess, type DemoRole } from "@/lib/demo";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import type { Role } from "@/lib/constants";

// /demo/owner, /demo/canteen, /demo/mess, /demo/student: signs the visitor in
// as that team's seeded account (read-only) and opens its page. Only works
// while DEMO_OPEN_ACCESS=1; otherwise it is a 404.
export async function GET(req: Request, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const demo = DEMO_ROLES[role as DemoRole];
  if (!demoOpenAccess() || !demo) return new NextResponse("Not found", { status: 404 });

  const user =
    (demo.role === "USER" &&
      (await prisma.user.findFirst({ where: { role: "USER", active: true, email: { startsWith: "student@" } } }))) ||
    (await prisma.user.findFirst({ where: { role: demo.role, active: true }, orderBy: { createdAt: "asc" } }));
  if (!user) return new NextResponse(`No active ${role} account to show`, { status: 404 });

  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : demo.home;

  const token = await signSession({ sub: user.id, role: user.role as Role, name: user.name, demo: true });
  const res = NextResponse.redirect(new URL(next, url));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req));
  return res;
}
