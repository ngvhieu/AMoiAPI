import { Hono } from "hono";
import { eq, and, like, or } from "drizzle-orm";
import { createDb } from "../db";
import { tracks, photos, users } from "../db/schema";
import { getR2Url } from "../lib/r2";
import type { Env } from "../lib/types";

export const searchRoutes = new Hono<{ Bindings: Env }>();

searchRoutes.get("/", async (c) => {
  const q = c.req.query("q")?.trim();
  const type = c.req.query("type") ?? "tracks";
  if (!q || q.length < 2) return c.json({ error: "Query phải có ít nhất 2 ký tự" }, 400);

  const db = createDb(c.env.DB);
  const pattern = `%${q}%`;

  if (type === "tracks") {
    const results = await db.query.tracks.findMany({
      where: and(eq(tracks.isPublic, true), or(like(tracks.title, pattern), like(tracks.artist as any, pattern))),
      limit: 20,
    });
    return c.json({ results: results.map((t) => ({ ...t, fileUrl: getR2Url(t.fileUrl), coverUrl: t.coverUrl ? getR2Url(t.coverUrl) : null })) });
  }

  if (type === "users") {
    const results = await db.query.users.findMany({
      where: or(like(users.username, pattern), like(users.displayName as any, pattern)),
      columns: { passwordHash: false },
      limit: 20,
    });
    return c.json({ results: results.map((u) => ({ ...u, avatarUrl: u.avatarUrl ? getR2Url(u.avatarUrl) : null })) });
  }

  if (type === "photos") {
    const results = await db.query.photos.findMany({
      where: and(eq(photos.isPublic, true), or(like(photos.caption as any, pattern), like(photos.location as any, pattern))),
      limit: 20,
    });
    return c.json({ results: results.map((p) => ({ ...p, url: getR2Url(p.url) })) });
  }

  return c.json({ error: "type không hợp lệ. Dùng: tracks | photos | users" }, 400);
});
