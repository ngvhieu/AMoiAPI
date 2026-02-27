import { createMiddleware } from "hono/factory";
import { verifyJWT } from "../lib/jwt";
import type { Env, JWTPayload } from "../lib/types";

type Variables = { user: JWTPayload };

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const auth = c.req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const payload = await verifyJWT(auth.slice(7), c.env.JWT_SECRET);
      c.set("user", payload);
      await next();
    } catch {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  },
);

export const optionalAuth = createMiddleware<{ Bindings: Env; Variables: Partial<Variables> }>(
  async (c, next) => {
    const auth = c.req.header("Authorization");
    if (auth?.startsWith("Bearer ")) {
      try {
        const payload = await verifyJWT(auth.slice(7), c.env.JWT_SECRET);
        c.set("user", payload);
      } catch { /* ignore */ }
    }
    await next();
  },
);
