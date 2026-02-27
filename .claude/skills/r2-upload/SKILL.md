---
name: r2-upload
description: Handle file uploads to Cloudflare R2 in the hiu-api project. Use when uploading audio tracks, photos, covers, or avatars. R2 bucket binding is hiu_media. Helpers are in src/lib/r2.ts.
license: MIT
compatibility: Designed for Claude Code. Requires Cloudflare R2 bucket named hiu-media.
metadata:
  author: hiu
  version: "1.0"
  project: hiu-api
allowed-tools: Bash Read Write Edit Glob Grep
---

# R2 Upload Skill

## Project Context

- **R2 binding**: `c.env.hiu_media`
- **Bucket name**: `hiu-media`
- **Helper file**: `d:/Code/hiu/api/src/lib/r2.ts`
- **Public URL base**: `https://media.hieumoi.online/`

## Key Helpers

```typescript
import {
  uploadToR2, deleteFromR2, getR2Url,
  buildMediaKey, getAllowedMimeTypes,
  MAX_AUDIO_SIZE, MAX_IMAGE_SIZE,
} from "../lib/r2";
```

## Upload Flow (standard)

```typescript
// 1. Get file from FormData
const form = await c.req.formData();
const file = form.get("file") as File | null;
if (!file) return c.json({ error: "file required" }, 400);

// 2. Validate mime type
if (!getAllowedMimeTypes("audio").includes(file.type))
  return c.json({ error: "Invalid audio format" }, 400);

// 3. Validate size
if (file.size > MAX_AUDIO_SIZE)
  return c.json({ error: "Audio too large (max 50MB)" }, 400);

// 4. Build key and upload
const key = buildMediaKey("tracks", user.sub, file.name);
await uploadToR2(c.env.hiu_media, key, await file.arrayBuffer(), file.type);

// 5. Store key in DB (NOT the full URL)
await db.insert(tracks).values({ ..., fileUrl: key });

// 6. Return public URL
return c.json({ url: getR2Url(key) });
```

## Media Types and Size Limits

| Type | Allowed MIME | Max Size | buildMediaKey type |
|---|---|---|---|
| Audio track | mp3, wav, ogg, flac, aac | 50MB | `"tracks"` |
| Photo | jpeg, png, webp, gif | 10MB | `"photos"` |
| Album/track cover | jpeg, png, webp | 10MB | `"covers"` |
| User avatar | jpeg, png, webp | 10MB | `"avatars"` |

## Key Format

Keys are stored in DB (not full URLs). Full URL is derived at read time:

```
tracks/{userId}/{timestamp}.mp3
photos/{userId}/{timestamp}.jpg
covers/{userId}/{timestamp}.jpg
avatars/{userId}/{timestamp}.jpg
```

## Delete File

Always delete from R2 when deleting the DB record:

```typescript
await c.env.hiu_media.delete(track.fileUrl);
if (track.coverUrl) await c.env.hiu_media.delete(track.coverUrl);
await db.delete(tracks).where(eq(tracks.id, id));
```

## Public URL

```typescript
// In src/lib/r2.ts — update this if domain changes
export function getR2Url(key: string): string {
  return `https://media.hieumoi.online/${key}`;
}
```

> **Note**: Set up R2 public domain in Cloudflare dashboard → R2 → hiu-media → Settings → Custom Domain → `media.hieumoi.online`
