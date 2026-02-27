import { eq, desc, and, sql } from "drizzle-orm";
import { photos, likes, comments } from "../db/schema";
import { uploadToR2, buildMediaKey, getAllowedMimeTypes, MAX_IMAGE_SIZE, getR2Url, deleteFromR2 } from "../lib/r2";
import { nanoid } from "../lib/jwt";
import { NotFoundError, ForbiddenError, ValidationError } from "../lib/errors";
import type { DB } from "../db";
import type { CreatePhotoInput } from "../validators/media";

type CreatePhotoInput = { caption?: string; location?: string; albumId?: string; isPublic: boolean };

export class PhotosService {
  constructor(private db: DB, private r2: R2Bucket) {}

  async list(page: number, limit: number, userId?: string) {
    const offset = (page - 1) * limit;
    const results = await this.db.query.photos.findMany({
      where: userId
        ? and(eq(photos.userId, userId), eq(photos.isPublic, true))
        : eq(photos.isPublic, true),
      orderBy: desc(photos.createdAt),
      limit, offset,
    });
    return results.map(this.#withUrl);
  }

  async upload(userId: string, input: CreatePhotoInput, file: File) {
    if (!getAllowedMimeTypes("image").includes(file.type))
      throw new ValidationError("Định dạng ảnh không hợp lệ. Hỗ trợ: jpeg, png, webp, gif");
    if (file.size > MAX_IMAGE_SIZE)
      throw new ValidationError("Ảnh quá lớn (tối đa 10MB)");

    const id = nanoid();
    const key = buildMediaKey("photos", userId, file.name);
    await uploadToR2(this.r2, key, await file.arrayBuffer(), file.type);
    await this.db.insert(photos).values({
      id, userId, albumId: input.albumId ?? null,
      url: key, caption: input.caption ?? null, location: input.location ?? null,
      fileSize: file.size, isPublic: input.isPublic,
    });
    const photo = await this.db.query.photos.findFirst({ where: eq(photos.id, id) });
    return this.#withUrl(photo!);
  }

  async getById(id: string) {
    const photo = await this.db.query.photos.findFirst({
      where: and(eq(photos.id, id), eq(photos.isPublic, true)),
    });
    if (!photo) throw new NotFoundError("Photo");
    return this.#withUrl(photo);
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const photo = await this.db.query.photos.findFirst({ where: eq(photos.id, id) });
    if (!photo) throw new NotFoundError("Photo");
    if (photo.userId !== userId && !isAdmin) throw new ForbiddenError();
    await deleteFromR2(this.r2, photo.url);
    await this.db.delete(photos).where(eq(photos.id, id));
  }

  async toggleLike(photoId: string, userId: string) {
    const existing = await this.db.query.likes.findFirst({
      where: and(eq(likes.userId, userId), eq(likes.targetType, "photo"), eq(likes.targetId, photoId)),
    });
    if (existing) {
      await this.db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.targetType, "photo"), eq(likes.targetId, photoId)));
      await this.db.update(photos).set({ likesCount: sql`${photos.likesCount} - 1` }).where(eq(photos.id, photoId));
      return { liked: false };
    }
    await this.db.insert(likes).values({ userId, targetType: "photo", targetId: photoId });
    await this.db.update(photos).set({ likesCount: sql`${photos.likesCount} + 1` }).where(eq(photos.id, photoId));
    return { liked: true };
  }

  async getComments(photoId: string) {
    return this.db.query.comments.findMany({
      where: and(eq(comments.targetType, "photo"), eq(comments.targetId, photoId)),
      orderBy: desc(comments.createdAt),
      limit: 50,
    });
  }

  async addComment(photoId: string, userId: string, content: string) {
    const id = nanoid();
    await this.db.insert(comments).values({ id, userId, targetType: "photo", targetId: photoId, content });
    return { id, content, userId };
  }

  #withUrl(photo: typeof photos.$inferSelect) {
    return { ...photo, url: getR2Url(photo.url) };
  }
}
