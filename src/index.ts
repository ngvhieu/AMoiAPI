import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { authRoutes } from "./routes/auth";
import { tracksRoutes } from "./routes/tracks";
import { photosRoutes } from "./routes/photos";
import { usersRoutes } from "./routes/users";
import { albumsRoutes } from "./routes/albums";
import { playlistsRoutes } from "./routes/playlists";
import { feedRoutes } from "./routes/feed";
import { searchRoutes } from "./routes/search";
import { apiRateLimit } from "./middleware/rateLimit";
import { AppError } from "./lib/errors";
import type { Env } from "./lib/types";

const app = new Hono<{ Bindings: Env }>();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", async (c, next) => {
  const handler = cors({
    origin: [c.env.FRONTEND_URL, "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
  return handler(c, next);
});
app.use("/api/*", apiRateLimit);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/api/auth",      authRoutes);
app.route("/api/tracks",    tracksRoutes);
app.route("/api/photos",    photosRoutes);
app.route("/api/users",     usersRoutes);
app.route("/api/albums",    albumsRoutes);
app.route("/api/playlists", playlistsRoutes);
app.route("/api/feed",      feedRoutes);
app.route("/api/search",    searchRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/", (c) => c.json({ status: "ok", version: "1.0.0" }));

// ─── Error handling ───────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message, code: err.code }, err.status as any);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
