import { z } from "zod";

export const createPhotoSchema = z.object({
  caption: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  albumId: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export const createAlbumSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["music", "photo"]).default("music"),
  isPublic: z.boolean().default(true),
});

export const createPlaylistSchema = z.object({
  title: z.string().min(1).max(200),
  isPublic: z.boolean().default(true),
});

export const addToPlaylistSchema = z.object({
  trackId: z.string().min(1),
  position: z.number().int().min(0).optional(),
});
