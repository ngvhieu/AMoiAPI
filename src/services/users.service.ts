import { eq, desc, and, sql } from "drizzle-orm";
import { users, tracks, photos, follows } from "../db/schema";
import { getR2Url, uploadToR2, buildMediaKey, getAllowedMimeTypes, MAX_IMAGE_SIZE } from "../lib/r2";
import { NotFoundError, ValidationError } from "../lib/errors";
import { nanoid } from "../lib/jwt";
import type { DB } from "../db";

export class UsersService {
  constructor(private db: DB) {}

  async getProfile(username: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { passwordHash: false },
    });
    if (!user) throw new NotFoundError("User");

    const [trackCount] = await this.db.select({ count: sql<number>`count(*)` })
      .from(tracks).where(and(eq(tracks.userId, user.id), eq(tracks.isPublic, true)));
    const [photoCount] = await this.db.select({ count: sql<number>`count(*)` })
      .from(photos).where(and(eq(photos.userId, user.id), eq(photos.isPublic, true)));
    const [followerCount] = await this.db.select({ count: sql<number>`count(*)` })
      .from(follows).where(eq(follows.followingId, user.id));
    const [followingCount] = await this.db.select({ count: sql<number>`count(*)` })
      .from(follows).where(eq(follows.followerId, user.id));

    return {
      ...user,
      avatarUrl: user.avatarUrl ? getR2Url(user.avatarUrl) : null,
      stats: {
        tracks: trackCount.count,
        photos: photoCount.count,
        followers: followerCount.count,
        following: followingCount.count,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: false },
    });
    if (!user) throw new NotFoundError("User");
    return { ...user, avatarUrl: user.avatarUrl ? getR2Url(user.avatarUrl) : null };
  }

  async updateMe(userId: string, data: { displayName?: string; bio?: string }) {
    await this.db.update(users).set(data).where(eq(users.id, userId));
    return this.getMe(userId);
  }

  async uploadAvatar(userId: string, file: File, r2: R2Bucket) {
    if (!getAllowedMimeTypes("image").includes(file.type)) {
      throw new ValidationError("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new ValidationError("Ảnh tối đa 10MB");
    }

    const key = buildMediaKey("avatars", userId, file.name);
    const buffer = await file.arrayBuffer();
    await uploadToR2(r2, key, buffer, file.type);
    await this.db.update(users).set({ avatarUrl: key }).where(eq(users.id, userId));

    return { avatarUrl: getR2Url(key) };
  }

  async deleteAccount(userId: string) {
    await this.db.delete(users).where(eq(users.id, userId));
  }

  async getUserTracks(username: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.username, username) });
    if (!user) throw new NotFoundError("User");
    const results = await this.db.query.tracks.findMany({
      where: and(eq(tracks.userId, user.id), eq(tracks.isPublic, true)),
      orderBy: desc(tracks.createdAt),
      limit: 50,
    });
    return results.map((t) => ({ ...t, fileUrl: getR2Url(t.fileUrl), coverUrl: t.coverUrl ? getR2Url(t.coverUrl) : null }));
  }

  async getUserPhotos(username: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.username, username) });
    if (!user) throw new NotFoundError("User");
    const results = await this.db.query.photos.findMany({
      where: and(eq(photos.userId, user.id), eq(photos.isPublic, true)),
      orderBy: desc(photos.createdAt),
      limit: 50,
    });
    return results.map((p) => ({ ...p, url: getR2Url(p.url) }));
  }

  async toggleFollow(followerId: string, targetUsername: string) {
    const target = await this.db.query.users.findFirst({ where: eq(users.username, targetUsername) });
    if (!target) throw new NotFoundError("User");
    if (target.id === followerId) throw new ValidationError("Không thể follow chính mình");

    const existing = await this.db.query.follows.findFirst({
      where: and(eq(follows.followerId, followerId), eq(follows.followingId, target.id)),
    });
    if (existing) {
      await this.db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, target.id)));
      return { following: false };
    }
    await this.db.insert(follows).values({ followerId, followingId: target.id });
    return { following: true };
  }
}
