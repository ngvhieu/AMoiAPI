# Phase 3 — Social Features

**Mục tiêu**: Like, comment, follow, feed cá nhân hóa.

**Trạng thái**: ⏳ Pending

**Phụ thuộc**: Phase 2 hoàn thành

---

## 3.1 Likes

- [x] `POST /api/tracks/:id/like` — toggle like track
- [x] `POST /api/photos/:id/like` — toggle like ảnh
- [ ] `POST /api/albums/:id/like` — toggle like album
- [ ] `GET /api/users/me/likes` — danh sách đã like (tracks + photos)
- [ ] Trả về `liked: true/false` + `likesCount` mới sau mỗi toggle

## 3.2 Comments

- [x] `GET /api/tracks/:id/comments` — danh sách comments
- [x] `POST /api/tracks/:id/comments` — thêm comment
- [x] `GET /api/photos/:id/comments` — danh sách comments
- [x] `POST /api/photos/:id/comments` — thêm comment
- [ ] `DELETE /api/comments/:id` — xóa comment (owner hoặc admin)
- [ ] Reply comments (comment lồng nhau, depth = 1)
- [ ] Pagination cho comments

## 3.3 Follows

- [x] `POST /api/users/:username/follow` — toggle follow user
- [x] `GET /api/feed` — feed tracks từ người đang follow
- [ ] `GET /api/users/:username/followers` — danh sách followers
- [ ] `GET /api/users/:username/following` — danh sách đang follow
- [ ] `GET /api/users/me/feed` — feed cá nhân (tracks + photos)
- [ ] Notification khi có follower mới (KV queue → phase 5)

## 3.4 Notifications (basic)

- [ ] Schema: `notifications` table (userId, type, actorId, targetType, targetId, read, createdAt)
- [ ] Tạo notification khi: like, comment, follow
- [ ] `GET /api/notifications` — danh sách notifications chưa đọc
- [ ] `PUT /api/notifications/read-all` — đánh dấu đã đọc
- [ ] `DELETE /api/notifications/:id` — xóa notification

## 3.5 Activity Feed

- [x] `GET /api/feed` — tracks từ following (đã có cơ bản)
- [ ] Mở rộng feed gồm cả photos
- [ ] Feed mixed (tracks + photos) sắp xếp theo thời gian
- [ ] "Trending" feed — sort theo plays + likes trong 7 ngày
- [ ] Cache feed bằng KV (TTL 2 phút)

---

## Definition of Done
- [ ] Like/unlike hoạt động, đếm chính xác
- [ ] Comment CRUD hoạt động
- [ ] Follow/unfollow, feed cá nhân hoạt động
- [ ] Notification cơ bản hoạt động
