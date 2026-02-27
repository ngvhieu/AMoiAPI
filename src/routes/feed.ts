import { Hono } from "hono";
import { eq, desc, inArray } from "drizzle-orm";
import { createDb } from "../db";
import { tracks, follows } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { paginationSchema } from "../validators/tracks";
import { getR2Url } from "../lib/r2";
import type { Env } from "../lib/types";

export const feedRoutes = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// GET /feed — personalized feed (tracks from followed users)
feedRoutes.get("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const { page, limit } = paginationSchema.parse({ page: c.req.query("page"), limit: c.req.query("limit") });
  const offset = (page - 1) * limit;

  const db = createDb(c.env.DB);

  // Get list of followed user IDs
  const followedRows = await db.query.follows.findMany({
    where: eq(follows.followerId, user.sub),
    columns: { followingId: true },
  });

  const followedIds = followedRows.map((r) => r.followingId);
  if (followedIds.length === 0) return c.json({ tracks: [], page, limit });

  const results = await db.query.tracks.findMany({
    where: (t, { and, inArray }) => and(eq(t.isPublic, true), inArray(t.userId, followedIds)),
    orderBy: desc(tracks.createdAt),
    limit,
    offset,
  });

  return c.json({
    tracks: results.map((t) => ({
      ...t,
      fileUrl: getR2Url(t.fileUrl),
      coverUrl: t.coverUrl ? getR2Url(t.coverUrl) : null,
    })),
    page,
    limit,
  });
});
