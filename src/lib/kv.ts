import type { Env } from "./types";

export function kv(namespace: KVNamespace) {
  return {
    async get<T>(key: string): Promise<T | null> {
      const val = await namespace.get(key);
      if (!val) return null;
      try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
    },
    async set(key: string, value: unknown, ttl?: number): Promise<void> {
      const opts = ttl ? { expirationTtl: ttl } : undefined;
      await namespace.put(key, JSON.stringify(value), opts);
    },
    async del(key: string): Promise<void> {
      await namespace.delete(key);
    },
  };
}
