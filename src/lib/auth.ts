import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { STAFF_ROLES, hasRole, type Role } from "./constants";
import { SESSION_COOKIE, verifySession } from "./session";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hostel: string | null;
  room: string | null;
  role: Role;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * The signed-in user, re-read from the database on every request so a role
 * change or deactivation takes effect immediately rather than at token expiry.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const claims = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, name: true, email: true, phone: true, hostel: true, room: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    hostel: user.hostel,
    room: user.room,
    role: user.role as Role,
  };
}

export function isStaff(user: Pick<CurrentUser, "role"> | null) {
  return hasRole(user?.role, STAFF_ROLES);
}

/** For server components and pages: send unauthorised visitors to login. */
export async function requirePageUser(roles?: Role[], next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  // Staff opening another team's page land on their own dashboard instead.
  if (roles && !roles.includes(user.role)) redirect(isStaff(user) ? "/staff" : "/");
  return user;
}

export function allowedEmailDomains() {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}
