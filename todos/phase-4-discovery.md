# Phase 4 — Discovery & Search

**Mục tiêu**: Người dùng khám phá nội dung qua search, trending, explore.

**Trạng thái**: ⏳ Pending

**Phụ thuộc**: Phase 3 hoàn thành

---

## 4.1 Search

File hiện có: `src/routes/search.ts` (còn trống hoặc stub)

- [ ] `GET /api/search?q=&type=all|tracks|photos|users&limit=&cursor=` — full-text search
  - Tìm tracks theo title, artist, genre
  - Tìm photos theo caption, location
  - Tìm users theo username, displayName
  - Trả về kết quả gộp theo type với pagination
- [ ] Implement search logic trong `search.ts` dùng SQL `LIKE` (D1 không có FTS5 enabled sẵn)
- [ ] Cache kết quả search phổ biến vào KV (TTL 5 phút)
- [ ] `GET /api/search/suggestions?q=` — gợi ý khi gõ (top 5 username + track titles)

## 4.2 Trending

- [ ] `GET /api/trending/tracks` — tracks hot nhất trong 7 ngày (sort: plays + likes × 2)
- [ ] `GET /api/trending/photos` — ảnh hot nhất trong 7 ngày (sort: likesCount)
- [ ] `GET /api/trending/users` — users được follow nhiều nhất tuần này
- [ ] Cache trending vào KV (TTL 30 phút, key: `trending:tracks`, `trending:photos`)

## 4.3 Explore / Discover

- [ ] `GET /api/explore` — mixed feed gồm trending tracks + trending photos (không cần auth)
- [ ] `GET /api/explore/genres` — danh sách genres có tracks (distinct từ DB)
- [ ] `GET /api/explore/tracks?genre=` — filter tracks theo genre
- [ ] `GET /api/tracks?sort=popular|recent|plays` — extend endpoint hiện có thêm sort options

## 4.4 User Content Listing

- [ ] `GET /api/users/:username/tracks` — tracks công khai của user
- [ ] `GET /api/users/:username/photos` — ảnh công khai của user
- [ ] `GET /api/users/:username/albums` — albums công khai của user
- [ ] `GET /api/users/:username/playlists` — playlists công khai của user
- [ ] `GET /api/users/:username/liked` — nội dung user đã like (nếu profile public)

## 4.5 Pagination chuẩn hóa

- [ ] Thống nhất cursor-based pagination cho tất cả list endpoints
  - Query params: `cursor` (base64 encode `{id, createdAt}`), `limit` (default 20, max 100)
  - Response shape: `{ data: [...], nextCursor: string | null, hasMore: boolean }`
- [ ] Tạo helper `src/lib/pagination.ts`: encode/decode cursor, build query

---

## Definition of Done

- [ ] Search trả kết quả đúng với q=, type=, pagination
- [ ] Trending hoạt động và có cache KV
- [ ] User content listing đầy đủ theo username
- [ ] Tất cả list endpoints dùng cursor pagination chuẩn
