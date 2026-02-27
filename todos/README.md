# HIU Platform — Roadmap tổng quan

## Mục tiêu
Xây dựng platform nghe nhạc, chia sẻ ảnh multi-user (kiểu SoundCloud + Instagram).

## Stack
- Backend: Hono + Cloudflare Workers
- Database: D1 (SQLite) + Drizzle ORM
- Storage: R2 (audio, ảnh)
- Cache: KV
- Auth: JWT (PBKDF2)

## Phases

| Phase | Tên | Trạng thái |
|---|---|---|
| 1 | Foundation — Setup & Auth | 🔧 In Progress |
| 2 | Core Media — Upload & Playback | ⏳ Pending |
| 3 | Social Features | ⏳ Pending |
| 4 | Discovery & Search | ⏳ Pending |
| 5 | Admin & Moderation | ⏳ Pending |
| 6 | Performance & Production | ⏳ Pending |

## Files
- [phase-1-foundation.md](./phase-1-foundation.md)
- [phase-2-core-media.md](./phase-2-core-media.md)
- [phase-3-social.md](./phase-3-social.md)
- [phase-4-discovery.md](./phase-4-discovery.md)
- [phase-5-admin.md](./phase-5-admin.md)
- [phase-6-production.md](./phase-6-production.md)
- [bugs.md](./bugs.md)
- [decisions.md](./decisions.md)
