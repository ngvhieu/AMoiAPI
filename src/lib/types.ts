export type Env = {
  DB: D1Database;
  hiu_kv: KVNamespace;
  hiu_media: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
};

export interface JWTPayload {
  sub: string;      // user id
  username: string;
  isAdmin: boolean;
  exp: number;
}
