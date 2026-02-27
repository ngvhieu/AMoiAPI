import { Hono } from "hono";
import { createDb } from "../db";
import { PhotosService } from "../services/photos.service";
import { authMiddleware } from "../middleware/auth";
import { createCommentSchema, paginationSchema } from "../validators/tracks";
import type { Env } from "../lib/types";

export const photosRoutes = new Hono<{ Bindings: Env; Variables: { user: any } }>();

photosRoutes.get("/", async (c) => {
  const { page, limit } = paginationSchema.parse({ page: c.req.query("page"), limit: c.req.query("limit") });
  const service = new PhotosService(createDb(c.env.DB), c.env.hiu_media);
  const photos = await service.list(page, limit, c.req.query("userId"));
  return c.json({ photos, page, limit });
});

photosRoutes.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const form = await c.req.formData();
  const fileEntry = form.get("file");
  if (!fileEntry || typeof fileEntry === "string") return c.json({ error: "file là bắt buộc" }, 400);

  const service = new PhotosService(createDb(c.env.DB), c.env.hiu_media);
  const photo = await service.upload(user.sub, {
    caption: form.get("caption") as string ?? undefined,
    location: form.get("location") as string ?? undefined,
    albumId: form.get("albumId") as string ?? undefined,
    isPublic: form.get("isPublic") !== "false",
  }, fileEntry as File);
  return c.json(photo, 201);
});

photosRoutes.get("/:id", async (c) => {
  const service = new PhotosService(createDb(c.env.DB), c.env.hiu_media);
  return c.json(await service.getById(c.req.param("id")));
});

photosRoutes.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  await new PhotosService(createDb(c.env.DB), c.env.hiu_media).delete(c.req.param("id"), user.sub, user.isAdmin);
  return c.json({ success: true });
});

photosRoutes.post("/:id/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const result = await new PhotosService(createDb(c.env.DB), c.env.hiu_media).toggleLike(c.req.param("id"), user.sub);
  return c.json(result);
});

photosRoutes.get("/:id/comments", async (c) => {
  const comments = await new PhotosService(createDb(c.env.DB), c.env.hiu_media).getComments(c.req.param("id"));
  return c.json({ comments });
});

photosRoutes.post("/:id/comments", authMiddleware, async (c) => {
  const user = c.get("user");
  const parsed = createCommentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const comment = await new PhotosService(createDb(c.env.DB), c.env.hiu_media).addComment(c.req.param("id"), user.sub, parsed.data.content);
  return c.json(comment, 201);
});
