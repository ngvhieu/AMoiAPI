import { Hono } from "hono";
import { createDb } from "../db";
import { AuthService } from "../services/auth.service";
import {
  registerSchema, loginSchema, refreshSchema,
  verifyEmailSchema, resendOtpSchema,
  forgotPasswordSchema, verifyResetOtpSchema, resetPasswordSchema,
} from "../validators/auth";
import { authRateLimit } from "../middleware/rateLimit";
import type { Env } from "../lib/types";

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.use("*", authRateLimit);

function svc(c: any) {
  return new AuthService(createDb(c.env.DB), c.env.JWT_SECRET, c.env.RESEND_API_KEY);
}

authRoutes.post("/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const result = await svc(c).register(parsed.data);
  return c.json(result, 201);
});

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const result = await svc(c).login(parsed.data);
  return c.json(result);
});

authRoutes.post("/verify-email", async (c) => {
  const parsed = verifyEmailSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const result = await svc(c).verifyEmail(parsed.data.email, parsed.data.code);
  return c.json(result);
});

authRoutes.post("/resend-otp", async (c) => {
  const parsed = resendOtpSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const result = await svc(c).resendOtp(parsed.data.email, parsed.data.type);
  return c.json(result);
});

authRoutes.post("/forgot-password", async (c) => {
  const parsed = forgotPasswordSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const result = await svc(c).forgotPassword(parsed.data.email);
  return c.json(result);
});

authRoutes.post("/verify-reset-otp", async (c) => {
  const parsed = verifyResetOtpSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const result = await svc(c).verifyResetOtp(parsed.data.email, parsed.data.code);
  return c.json(result);
});

authRoutes.post("/reset-password", async (c) => {
  const parsed = resetPasswordSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const result = await svc(c).resetPassword(parsed.data.resetToken, parsed.data.newPassword);
  return c.json(result);
});

authRoutes.post("/refresh", async (c) => {
  const parsed = refreshSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "refreshToken required" }, 400);
  const result = await svc(c).refresh(parsed.data.refreshToken);
  return c.json(result);
});

authRoutes.delete("/logout", async (c) => {
  const body = await c.req.json<{ refreshToken?: string }>();
  if (body.refreshToken) await svc(c).logout(body.refreshToken);
  return c.json({ success: true });
});
