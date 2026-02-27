import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import { createDb } from "../db";
import { albums, albumTracks, tracks } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { createAlbumSchema } from "../validators/media";
import { nanoid } from "../lib/jwt";
import { NotFoundError, ForbiddenError } from "../lib/errors";
import { getR2Url } from "../lib/r2";
import type { Env } from "../lib/types";

export const albumsRoutes = new Hono<{ Bindings: Env; Variables: { user: any } }>();

albumsRoutes.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const results = await db.query.albums.findMany({
    where: eq(albums.isPublic, true),
    orderBy: desc(albums.createdAt),
    limit: 20,
  });
  return c.json({ albums: results });
});

albumsRoutes.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const parsed = createAlbumSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  const db = createDb(c.env.DB);
  const id = nanoid();
  await db.insert(albums).values({ id, userId: user.sub, ...parsed.data });
  const album = await db.query.albums.findFirst({ where: eq(albums.id, id) });
  return c.json(album, 201);
});

albumsRoutes.get("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const album = await db.query.albums.findFirst({ where: eq(albums.id, c.req.param("id")) });
  if (!album) return c.json({ error: "Album không tồn tại" }, 404);

  const trackRows = await db.query.albumTracks.findMany({
    where: eq(albumTracks.albumId, album.id),
    orderBy: albumTracks.position,
  });
  const trackIds = trackRows.map((r) => r.trackId);
  const trackList = trackIds.length
    ? await db.query.tracks.findMany({ where: (t, { inArray }) => inArray(t.id, trackIds) })
    : [];

  return c.json({
    ...album,
    tracks: trackList.map((t) => ({ ...t, fileUrl: getR2Url(t.fileUrl), coverUrl: t.coverUrl ? getR2Url(t.coverUrl) : null })),
  });
});

albumsRoutes.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const album = await db.query.albums.findFirst({ where: eq(albums.id, c.req.param("id")) });
  if (!album) return c.json({ error: "Not found" }, 404);
  if (album.userId !== user.sub && !user.isAdmin) return c.json({ error: "Forbidden" }, 403);
  await db.delete(albums).where(eq(albums.id, album.id));
  return c.json({ success: true });
});

albumsRoutes.post("/:id/tracks", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const album = await db.query.albums.findFirst({ where: eq(albums.id, c.req.param("id")) });
  if (!album) return c.json({ error: "Not found" }, 404);
  if (album.userId !== user.sub && !user.isAdmin) return c.json({ error: "Forbidden" }, 403);

  const { trackId, position } = await c.req.json<{ trackId: string; position?: number }>();
  if (!trackId) return c.json({ error: "trackId là bắt buộc" }, 400);

  await db.insert(albumTracks).values({ albumId: album.id, trackId, position: position ?? 0 });
  return c.json({ success: true }, 201);
});
