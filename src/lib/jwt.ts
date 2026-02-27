import type { JWTPayload } from "./types";

const ALGO = { name: "HMAC", hash: "SHA-256" } as const;

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALGO,
    false,
    ["sign", "verify"],
  );
}

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeB64url(s: string): string {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function signJWT(
  payload: Omit<JWTPayload, "exp">,
  secret: string,
  expiresInSeconds = 3600, // 1h
): Promise<string> {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(
    new TextEncoder().encode(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
    ),
  );
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(ALGO, key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const [header, body, sig] = token.split(".");
  if (!header || !body || !sig) throw new Error("Invalid token format");

  const key = await getKey(secret);
  const valid = await crypto.subtle.verify(
    ALGO,
    key,
    Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
    new TextEncoder().encode(`${header}.${body}`),
  );
  if (!valid) throw new Error("Invalid signature");

  const payload = JSON.parse(decodeB64url(body)) as JWTPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256,
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256,
  );
  const computed = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === hashHex;
}

export function nanoid(size = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}
