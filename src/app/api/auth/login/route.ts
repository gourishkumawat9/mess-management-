import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { HttpError, json, readJson, route } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import type { Role } from "@/lib/constants";

export const POST = route(async (req) => {
  const { email, password } = await readJson(req, loginSchema);
  if (!rateLimit(`login:${clientIp(req)}:${email}`, 8, 10 * 60 * 1000)) {
    throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Wrong email or password");
  }
  if (!user.active) throw new HttpError(403, "This account has been deactivated. Please contact the mess office.");

  const token = await signSession({ sub: user.id, role: user.role as Role, name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(req));
  return json({ user: { id: user.id, name: user.name, role: user.role } });
});
