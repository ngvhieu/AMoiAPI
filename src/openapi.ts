export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Hiu API",
    version: "1.0.0",
    description: "API cho nền tảng nghe nhạc và chia sẻ ảnh Hiu",
  },
  servers: [{ url: "/api", description: "API base" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page:  { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
        },
      },
      User: {
        type: "object",
        properties: {
          id:          { type: "string" },
          username:    { type: "string" },
          displayName: { type: "string" },
          bio:         { type: "string", nullable: true },
          avatarUrl:   { type: "string", nullable: true },
          isVerified:  { type: "boolean" },
          createdAt:   { type: "string", format: "date-time" },
        },
      },
      Track: {
        type: "object",
        properties: {
          id:        { type: "string" },
          title:     { type: "string" },
          artist:    { type: "string", nullable: true },
          genre:     { type: "string", nullable: true },
          fileUrl:   { type: "string" },
          coverUrl:  { type: "string", nullable: true },
          isPublic:  { type: "boolean" },
          userId:    { type: "string" },
          albumId:   { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Photo: {
        type: "object",
        properties: {
          id:        { type: "string" },
          url:       { type: "string" },
          caption:   { type: "string", nullable: true },
          location:  { type: "string", nullable: true },
          isPublic:  { type: "boolean" },
          userId:    { type: "string" },
          albumId:   { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Album: {
        type: "object",
        properties: {
          id:          { type: "string" },
          title:       { type: "string" },
          description: { type: "string", nullable: true },
          isPublic:    { type: "boolean" },
          userId:      { type: "string" },
          createdAt:   { type: "string", format: "date-time" },
        },
      },
      Playlist: {
        type: "object",
        properties: {
          id:          { type: "string" },
          name:        { type: "string" },
          description: { type: "string", nullable: true },
          isPublic:    { type: "boolean" },
          userId:      { type: "string" },
          createdAt:   { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id:        { type: "string" },
          content:   { type: "string" },
          userId:    { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken:  { type: "string" },
          refreshToken: { type: "string" },
          user:         { $ref: "#/components/schemas/User" },
        },
      },
    },
  },
  paths: {
    // ─── Auth ─────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", minLength: 3, maxLength: 30 },
                  email:    { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Đăng ký thành công, OTP gửi qua email" },
          400: { description: "Dữ liệu không hợp lệ", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email:    { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Đăng nhập thành công",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokens" } } },
          },
          400: { description: "Sai email hoặc mật khẩu" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "Xác thực email bằng OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string", format: "email" },
                  code:  { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Xác thực thành công" },
          400: { description: "OTP không hợp lệ hoặc đã hết hạn" },
        },
      },
    },
    "/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Gửi lại OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "type"],
                properties: {
                  email: { type: "string", format: "email" },
                  type:  { type: "string", enum: ["verify", "reset"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP đã được gửi lại" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Quên mật khẩu — gửi OTP reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP reset đã gửi qua email" },
        },
      },
    },
    "/auth/verify-reset-otp": {
      post: {
        tags: ["Auth"],
        summary: "Xác minh OTP reset mật khẩu",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string", format: "email" },
                  code:  { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Trả về resetToken", content: { "application/json": { schema: { type: "object", properties: { resetToken: { type: "string" } } } } } },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Đặt lại mật khẩu",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["resetToken", "newPassword"],
                properties: {
                  resetToken:  { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Đổi mật khẩu thành công" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Làm mới access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Trả về access token mới", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokens" } } } },
        },
      },
    },
    "/auth/logout": {
      delete: {
        tags: ["Auth"],
        summary: "Đăng xuất",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Đăng xuất thành công" },
        },
      },
    },

    // ─── Tracks ───────────────────────────────────────────────────────────────
    "/tracks": {
      get: {
        tags: ["Tracks"],
        summary: "Danh sách track công khai",
        parameters: [
          { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/Pagination" },
                    { type: "object", properties: { tracks: { type: "array", items: { $ref: "#/components/schemas/Track" } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Tracks"],
        summary: "Upload track mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "title"],
                properties: {
                  file:     { type: "string", format: "binary", description: "File audio" },
                  cover:    { type: "string", format: "binary", description: "Ảnh cover (tùy chọn)" },
                  title:    { type: "string" },
                  artist:   { type: "string" },
                  genre:    { type: "string" },
                  albumId:  { type: "string" },
                  isPublic: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Track đã được tạo", content: { "application/json": { schema: { $ref: "#/components/schemas/Track" } } } },
          401: { description: "Chưa xác thực" },
        },
      },
    },
    "/tracks/{id}": {
      get: {
        tags: ["Tracks"],
        summary: "Lấy thông tin track",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Track" } } } },
          404: { description: "Không tìm thấy" },
        },
      },
      delete: {
        tags: ["Tracks"],
        summary: "Xóa track",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Xóa thành công" },
          403: { description: "Không có quyền" },
        },
      },
    },
    "/tracks/{id}/like": {
      post: {
        tags: ["Tracks"],
        summary: "Like / unlike track",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Trạng thái like", content: { "application/json": { schema: { type: "object", properties: { liked: { type: "boolean" } } } } } },
        },
      },
    },
    "/tracks/{id}/comments": {
      get: {
        tags: ["Tracks"],
        summary: "Lấy danh sách comment của track",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } } } } } } },
        },
      },
      post: {
        tags: ["Tracks"],
        summary: "Thêm comment vào track",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["content"], properties: { content: { type: "string", minLength: 1 } } },
            },
          },
        },
        responses: {
          201: { description: "Comment đã được tạo" },
        },
      },
    },

    // ─── Photos ───────────────────────────────────────────────────────────────
    "/photos": {
      get: {
        tags: ["Photos"],
        summary: "Danh sách ảnh công khai",
        parameters: [
          { name: "page",   in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit",  in: "query", schema: { type: "integer", default: 20 } },
          { name: "userId", in: "query", schema: { type: "string" }, description: "Lọc theo user" },
        ],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { photos: { type: "array", items: { $ref: "#/components/schemas/Photo" } } } } } } },
        },
      },
      post: {
        tags: ["Photos"],
        summary: "Upload ảnh mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file:     { type: "string", format: "binary" },
                  caption:  { type: "string" },
                  location: { type: "string" },
                  albumId:  { type: "string" },
                  isPublic: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Ảnh đã được upload", content: { "application/json": { schema: { $ref: "#/components/schemas/Photo" } } } },
        },
      },
    },
    "/photos/{id}": {
      get: {
        tags: ["Photos"],
        summary: "Lấy thông tin ảnh",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Photo" } } } },
        },
      },
      delete: {
        tags: ["Photos"],
        summary: "Xóa ảnh",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Xóa thành công" },
        },
      },
    },
    "/photos/{id}/like": {
      post: {
        tags: ["Photos"],
        summary: "Like / unlike ảnh",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Trạng thái like" },
        },
      },
    },
    "/photos/{id}/comments": {
      get: {
        tags: ["Photos"],
        summary: "Lấy comment của ảnh",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK" },
        },
      },
      post: {
        tags: ["Photos"],
        summary: "Thêm comment vào ảnh",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["content"], properties: { content: { type: "string" } } },
            },
          },
        },
        responses: {
          201: { description: "Comment đã được tạo" },
        },
      },
    },

    // ─── Users ────────────────────────────────────────────────────────────────
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Lấy thông tin bản thân",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Cập nhật profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: "string", minLength: 1, maxLength: 50 },
                  bio:         { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật thành công" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Xóa tài khoản",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Tài khoản đã bị xóa" },
        },
      },
    },
    "/users/me/avatar": {
      post: {
        tags: ["Users"],
        summary: "Upload avatar",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Avatar đã được cập nhật" },
        },
      },
    },
    "/users/{username}": {
      get: {
        tags: ["Users"],
        summary: "Xem profile người dùng",
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "Không tìm thấy" },
        },
      },
    },
    "/users/{username}/tracks": {
      get: {
        tags: ["Users"],
        summary: "Tracks của người dùng",
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { tracks: { type: "array", items: { $ref: "#/components/schemas/Track" } } } } } } },
        },
      },
    },
    "/users/{username}/photos": {
      get: {
        tags: ["Users"],
        summary: "Ảnh của người dùng",
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { photos: { type: "array", items: { $ref: "#/components/schemas/Photo" } } } } } } },
        },
      },
    },
    "/users/{username}/follow": {
      post: {
        tags: ["Users"],
        summary: "Follow / unfollow người dùng",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Trạng thái follow", content: { "application/json": { schema: { type: "object", properties: { following: { type: "boolean" } } } } } },
        },
      },
    },

    // ─── Albums ───────────────────────────────────────────────────────────────
    "/albums": {
      get: {
        tags: ["Albums"],
        summary: "Danh sách album công khai",
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { albums: { type: "array", items: { $ref: "#/components/schemas/Album" } } } } } } },
        },
      },
      post: {
        tags: ["Albums"],
        summary: "Tạo album mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title:       { type: "string" },
                  description: { type: "string" },
                  isPublic:    { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Album đã tạo", content: { "application/json": { schema: { $ref: "#/components/schemas/Album" } } } },
        },
      },
    },
    "/albums/{id}": {
      get: {
        tags: ["Albums"],
        summary: "Lấy album kèm danh sách track",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK" },
          404: { description: "Không tìm thấy" },
        },
      },
      delete: {
        tags: ["Albums"],
        summary: "Xóa album",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Xóa thành công" },
        },
      },
    },
    "/albums/{id}/tracks": {
      post: {
        tags: ["Albums"],
        summary: "Thêm track vào album",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["trackId"],
                properties: {
                  trackId:  { type: "string" },
                  position: { type: "integer", default: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Track đã được thêm vào album" },
        },
      },
    },

    // ─── Playlists ────────────────────────────────────────────────────────────
    "/playlists": {
      get: {
        tags: ["Playlists"],
        summary: "Danh sách playlist công khai",
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { playlists: { type: "array", items: { $ref: "#/components/schemas/Playlist" } } } } } } },
        },
      },
      post: {
        tags: ["Playlists"],
        summary: "Tạo playlist mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name:        { type: "string" },
                  description: { type: "string" },
                  isPublic:    { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Playlist đã tạo" },
        },
      },
    },
    "/playlists/{id}": {
      get: {
        tags: ["Playlists"],
        summary: "Lấy playlist kèm danh sách track",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK" },
        },
      },
      delete: {
        tags: ["Playlists"],
        summary: "Xóa playlist",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Xóa thành công" },
        },
      },
    },
    "/playlists/{id}/tracks": {
      post: {
        tags: ["Playlists"],
        summary: "Thêm track vào playlist",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["trackId"],
                properties: {
                  trackId:  { type: "string" },
                  position: { type: "integer", default: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Track đã được thêm" },
        },
      },
    },

    // ─── Feed ─────────────────────────────────────────────────────────────────
    "/feed": {
      get: {
        tags: ["Feed"],
        summary: "Feed cá nhân — tracks từ người đang follow",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { tracks: { type: "array", items: { $ref: "#/components/schemas/Track" } } } } } } },
          401: { description: "Chưa xác thực" },
        },
      },
    },

    // ─── Search ───────────────────────────────────────────────────────────────
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Tìm kiếm tracks / photos / users",
        parameters: [
          { name: "q",    in: "query", required: true, schema: { type: "string", minLength: 2 }, description: "Từ khóa tìm kiếm" },
          { name: "type", in: "query", schema: { type: "string", enum: ["tracks", "photos", "users"], default: "tracks" } },
        ],
        responses: {
          200: { description: "Kết quả tìm kiếm", content: { "application/json": { schema: { type: "object", properties: { results: { type: "array", items: { type: "object" } } } } } } },
          400: { description: "Query quá ngắn hoặc type không hợp lệ" },
        },
      },
    },
  },
} as const;
