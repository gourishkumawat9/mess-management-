import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { HttpError, json, readJson, route } from "@/lib/api";
import { allowedEmailDomains, hashPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { registerSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    throw new HttpError(429, "Too many sign-ups from this network. Please try again later.");
  }
  const input = await readJson(req, registerSchema);

  const domains = allowedEmailDomains();
  const domain = input.email.split("@")[1] ?? "";
  if (domains.length > 0 && !domains.includes(domain)) {
    throw new HttpError(400, `Please use your institute email (${domains.map((d) => `@${d}`).join(", ")})`);
  }
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw new HttpError(409, "An account with this email already exists. Try logging in.");
  }

  // Everyone signs up as a regular member; an admin can promote staff later.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: "USER",
    },
  });
  const token = await signSession({ sub: user.id, role: "USER", name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(req));
  return json({ user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
});
