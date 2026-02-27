---
name: hono-cloudflare
description: Build and maintain Hono API on Cloudflare Workers. Use when creating routes, middleware, adding endpoints, configuring wrangler.toml, handling CORS, or deploying to Cloudflare. Project uses Hono v4 with TypeScript, D1, KV, and R2 bindings.
license: MIT
compatibility: Designed for Claude Code. Requires Node.js, wrangler CLI, Cloudflare account.
metadata:
  author: hiu
  version: "1.0"
  project: hiu-api
allowed-tools: Bash Read Write Edit Glob Grep
---

# Hono + Cloudflare Workers Skill

## Project Context

This is the backend API for the Hiu platform — a music/photo/video sharing platform.

- **Location**: `d:/Code/hiu/api/`
- **Entry point**: `src/index.ts`
- **Runtime**: Cloudflare Workers (edge)
- **Framework**: Hono v4

## Bindings (wrangler.toml)

| Binding | Type | Variable |
|---|---|---|
| `DB` | D1 Database | `c.env.DB` |
| `hiu_kv` | KV Namespace | `c.env.hiu_kv` |
| `hiu_media` | R2 Bucket | `c.env.hiu_media` |
| `JWT_SECRET` | Var | `c.env.JWT_SECRET` |
| `FRONTEND_URL` | Var | `c.env.FRONTEND_URL` |

## Env Type

Always import from `src/lib/types.ts`:

```typescript
import type { Env } from "../lib/types";
```

## Route Pattern

```typescript
import { Hono } from "hono";
import type { Env } from "../lib/types";

export const myRoutes = new Hono<{ Bindings: Env; Variables: { user: any } }>();

myRoutes.get("/", async (c) => {
  return c.json({ data: [] });
});
```

Register in `src/index.ts`:
```typescript
app.route("/api/my-resource", myRoutes);
```

## Auth Middleware

```typescript
import { authMiddleware } from "../middleware/auth";

// Protected route
myRoutes.post("/", authMiddleware, async (c) => {
  const user = c.get("user"); // { sub, username, isAdmin, exp }
});
```

## Dev Commands

```bash
cd d:/Code/hiu/api
npm run dev          # → http://localhost:8787
npm run deploy       # deploy to Cloudflare
npm run db:migrate   # apply D1 migrations (local)
```

## Response Conventions

- Success: `c.json({ data }, 200)`
- Created: `c.json({ ...resource }, 201)`
- Error: `c.json({ error: "message" }, 4xx)`
- Pagination: `c.json({ items, page, limit })`

## CORS

Already configured globally in `src/index.ts` for `FRONTEND_URL` and `localhost:3000`. No need to add CORS per-route.

## Common Patterns

See [references/patterns.md](references/patterns.md) for pagination, validation, and error handling patterns.
