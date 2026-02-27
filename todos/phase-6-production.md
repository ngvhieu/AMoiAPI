# Phase 6 — Performance & Production

**Mục tiêu**: Tối ưu hiệu năng, bảo mật, và deploy production ổn định.

**Trạng thái**: ⏳ Pending

**Phụ thuộc**: Phase 5 hoàn thành

---

## 6.1 Caching Strategy

- [ ] Chuẩn hóa KV cache helper (`src/lib/kv.ts`):
  - `getOrSet(key, ttl, fetchFn)` — get-or-compute pattern
  - `invalidate(key | prefix)` — xóa cache khi data thay đổi
- [ ] Cache feed cá nhân: key `feed:{userId}`, TTL 2 phút
- [ ] Cache trending: key `trending:tracks`, TTL 30 phút
- [ ] Cache user profile public: key `profile:{username}`, TTL 5 phút, invalidate sau update
- [ ] Cache search suggestions: key `suggest:{q}`, TTL 5 phút

## 6.2 R2 & Storage

- [ ] Cấu hình R2 custom domain `media.hieumoi.online` trong Cloudflare dashboard
- [ ] Cập nhật `r2.ts` helper: build public URL từ custom domain thay vì presigned URL
- [ ] Tách R2 key prefix rõ ràng: `audio/`, `photos/`, `covers/`, `avatars/`
- [ ] Kiểm tra và xóa orphaned files (R2 files không có record DB tương ứng)
- [ ] Giới hạn storage per user (optional): track tổng fileSize trong users table

## 6.3 Security Hardening

- [ ] Chuyển `JWT_SECRET` sang Cloudflare Secrets (`wrangler secret put JWT_SECRET`)
- [ ] Thêm `Content-Security-Policy` header
- [ ] Validate MIME type phía server (đọc magic bytes thay vì tin Content-Type header)
- [ ] Rate limiting mở rộng: per-user (dùng KV key `ratelimit:{userId}:{route}`)
- [ ] Thêm `X-Request-ID` header cho tất cả responses (debug log)
- [ ] CORS: chỉ cho phép origins đã cấu hình (`FRONTEND_URL`)

## 6.4 Error Handling & Logging

- [ ] Request logger middleware ghi ra: method, path, status, duration, userId
- [ ] Structured error responses nhất quán: `{ error: { code, message, details? } }`
- [ ] Sentry hoặc Cloudflare Workers Logpush cho production errors
- [ ] Phân biệt lỗi 4xx (client) vs 5xx (server) trong error handler

## 6.5 Testing

- [ ] Setup Vitest với `@cloudflare/vitest-pool-workers`
- [ ] Unit tests cho services: `auth.service`, `tracks.service`, `photos.service`
- [ ] Integration tests cho routes chính: auth flow, upload, like, follow, feed
- [ ] Test coverage mục tiêu: ≥ 60% cho services

## 6.6 CI/CD & Deployment

- [ ] GitHub Actions workflow: lint + typecheck + test on PR
- [ ] Auto-deploy lên Cloudflare Workers khi merge vào `main`
- [ ] Staging environment: `wrangler.staging.toml` với D1/KV/R2 riêng
- [ ] Migration script an toàn: backup D1 trước khi apply migration production
- [ ] Health check endpoint `GET /health` — trả status DB + KV + R2

## 6.7 API Documentation

- [ ] Viết OpenAPI spec (`openapi.yaml`) cho tất cả endpoints
- [ ] Setup Scalar hoặc Swagger UI tại `/docs` (Hono có built-in support)
- [ ] Changelog: ghi lại breaking changes giữa các versions

---

## Definition of Done

- [ ] Deploy production không có lỗi TypeScript + runtime
- [ ] JWT_SECRET là Cloudflare Secret, không hardcode
- [ ] R2 custom domain hoạt động, file accessible public
- [ ] CI/CD chạy auto trên GitHub Actions
- [ ] Health check endpoint trả 200
