import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { cookies } from "next/headers";
import { getCurrentUser, type CurrentUser } from "./auth";
import { SESSION_COOKIE, verifySession } from "./session";
import type { Role } from "./constants";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/**
 * Wraps a route handler with JSON error handling. Mutating requests must be
 * JSON, which (with SameSite=Lax cookies) blocks cross-site form posts.
 */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        const type = req.headers.get("content-type") ?? "";
        if (!type.includes("application/json")) throw new HttpError(415, "Requests must be JSON");
        // Presentation demo sessions can look at everything but change nothing
        // (signing out or in with a real account still works).
        if (!new URL(req.url).pathname.startsWith("/api/auth/")) {
          const claims = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
          if (claims?.demo) throw new HttpError(403, "Demo mode: changes are switched off. Log in with a real account to make changes.");
        }
      }
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        const field = issue?.path.join(".");
        return NextResponse.json(
          { error: issue ? `${field ? `${field}: ` : ""}${issue.message}` : "Invalid input" },
          { status: 400 },
        );
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in first");
  if (roles && !roles.includes(user.role)) throw new HttpError(403, "You don't have access to this");
  return user;
}

export { CANTEEN_ROLES, MESS_ROLES, STAFF_ROLES } from "./constants";

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
