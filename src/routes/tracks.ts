import { Hono } from "hono";
import { createDb } from "../db";
import { TracksService } from "../services/tracks.service";
import { authMiddleware } from "../middleware/auth";
import { createTrackSchema, createCommentSchema, paginationSchema } from "../validators/tracks";
import type { Env } from "../lib/types";

export const tracksRoutes = new Hono<{ Bindings: Env; Variables: { user: any } }>();

tracksRoutes.get("/", async (c) => {
  const { page, limit } = paginationSchema.parse({ page: c.req.query("page"), limit: c.req.query("limit") });
  const service = new TracksService(createDb(c.env.DB), c.env.hiu_media);
  const tracks = await service.list(page, limit);
  return c.json({ tracks, page, limit });
});

tracksRoutes.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const form = await c.req.formData();
  const audioFile = form.get("file") as File | null;
  if (!audioFile) return c.json({ error: "file là bắt buộc" }, 400);

  const parsed = createTrackSchema.safeParse({
    title: form.get("title"),
    artist: form.get("artist"),
    genre: form.get("genre"),
    albumId: form.get("albumId"),
    isPublic: form.get("isPublic") !== "false",
  });
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  const coverEntry = form.get("cover");
  const coverFile = coverEntry != null && typeof coverEntry === "object" ? (coverEntry as File) : undefined;
  const service = new TracksService(createDb(c.env.DB), c.env.hiu_media);
  const track = await service.upload(user.sub, parsed.data, audioFile, coverFile ?? undefined);
  return c.json(track, 201);
});

tracksRoutes.get("/:id", async (c) => {
  const service = new TracksService(createDb(c.env.DB), c.env.hiu_media);
  const track = await service.getById(c.req.param("id"));
  return c.json(track);
});

tracksRoutes.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const service = new TracksService(createDb(c.env.DB), c.env.hiu_media);
  await service.delete(c.req.param("id"), user.sub, user.isAdmin);
  return c.json({ success: true });
});

tracksRoutes.post("/:id/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const service = new TracksService(createDb(c.env.DB), c.env.hiu_media);
  const result = await service.toggleLike(c.req.param("id"), user.sub);
  return c.json(result);
});

tracksRoutes.get("/:id/comments", async (c) => {
  const service = new TracksService(createDb(c.env.DB), c.env.hiu_media);
  const comments = await service.getComments(c.req.param("id"));
  return c.json({ comments });
});

tracksRoutes.post("/:id/comments", authMiddleware, async (c) => {
  const user = c.get("user");
  const parsed = createCommentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const service = new TracksService(createDb(c.env.DB), c.env.hiu_media);
  const comment = await service.addComment(c.req.param("id"), user.sub, parsed.data.content);
  return c.json(comment, 201);
});
