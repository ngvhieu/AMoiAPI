import { sql } from "drizzle-orm";
import {
  text, integer,
  sqliteTable, primaryKey, index,
} from "drizzle-orm/sqlite-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id:              text("id").primaryKey(), // nanoid
  username:        text("username").notNull().unique(),
  email:           text("email").notNull().unique(),
  passwordHash:    text("password_hash").notNull(),
  displayName:     text("display_name"),
  bio:             text("bio"),
  avatarUrl:       text("avatar_url"),
  isAdmin:         integer("is_admin", { mode: "boolean" }).default(false),
  isEmailVerified: integer("is_email_verified", { mode: "boolean" }).default(false),
  createdAt:       text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  usernameIdx: index("users_username_idx").on(t.username),
  emailIdx:    index("users_email_idx").on(t.email),
}));

// ─── OTP Codes ────────────────────────────────────────────────────────────────

export const otpCodes = sqliteTable("otp_codes", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email:     text("email").notNull(),
  code:      text("code").notNull(),
  type:      text("type", { enum: ["verify_email", "reset_password"] }).notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt:    text("used_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  emailTypeIdx: index("otp_codes_email_type_idx").on(t.email, t.type),
  userIdx:      index("otp_codes_user_idx").on(t.userId),
}));

// ─── Albums ───────────────────────────────────────────────────────────────────

export const albums = sqliteTable("albums", {
  id:          text("id").primaryKey(),
  userId:      text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:       text("title").notNull(),
  description: text("description"),
  coverUrl:    text("cover_url"),
  type:        text("type", { enum: ["music", "photo"] }).notNull().default("music"),
  isPublic:    integer("is_public", { mode: "boolean" }).default(true),
  createdAt:   text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index("albums_user_idx").on(t.userId),
}));

// ─── Tracks ───────────────────────────────────────────────────────────────────

export const tracks = sqliteTable("tracks", {
  id:         text("id").primaryKey(),
  userId:     text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  albumId:    text("album_id").references(() => albums.id, { onDelete: "set null" }),
  title:      text("title").notNull(),
  artist:     text("artist"),
  genre:      text("genre"),
  fileUrl:    text("file_url").notNull(),   // R2 key
  coverUrl:   text("cover_url"),            // R2 key
  duration:   integer("duration"),          // seconds
  fileSize:   integer("file_size"),         // bytes
  mimeType:   text("mime_type"),
  plays:      integer("plays").default(0),
  likesCount: integer("likes_count").default(0),
  isPublic:   integer("is_public", { mode: "boolean" }).default(true),
  createdAt:  text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx:  index("tracks_user_idx").on(t.userId),
  albumIdx: index("tracks_album_idx").on(t.albumId),
}));

// ─── Album tracks ─────────────────────────────────────────────────────────────

export const albumTracks = sqliteTable("album_tracks", {
  albumId:  text("album_id").notNull().references(() => albums.id, { onDelete: "cascade" }),
  trackId:  text("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  position: integer("position").default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.albumId, t.trackId] }),
}));

// ─── Photos ───────────────────────────────────────────────────────────────────

export const photos = sqliteTable("photos", {
  id:         text("id").primaryKey(),
  userId:     text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  albumId:    text("album_id").references(() => albums.id, { onDelete: "set null" }),
  url:        text("url").notNull(),         // R2 key
  caption:    text("caption"),
  location:   text("location"),
  width:      integer("width"),
  height:     integer("height"),
  fileSize:   integer("file_size"),
  likesCount: integer("likes_count").default(0),
  isPublic:   integer("is_public", { mode: "boolean" }).default(true),
  createdAt:  text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx:  index("photos_user_idx").on(t.userId),
  albumIdx: index("photos_album_idx").on(t.albumId),
}));

// ─── Playlists ────────────────────────────────────────────────────────────────

export const playlists = sqliteTable("playlists", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:     text("title").notNull(),
  coverUrl:  text("cover_url"),
  isPublic:  integer("is_public", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index("playlists_user_idx").on(t.userId),
}));

export const playlistTracks = sqliteTable("playlist_tracks", {
  playlistId: text("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  trackId:    text("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  position:   integer("position").default(0),
  addedAt:    text("added_at").default(sql`(datetime('now'))`),
}, (t) => ({
  pk: primaryKey({ columns: [t.playlistId, t.trackId] }),
}));

// ─── Likes ────────────────────────────────────────────────────────────────────

export const likes = sqliteTable("likes", {
  userId:     text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type", { enum: ["track", "photo", "album"] }).notNull(),
  targetId:   text("target_id").notNull(),
  createdAt:  text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  pk:        primaryKey({ columns: [t.userId, t.targetType, t.targetId] }),
  targetIdx: index("likes_target_idx").on(t.targetType, t.targetId),
}));

// ─── Comments ─────────────────────────────────────────────────────────────────

export const comments = sqliteTable("comments", {
  id:         text("id").primaryKey(),
  userId:     text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type", { enum: ["track", "photo"] }).notNull(),
  targetId:   text("target_id").notNull(),
  content:    text("content").notNull(),
  createdAt:  text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  targetIdx: index("comments_target_idx").on(t.targetType, t.targetId),
}));

// ─── Follows ──────────────────────────────────────────────────────────────────

export const follows = sqliteTable("follows", {
  followerId:  text("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: text("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt:   text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  pk:           primaryKey({ columns: [t.followerId, t.followingId] }),
  followerIdx:  index("follows_follower_idx").on(t.followerId),
  followingIdx: index("follows_following_idx").on(t.followingId),
}));

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export const refreshTokens = sqliteTable("refresh_tokens", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => ({
  tokenIdx: index("refresh_tokens_token_idx").on(t.token),
  userIdx:  index("refresh_tokens_user_idx").on(t.userId),
}));
