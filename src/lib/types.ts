export type Env = {
  DB: D1Database;
  hiu_kv: KVNamespace;
  hiu_media: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  // SMTP
  SMTP_HOST: string;
  SMTP_PORT: string;       // "465" hoặc "587"
  SMTP_USERNAME: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;       // VD: "Hiu <noreply@hieumoi.online>"
};

export interface JWTPayload {
  sub: string;      // user id
  username: string;
  isAdmin: boolean;
  exp: number;
}
