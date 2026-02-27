import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username phải ít nhất 3 ký tự")
    .max(30, "Username tối đa 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số, và gạch dưới"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Password phải ít nhất 8 ký tự").max(128),
  displayName: z.string().max(50).optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1, "Username hoặc email không được để trống"),
  password: z.string().min(1, "Password không được để trống"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Mã OTP gồm 6 chữ số"),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
  type: z.enum(["verify_email", "reset_password"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Mã OTP gồm 6 chữ số"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8, "Mật khẩu mới phải ít nhất 8 ký tự").max(128),
});

export type RegisterInput       = z.infer<typeof registerSchema>;
export type LoginInput          = z.infer<typeof loginSchema>;
export type VerifyEmailInput    = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>;
