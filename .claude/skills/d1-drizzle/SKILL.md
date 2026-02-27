---
name: d1-drizzle
description: Work with Cloudflare D1 database using Drizzle ORM in the hiu-api project. Use when writing queries, modifying schema, creating migrations, or adding new tables. Schema is in src/db/schema.ts using SQLite dialect.
license: MIT
compatibility: Designed for Claude Code. Requires wrangler CLI and drizzle-kit.
metadata:
  author: hiu
  version: "1.0"
  project: hiu-api
allowed-tools: Bash Read Write Edit Glob Grep
---

# D1 + Drizzle ORM Skill

## Project Context

- **Schema file**: `d:/Code/hiu/api/src/db/schema.ts`
- **DB init**: `d:/Code/hiu/api/src/db/index.ts`
- **Migrations output**: `d:/Code/hiu/api/drizzle/migrations/`
- **Dialect**: SQLite (via Cloudflare D1)
- **D1 ID**: `4561a6c0-cab2-49f0-8ec2-cbf5410a6baa`

## Tables (current schema)

| Table | Description |
|---|---|
| `users` | Auth accounts |
| `albums` | Music or photo albums |
| `tracks` | Audio files (R2 key stored) |
| `album_tracks` | Junction: albums ↔ tracks |
| `photos` | Photo files (R2 key stored) |
| `playlists` | User playlists |
| `playlist_tracks` | Junction: playlists ↔ tracks |
| `likes` | Polymorphic likes (track/photo/album) |
| `comments` | Polymorphic comments (track/photo) |
| `follows` | User follows |
| `refresh_tokens` | JWT refresh tokens |

## Initialize DB in a route

```typescript
import { createDb } from "../db";

const db = createDb(c.env.DB);
```

## Common Query Patterns

**Find one:**
```typescript
const item = await db.query.users.findFirst({
  where: eq(users.id, id),
  columns: { passwordHash: false }, // exclude sensitive fields
});
```

**Find many with pagination:**
```typescript
const results = await db.query.tracks.findMany({
  where: and(eq(tracks.userId, userId), eq(tracks.isPublic, true)),
  orderBy: desc(tracks.createdAt),
  limit, offset,
});
```

**Insert:**
```typescript
await db.insert(users).values({ id: nanoid(), username, email, passwordHash });
```

**Update:**
```typescript
await db.update(tracks)
  .set({ plays: sql`${tracks.plays} + 1` })
  .where(eq(tracks.id, id));
```

**Delete:**
```typescript
await db.delete(likes).where(
  and(eq(likes.userId, userId), eq(likes.targetId, id))
);
```

**Raw count:**
```typescript
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(tracks)
  .where(eq(tracks.userId, userId));
```

## Adding a New Table

1. Add table definition to `src/db/schema.ts`
2. Run `npx drizzle-kit generate` → creates SQL migration
3. Run `npm run db:migrate` for local, `npm run db:migrate:prod` for prod

## Migration Commands

```bash
cd d:/Code/hiu/api
npx drizzle-kit generate          # generate from schema diff
npm run db:migrate                 # apply local
npm run db:migrate:prod            # apply production
npx drizzle-kit studio             # visual DB browser
```

## Schema Conventions

- IDs: `text("id").primaryKey()` using `nanoid()`
- Timestamps: `text("created_at").default(sql\`(datetime('now'))\`)`
- Booleans: `integer("is_public", { mode: "boolean" }).default(true)`
- Foreign keys: always add `.references(() => table.id, { onDelete: "cascade" })`
- Add indexes for all FK columns and frequently filtered columns

See [references/schema.md](references/schema.md) for full schema reference.
