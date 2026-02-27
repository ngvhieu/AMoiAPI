import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { createDb } from "../db";
import { playlists, playlistTracks } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { createPlaylistSchema, addToPlaylistSchema } from "../validators/media";
import { nanoid } from "../lib/jwt";
import { getR2Url } from "../lib/r2";
import type { Env } from "../lib/types";

export const playlistsRoutes = new Hono<{ Bindings: Env; Variables: { user: any } }>();

playlistsRoutes.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const results = await db.query.playlists.findMany({
    where: eq(playlists.isPublic, true),
    orderBy: desc(playlists.createdAt),
    limit: 20,
  });
  return c.json({ playlists: results });
});

playlistsRoutes.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const parsed = createPlaylistSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  const db = createDb(c.env.DB);
  const id = nanoid();
  await db.insert(playlists).values({ id, userId: user.sub, ...parsed.data });
  const playlist = await db.query.playlists.findFirst({ where: eq(playlists.id, id) });
  return c.json(playlist, 201);
});

playlistsRoutes.get("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const playlist = await db.query.playlists.findFirst({ where: eq(playlists.id, c.req.param("id")) });
  if (!playlist) return c.json({ error: "Playlist không tồn tại" }, 404);

  const rows = await db.query.playlistTracks.findMany({
    where: eq(playlistTracks.playlistId, playlist.id),
    orderBy: playlistTracks.position,
  });
  const trackIds = rows.map((r) => r.trackId);
  const trackList = trackIds.length
    ? await db.query.tracks.findMany({ where: (t, { inArray }) => inArray(t.id, trackIds) })
    : [];

  return c.json({
    ...playlist,
    tracks: trackList.map((t: any) => ({ ...t, fileUrl: getR2Url(t.fileUrl), coverUrl: t.coverUrl ? getR2Url(t.coverUrl) : null })),
  });
});

playlistsRoutes.post("/:id/tracks", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const playlist = await db.query.playlists.findFirst({ where: eq(playlists.id, c.req.param("id")) });
  if (!playlist) return c.json({ error: "Not found" }, 404);
  if (playlist.userId !== user.sub) return c.json({ error: "Forbidden" }, 403);

  const parsed = addToPlaylistSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  await db.insert(playlistTracks).values({
    playlistId: playlist.id,
    trackId: parsed.data.trackId,
    position: parsed.data.position ?? 0,
  });
  return c.json({ success: true }, 201);
});

playlistsRoutes.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const playlist = await db.query.playlists.findFirst({ where: eq(playlists.id, c.req.param("id")) });
  if (!playlist) return c.json({ error: "Not found" }, 404);
  if (playlist.userId !== user.sub && !user.isAdmin) return c.json({ error: "Forbidden" }, 403);
  await db.delete(playlists).where(eq(playlists.id, playlist.id));
  return c.json({ success: true });
});
