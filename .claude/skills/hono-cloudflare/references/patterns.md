# Hono + Cloudflare Patterns Reference

## Pagination

```typescript
const page = parseInt(c.req.query("page") ?? "1");
const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 50);
const offset = (page - 1) * limit;

const results = await db.query.myTable.findMany({ limit, offset, orderBy: desc(myTable.createdAt) });
return c.json({ items: results, page, limit });
```

## Input Validation

```typescript
const body = await c.req.json<{ title: string; content?: string }>();
if (!body.title?.trim()) return c.json({ error: "title is required" }, 400);
```

## FormData (file upload)

```typescript
const form = await c.req.formData();
const file = form.get("file") as File | null;
if (!file) return c.json({ error: "file required" }, 400);
```

## Owner check

```typescript
const user = c.get("user");
const item = await db.query.items.findFirst({ where: eq(items.id, id) });
if (!item) return c.json({ error: "Not found" }, 404);
if (item.userId !== user.sub && !user.isAdmin) return c.json({ error: "Forbidden" }, 403);
```

## KV Cache

```typescript
const cached = await c.env.hiu_kv.get("key");
if (cached) return c.json(JSON.parse(cached));
// ... fetch data ...
await c.env.hiu_kv.put("key", JSON.stringify(data), { expirationTtl: 300 });
```
