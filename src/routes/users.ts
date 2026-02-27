import { Hono } from "hono";
import { createDb } from "../db";
import { UsersService } from "../services/users.service";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";
import type { Env } from "../lib/types";
import type { JWTPayload } from "../lib/types";

export const usersRoutes = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>();

// ─── Public routes ────────────────────────────────────────────────────────────

usersRoutes.get("/:username", async (c) => {
  const profile = await new UsersService(createDb(c.env.DB)).getProfile(c.req.param("username"));
  return c.json(profile);
});

usersRoutes.get("/:username/tracks", async (c) => {
  const tracks = await new UsersService(createDb(c.env.DB)).getUserTracks(c.req.param("username"));
  return c.json({ tracks });
});

usersRoutes.get("/:username/photos", async (c) => {
  const photos = await new UsersService(createDb(c.env.DB)).getUserPhotos(c.req.param("username"));
  return c.json({ photos });
});

usersRoutes.post("/:username/follow", authMiddleware, async (c) => {
  const user = c.get("user");
  const result = await new UsersService(createDb(c.env.DB)).toggleFollow(user.sub, c.req.param("username"));
  return c.json(result);
});

// ─── Authenticated /me routes ─────────────────────────────────────────────────

usersRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await new UsersService(createDb(c.env.DB)).getMe(user.sub);
  return c.json(profile);
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
});

usersRoutes.put("/me", authMiddleware, async (c) => {
  const parsed = updateProfileSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get("user");
  const profile = await new UsersService(createDb(c.env.DB)).updateMe(user.sub, parsed.data);
  return c.json(profile);
});

usersRoutes.post("/me/avatar", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "File là bắt buộc" }, 400);

  const result = await new UsersService(createDb(c.env.DB)).uploadAvatar(user.sub, file, c.env.hiu_media);
  return c.json(result);
});

usersRoutes.delete("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  await new UsersService(createDb(c.env.DB)).deleteAccount(user.sub);
  return c.json({ success: true });
});
