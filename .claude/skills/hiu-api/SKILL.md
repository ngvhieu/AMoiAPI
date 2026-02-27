---
name: hiu-api
description: Master skill for the Hiu platform API. Use when adding features, debugging, or understanding the full architecture of the hiu-api Hono + Cloudflare Workers backend. Covers auth flow, media upload, social features, and API conventions.
license: MIT
compatibility: Designed for Claude Code. Requires Node.js, wrangler CLI, Cloudflare account with D1/KV/R2 configured.
metadata:
  author: hiu
  version: "1.0"
  project: hiu-api
allowed-tools: Bash Read Write Edit Glob Grep
---

# Hiu API — Master Skill

## Project Locations

| Item | Path |
|---|---|
| API root | `d:/Code/hiu/api/` |
| Frontend | `d:/Code/hiu/profile/` |
| Entry point | `src/index.ts` |
| Schema | `src/db/schema.ts` |
| Routes | `src/routes/` |
| Middleware | `src/middleware/auth.ts` |
| Lib | `src/lib/` |

## API Base URL

- **Local**: `http://localhost:8787`
- **Production**: `https://api.hieumoi.online`

## Auth Flow

1. `POST /api/auth/register` → returns `{ accessToken, refreshToken, user }`
2. `POST /api/auth/login` → same response
3. Access token: JWT signed with PBKDF2, expires in **1 hour**
4. Refresh token: opaque 40-char string, stored in D1, expires in **30 days**
5. `POST /api/auth/refresh` with `{ refreshToken }` → new `accessToken`
6. `DELETE /api/auth/logout` with `{ refreshToken }` → deletes from DB

Frontend sends: `Authorization: Bearer <accessToken>` header.

## All Endpoints

```
# Auth
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
DELETE /api/auth/logout

# Tracks
GET    /api/tracks              ?page=1&limit=20
POST   /api/tracks              multipart/form-data (auth)
GET    /api/tracks/:id
DELETE /api/tracks/:id          (auth, owner or admin)
POST   /api/tracks/:id/like     (auth) → { liked: bool }

# Photos
GET    /api/photos              ?page=1&limit=24&userId=
POST   /api/photos              multipart/form-data (auth)
GET    /api/photos/:id
DELETE /api/photos/:id          (auth, owner or admin)
POST   /api/photos/:id/like     (auth) → { liked: bool }
GET    /api/photos/:id/comments
POST   /api/photos/:id/comments (auth) { content }

# Users
GET    /api/users/:username
GET    /api/users/:username/tracks
GET    /api/users/:username/photos
POST   /api/users/:username/follow (auth) → { following: bool }

# Search
GET    /api/search              ?q=keyword&type=tracks|photos|users
```

## FormData Upload Fields

**POST /api/tracks:**
- `file` (required) — audio file
- `cover` (optional) — cover image
- `title` (required)
- `artist`, `genre`, `albumId`, `isPublic`

**POST /api/photos:**
- `file` (required) — image
- `caption`, `location`, `albumId`, `isPublic`

## Key Conventions

- IDs generated with `nanoid()` from `src/lib/jwt.ts`
- R2 keys stored in DB, public URLs generated at read time via `getR2Url(key)`
- Passwords hashed with PBKDF2 (100k iterations, SHA-256)
- All timestamps: SQLite `datetime('now')` in UTC
- Deleted files: always delete from R2 before deleting DB row

## Related Skills

- `hono-cloudflare` — route/middleware patterns
- `d1-drizzle` — DB queries and migrations
- `r2-upload` — file upload details

See [references/architecture.md](references/architecture.md) for full system architecture diagram.
