# Phase 5 — Admin & Moderation

**Mục tiêu**: Quản lý nội dung, user, và hệ thống qua admin API.

**Trạng thái**: ⏳ Pending

**Phụ thuộc**: Phase 4 hoàn thành

---

## 5.1 Admin Middleware

- [ ] Tạo `src/middleware/admin.ts` — kiểm tra `user.isAdmin === true`
- [ ] Apply vào tất cả routes `/api/admin/*`
- [ ] Seed user admin đầu tiên qua migration hoặc script

## 5.2 User Management

- [ ] `GET /api/admin/users` — danh sách tất cả users (kể cả private), filter + search
- [ ] `GET /api/admin/users/:id` — chi tiết user + stats (tracks, photos, likes, follows)
- [ ] `PUT /api/admin/users/:id` — cập nhật isAdmin, suspend user
- [ ] `DELETE /api/admin/users/:id` — xóa user + tất cả content (tracks, photos, R2 files)
- [ ] `POST /api/admin/users/:id/reset-password` — reset mật khẩu user

## 5.3 Content Moderation

- [ ] `GET /api/admin/tracks` — tất cả tracks, filter: isPublic, userId, genre
- [ ] `DELETE /api/admin/tracks/:id` — xóa track vi phạm + file R2
- [ ] `GET /api/admin/photos` — tất cả photos, filter: isPublic, userId
- [ ] `DELETE /api/admin/photos/:id` — xóa ảnh vi phạm + file R2
- [ ] `GET /api/admin/comments` — tất cả comments, filter theo targetType
- [ ] `DELETE /api/admin/comments/:id` — xóa comment vi phạm

## 5.4 Reports (Báo cáo vi phạm)

- [ ] Schema: `reports` table (`id`, `reporterId`, `targetType`, `targetId`, `reason`, `status`, `createdAt`)
- [ ] `POST /api/reports` — user báo cáo track/photo/comment vi phạm
- [ ] `GET /api/admin/reports` — danh sách reports, filter: status=pending|reviewed|dismissed
- [ ] `PUT /api/admin/reports/:id` — cập nhật status + action (dismiss hoặc remove content)

## 5.5 Stats Dashboard

- [ ] `GET /api/admin/stats` — tổng quan:
  - totalUsers, newUsersToday, newUsers7d
  - totalTracks, totalPhotos, totalComments, totalLikes
  - storageUsed (R2, ước tính từ fileSize trong DB)
  - topTracks (top 10 plays), topUsers (top 10 followers)
- [ ] Cache stats vào KV (TTL 5 phút)

## 5.6 Notifications (nâng cao từ Phase 3)

- [ ] Hoàn thiện `notifications` table migration (nếu chưa có)
- [ ] Tự động tạo notification khi: like, comment, follow mới
- [ ] `GET /api/notifications` — danh sách notifications (auth required)
- [ ] `PUT /api/notifications/read-all` — đánh dấu tất cả đã đọc
- [ ] `DELETE /api/notifications/:id` — xóa notification

---

## Definition of Done

- [ ] Admin routes có middleware kiểm tra isAdmin
- [ ] CRUD đầy đủ cho user management qua admin API
- [ ] Report flow hoạt động end-to-end
- [ ] Stats endpoint trả dữ liệu đúng và có cache
