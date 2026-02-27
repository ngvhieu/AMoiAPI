# Phase 1 — Foundation: Setup & Auth

**Mục tiêu**: Dự án chạy được local, auth hoạt động end-to-end.

**Trạng thái**: 🔧 In Progress

---

## 1.1 Project Setup

- [x] Khởi tạo Hono project
- [x] Cấu hình `wrangler.toml` với D1/KV/R2 IDs
- [x] Cấu hình `tsconfig.json`
- [x] Cấu hình `drizzle.config.ts`
- [ ] `npm install` — cài dependencies
- [ ] Chạy `wrangler dev` thành công

## 1.2 Database

- [x] Định nghĩa schema: users, tracks, photos, albums, playlists, likes, comments, follows, refresh_tokens
- [x] Cấu hình Drizzle ORM
- [ ] `npx drizzle-kit generate` — tạo migration SQL
- [ ] `npm run db:migrate` — apply vào D1 local
- [ ] `npm run db:migrate:prod` — apply vào D1 production

## 1.3 Auth

- [x] `POST /api/auth/register` — đăng ký
- [x] `POST /api/auth/login` — đăng nhập, trả access + refresh token
- [x] `POST /api/auth/refresh` — làm mới access token
- [x] `DELETE /api/auth/logout` — xóa refresh token
- [x] JWT sign/verify bằng Web Crypto (HMAC SHA-256)
- [x] Hash password bằng PBKDF2 (100k iterations)
- [x] Zod validation cho register/login
- [x] Rate limiting cho auth routes (10 req/min)
- [ ] Test register → login → refresh → logout flow

## 1.6 OTP — Xác thực email & Quên mật khẩu

### Schema
- [ ] Thêm bảng `otp_codes` vào schema Drizzle:
  ```ts
  otp_codes: { id, userId, email, code (6 số), type (verify_email | reset_password), expiresAt, usedAt, createdAt }
  ```
- [ ] Thêm cột `isEmailVerified: boolean` vào bảng `users`
- [ ] Chạy migration

### Gửi email (Resend)
- [ ] Thêm binding `RESEND_API_KEY` vào `wrangler.toml` (secret)
- [ ] Tạo `src/lib/email.ts` — helper gửi email qua Resend API:
  - `sendOtpEmail(to, code, type)` — template HTML đẹp cho OTP
  - `sendWelcomeEmail(to, displayName)` — gửi sau khi verify thành công
- [ ] OTP: 6 chữ số ngẫu nhiên, TTL 10 phút, tối đa 3 lần gửi/giờ

### Endpoints xác thực đăng ký
- [ ] `POST /api/auth/register` — sau khi tạo user, tự động gửi OTP verify email
- [ ] `POST /api/auth/verify-email` — nhận `{ email, code }`, verify OTP, set `isEmailVerified = true`
- [ ] `POST /api/auth/resend-otp` — gửi lại OTP (rate limit: 3 lần/giờ/email)
- [ ] Block login nếu `isEmailVerified = false` (trả 403 kèm thông báo rõ)

### Endpoints quên mật khẩu
- [ ] `POST /api/auth/forgot-password` — nhận `{ email }`, gửi OTP reset password
  - Không tiết lộ email có tồn tại hay không (luôn trả 200)
  - Rate limit: 3 request/giờ/IP
- [ ] `POST /api/auth/verify-reset-otp` — nhận `{ email, code }`, trả `resetToken` (JWT ngắn hạn 15 phút)
- [ ] `POST /api/auth/reset-password` — nhận `{ resetToken, newPassword }`, đổi mật khẩu, revoke tất cả refresh tokens của user
- [ ] Sau reset: gửi email thông báo mật khẩu vừa được đổi

### Bảo mật OTP
- [ ] OTP chỉ dùng 1 lần — set `usedAt` sau khi verify thành công
- [ ] Xóa OTP cũ cùng loại khi tạo OTP mới cho cùng email
- [ ] Rate limit riêng cho `/verify-email` và `/verify-reset-otp`: 5 lần sai/15 phút → block

## 1.4 Middleware

- [x] Auth middleware (JWT verify)
- [x] Rate limiting middleware (auth/upload/api presets)
- [x] CORS middleware
- [x] Error handler global (AppError hierarchy)
- [ ] Request logging kiểm tra ok

## 1.5 User Profile

- [x] `GET /api/users/:username` — xem profile + stats
- [ ] `GET /api/users/me` — xem profile bản thân (cần auth)
- [ ] `PUT /api/users/me` — cập nhật displayName, bio
- [ ] `POST /api/users/me/avatar` — upload avatar lên R2
- [ ] `DELETE /api/users/me` — xóa tài khoản

---

## Definition of Done
- [ ] Tất cả auth endpoints hoạt động với Postman/curl
- [ ] Migration chạy thành công trên D1 local
- [ ] `wrangler dev` không có lỗi TypeScript
- [ ] Flow đăng ký → nhận OTP email → verify → đăng nhập thành công
- [ ] Flow quên mật khẩu → nhận OTP → verify → đổi mật khẩu → đăng nhập bằng mật khẩu mới
