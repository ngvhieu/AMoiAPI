import { z } from "zod";

export const createTrackSchema = z.object({
  title: z.string().min(1, "Tên bài hát không được để trống").max(200),
  artist: z.string().max(100).optional(),
  genre: z.string().max(50).optional(),
  albumId: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Nội dung không được để trống").max(1000),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
