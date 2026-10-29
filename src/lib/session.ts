// Session tokens (JWT in an httpOnly cookie). Edge-safe: used by middleware,
// so it must not import Prisma or bcrypt.

import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./constants";

export const SESSION_COOKIE = "mess_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionClaims {
  sub: string;
  role: Role;
  name: string;
}

const PLACEHOLDER_SECRET = "change-me-to-a-long-random-string";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16 || (secret === PLACEHOLDER_SECRET && process.env.NODE_ENV === "production")) {
    throw new Error("AUTH_SECRET is missing or too weak. Set a long random string in .env (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: SessionClaims) {
  return new SignJWT({ role: claims.role, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}

/** Cookie flags. `Secure` is set when the request came over HTTPS (directly or via a proxy). */
export function sessionCookieOptions(req: Request) {
  const https = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: https,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
