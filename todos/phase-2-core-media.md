# Phase 2 — Core Media: Upload & Playback

**Mục tiêu**: Upload nhạc, ảnh lên R2. Nghe nhạc, xem ảnh hoạt động.

**Trạng thái**: ⏳ Pending

**Phụ thuộc**: Phase 1 hoàn thành

---

## 2.1 Tracks (Nhạc)

- [x] `POST /api/tracks` — upload audio file lên R2
- [x] `GET /api/tracks` — danh sách tracks công khai (pagination)
- [x] `GET /api/tracks/:id` — chi tiết track + tăng play count
- [x] `DELETE /api/tracks/:id` — xóa track + xóa file R2
- [x] `GET /api/tracks/:id/comments` — danh sách comments
- [x] `POST /api/tracks/:id/comments` — thêm comment
- [ ] `PUT /api/tracks/:id` — cập nhật title, artist, genre, isPublic
- [ ] Validate audio duration khi upload (parse metadata)
- [ ] Thumbnail auto-generate từ waveform (optional, phase 4)

## 2.2 Photos (Ảnh)

- [x] `POST /api/photos` — upload ảnh lên R2
- [x] `GET /api/photos` — danh sách ảnh công khai (pagination)
- [x] `GET /api/photos/:id` — chi tiết ảnh
- [x] `DELETE /api/photos/:id` — xóa ảnh + xóa file R2
- [x] `GET /api/photos/:id/comments` — comments
- [x] `POST /api/photos/:id/comments` — thêm comment
- [ ] `PUT /api/photos/:id` — cập nhật caption, location, isPublic
- [ ] Resize ảnh trước khi lưu (dùng Cloudflare Images hoặc sharp trong Worker)

## 2.3 Albums

- [x] `POST /api/albums` — tạo album (music hoặc photo)
- [x] `GET /api/albums` — danh sách albums
- [x] `GET /api/albums/:id` — chi tiết album + danh sách tracks/photos
- [x] `DELETE /api/albums/:id` — xóa album
- [x] `POST /api/albums/:id/tracks` — thêm track vào album
- [ ] `DELETE /api/albums/:id/tracks/:trackId` — xóa track khỏi album
- [ ] `PUT /api/albums/:id` — cập nhật title, description, isPublic
- [ ] `POST /api/albums/:id/cover` — upload ảnh bìa album
- [ ] `PUT /api/albums/:id/tracks/reorder` — sắp xếp lại thứ tự track

## 2.4 Playlists

- [x] `POST /api/playlists` — tạo playlist
- [x] `GET /api/playlists` — danh sách playlists
- [x] `GET /api/playlists/:id` — chi tiết playlist + tracks
- [x] `DELETE /api/playlists/:id` — xóa playlist
- [x] `POST /api/playlists/:id/tracks` — thêm track
- [ ] `DELETE /api/playlists/:id/tracks/:trackId` — xóa track
- [ ] `PUT /api/playlists/:id` — cập nhật title, isPublic
- [ ] `PUT /api/playlists/:id/tracks/reorder` — sắp xếp track

## 2.5 Services còn thiếu

- [ ] Tách `albums.service.ts` từ route (hiện nay logic nằm trong route)
- [ ] Tách `playlists.service.ts` từ route
- [ ] Thêm `users.service.ts`: update profile, upload avatar

## 2.6 Storage

- [x] Upload audio (max 50MB): mp3, wav, ogg, flac, aac
- [x] Upload ảnh (max 10MB): jpeg, png, webp, gif
- [x] Xóa file R2 khi xóa record DB
- [ ] Cấu hình R2 public domain `media.hieumoi.online`
- [ ] Presigned URL cho private files (nếu cần)

---

## Definition of Done
- [ ] Upload nhạc → stream nghe được qua URL public
- [ ] Upload ảnh → hiển thị được
- [ ] CRUD đầy đủ cho tracks, photos, albums, playlists
- [ ] Tất cả services tách biệt khỏi routes
