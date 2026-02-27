import type { Env } from "./types";

const PUBLIC_URL_TTL = 60 * 60; // 1 hour signed URL

export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<string> {
  await r2.put(key, data, { httpMetadata: { contentType } });
  return key;
}

export async function deleteFromR2(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key);
}

// Returns a public R2 URL — assumes bucket is public via r2.dev or custom domain
export function getR2Url(key: string): string {
  // Replace with your R2 public URL or r2.dev subdomain
  return `https://media.hieumoi.online/${key}`;
}

export function buildMediaKey(
  type: "tracks" | "photos" | "covers" | "avatars",
  userId: string,
  filename: string,
): string {
  const ext = filename.split(".").pop() ?? "bin";
  const ts = Date.now();
  return `${type}/${userId}/${ts}.${ext}`;
}

export function getAllowedMimeTypes(type: "audio" | "image"): string[] {
  if (type === "audio") return ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"];
  return ["image/jpeg", "image/png", "image/webp", "image/gif"];
}

export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
