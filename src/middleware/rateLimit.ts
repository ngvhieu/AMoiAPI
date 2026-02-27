import { createMiddleware } from "hono/factory";
import type { Env } from "../lib/types";
import { kv } from "../lib/kv";

interface RateLimitOptions {
  limit: number;
  window: number; // seconds
  keyFn?: (c: any) => string;
}

export function rateLimit({ limit, window: ttl, keyFn }: RateLimitOptions) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
    const key = `rl:${keyFn ? keyFn(c) : ip}`;
    const store = kv(c.env.hiu_kv);

    const current = await store.get<number>(key) ?? 0;
    if (current >= limit) {
      return c.json({ error: "Too many requests. Please try again later." }, 429);
    }

    await store.set(key, current + 1, ttl);
    await next();
  });
}

// Presets
export const authRateLimit = rateLimit({ limit: 10, window: 60 });    // 10 req/min for auth
export const uploadRateLimit = rateLimit({ limit: 20, window: 3600 }); // 20 uploads/hour
export const apiRateLimit = rateLimit({ limit: 100, window: 60 });    // 100 req/min general
