import { eq, desc, and, sql } from "drizzle-orm";
import { tracks, likes, comments } from "../db/schema";
import { uploadToR2, buildMediaKey, getAllowedMimeTypes, MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, getR2Url, deleteFromR2 } from "../lib/r2";
import { nanoid } from "../lib/jwt";
import { NotFoundError, ForbiddenError, ValidationError } from "../lib/errors";
import type { DB } from "../db";
import type { CreateTrackInput } from "../validators/tracks";

export class TracksService {
  constructor(private db: DB, private r2: R2Bucket) {}

  async list(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const results = await this.db.query.tracks.findMany({
      where: eq(tracks.isPublic, true),
      orderBy: desc(tracks.createdAt),
      limit, offset,
    });
    return results.map(this.#withUrls);
  }

  async upload(userId: string, input: CreateTrackInput, audioFile: File, coverFile?: File) {
    if (!getAllowedMimeTypes("audio").includes(audioFile.type))
      throw new ValidationError("Định dạng audio không hợp lệ. Hỗ trợ: mp3, wav, ogg, flac, aac");
    if (audioFile.size > MAX_AUDIO_SIZE)
      throw new ValidationError("File audio quá lớn (tối đa 50MB)");

    const id = nanoid();
    const audioKey = buildMediaKey("tracks", userId, audioFile.name);
    await uploadToR2(this.r2, audioKey, await audioFile.arrayBuffer(), audioFile.type);

    let coverKey: string | null = null;
    if (coverFile) {
      if (!getAllowedMimeTypes("image").includes(coverFile.type))
        throw new ValidationError("Định dạng ảnh bìa không hợp lệ");
      if (coverFile.size > MAX_IMAGE_SIZE)
        throw new ValidationError("Ảnh bìa quá lớn (tối đa 10MB)");
      coverKey = buildMediaKey("covers", userId, coverFile.name);
      await uploadToR2(this.r2, coverKey, await coverFile.arrayBuffer(), coverFile.type);
    }

    await this.db.insert(tracks).values({
      id, userId, albumId: input.albumId ?? null,
      title: input.title, artist: input.artist ?? null, genre: input.genre ?? null,
      fileUrl: audioKey, coverUrl: coverKey,
      fileSize: audioFile.size, mimeType: audioFile.type,
      isPublic: input.isPublic,
    });

    const track = await this.db.query.tracks.findFirst({ where: eq(tracks.id, id) });
    return this.#withUrls(track!);
  }

  async getById(id: string) {
    const track = await this.db.query.tracks.findFirst({
      where: and(eq(tracks.id, id), eq(tracks.isPublic, true)),
    });
    if (!track) throw new NotFoundError("Track");
    await this.db.update(tracks).set({ plays: sql`${tracks.plays} + 1` }).where(eq(tracks.id, id));
    return this.#withUrls(track);
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const track = await this.db.query.tracks.findFirst({ where: eq(tracks.id, id) });
    if (!track) throw new NotFoundError("Track");
    if (track.userId !== userId && !isAdmin) throw new ForbiddenError();
    await deleteFromR2(this.r2, track.fileUrl);
    if (track.coverUrl) await deleteFromR2(this.r2, track.coverUrl);
    await this.db.delete(tracks).where(eq(tracks.id, id));
  }

  async toggleLike(trackId: string, userId: string) {
    const existing = await this.db.query.likes.findFirst({
      where: and(eq(likes.userId, userId), eq(likes.targetType, "track"), eq(likes.targetId, trackId)),
    });
    if (existing) {
      await this.db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.targetType, "track"), eq(likes.targetId, trackId)));
      await this.db.update(tracks).set({ likesCount: sql`${tracks.likesCount} - 1` }).where(eq(tracks.id, trackId));
      return { liked: false };
    }
    await this.db.insert(likes).values({ userId, targetType: "track", targetId: trackId });
    await this.db.update(tracks).set({ likesCount: sql`${tracks.likesCount} + 1` }).where(eq(tracks.id, trackId));
    return { liked: true };
  }

  async getComments(trackId: string) {
    return this.db.query.comments.findMany({
      where: and(eq(comments.targetType, "track"), eq(comments.targetId, trackId)),
      orderBy: desc(comments.createdAt),
      limit: 50,
    });
  }

  async addComment(trackId: string, userId: string, content: string) {
    const id = nanoid();
    await this.db.insert(comments).values({ id, userId, targetType: "track", targetId: trackId, content });
    return { id, content, userId };
  }

  #withUrls(track: typeof tracks.$inferSelect) {
    return {
      ...track,
      fileUrl: getR2Url(track.fileUrl),
      coverUrl: track.coverUrl ? getR2Url(track.coverUrl) : null,
    };
  }
}
