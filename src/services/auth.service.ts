import { eq, or, and } from "drizzle-orm";
import { users, refreshTokens, otpCodes } from "../db/schema";
import { hashPassword, verifyPassword, signJWT, verifyJWT, nanoid } from "../lib/jwt";
import { ConflictError, UnauthorizedError, ForbiddenError, ValidationError } from "../lib/errors";
import { sendOtpEmail, sendWelcomeEmail, sendPasswordChangedEmail } from "../lib/email";
import type { DB } from "../db";
import type { RegisterInput, LoginInput } from "../validators/auth";

function generateOtp(): string {
  const digits = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(digits).map((b) => b % 10).join("");
}

export class AuthService {
  constructor(private db: DB, private jwtSecret: string, private resendApiKey: string) {}

  async register(input: RegisterInput) {
    const existing = await this.db.query.users.findFirst({
      where: or(eq(users.username, input.username), eq(users.email, input.email)),
    });
    if (existing) throw new ConflictError("Username hoặc email đã tồn tại");

    const id = nanoid();
    const passwordHash = await hashPassword(input.password);
    await this.db.insert(users).values({
      id,
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName ?? input.username,
      isEmailVerified: false,
    });

    await this.#sendOtp(id, input.email, "verify_email");
    return { message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản." };
  }

  async login(input: LoginInput) {
    const user = await this.db.query.users.findFirst({
      where: or(eq(users.username, input.login), eq(users.email, input.login)),
    });
    if (!user) throw new UnauthorizedError("Thông tin đăng nhập không đúng");

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Thông tin đăng nhập không đúng");

    if (!user.isEmailVerified) {
      throw new ForbiddenError("Email chưa được xác thực. Vui lòng kiểm tra hộp thư.");
    }

    return {
      ...(await this.#issueTokens(user.id, user.username, user.isAdmin ?? false)),
      user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl },
    };
  }

  async refresh(token: string) {
    const row = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token, token),
    });
    if (!row) throw new UnauthorizedError("Refresh token không hợp lệ");
    if (new Date(row.expiresAt) < new Date()) {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token));
      throw new UnauthorizedError("Refresh token đã hết hạn");
    }

    const user = await this.db.query.users.findFirst({ where: eq(users.id, row.userId) });
    if (!user) throw new UnauthorizedError("User không tồn tại");

    const accessToken = await signJWT(
      { sub: user.id, username: user.username, isAdmin: user.isAdmin ?? false },
      this.jwtSecret, 3600,
    );
    return { accessToken };
  }

  async logout(token: string) {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) throw new ValidationError("Email không tồn tại");
    if (user.isEmailVerified) throw new ValidationError("Email đã được xác thực");

    await this.#verifyOtp(user.id, email, code, "verify_email");
    await this.db.update(users).set({ isEmailVerified: true }).where(eq(users.id, user.id));

    sendWelcomeEmail(this.resendApiKey, email, user.displayName ?? user.username).catch(console.error);

    return {
      ...(await this.#issueTokens(user.id, user.username, user.isAdmin ?? false)),
      user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl },
    };
  }

  async resendOtp(email: string, type: "verify_email" | "reset_password") {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return { message: "Nếu email tồn tại, OTP sẽ được gửi." };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const allOtps = await this.db.query.otpCodes.findMany({
      where: and(eq(otpCodes.userId, user.id), eq(otpCodes.type, type)),
    });
    const recent = allOtps.filter((o) => (o.createdAt ?? "") > oneHourAgo);
    if (recent.length >= 3) throw new ValidationError("Đã gửi quá 3 OTP trong 1 giờ. Vui lòng thử lại sau.");

    await this.#sendOtp(user.id, email, type);
    return { message: "Nếu email tồn tại, OTP sẽ được gửi." };
  }

  async forgotPassword(email: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    if (user) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const allOtps = await this.db.query.otpCodes.findMany({
        where: and(eq(otpCodes.userId, user.id), eq(otpCodes.type, "reset_password")),
      });
      const recent = allOtps.filter((o) => (o.createdAt ?? "") > oneHourAgo);
      if (recent.length < 3) {
        await this.#sendOtp(user.id, email, "reset_password").catch(console.error);
      }
    }
    return { message: "Nếu email tồn tại, mã OTP sẽ được gửi." };
  }

  async verifyResetOtp(email: string, code: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) throw new ValidationError("Email không tồn tại");

    await this.#verifyOtp(user.id, email, code, "reset_password");

    const resetToken = await signJWT(
      { sub: user.id, username: user.username, isAdmin: false },
      this.jwtSecret + ":reset", 900,
    );
    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    let payload: { sub: string };
    try {
      payload = await verifyJWT(resetToken, this.jwtSecret + ":reset") as any;
    } catch {
      throw new UnauthorizedError("Reset token không hợp lệ hoặc đã hết hạn");
    }

    const passwordHash = await hashPassword(newPassword);
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, payload.sub));
    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, payload.sub));

    const user = await this.db.query.users.findFirst({ where: eq(users.id, payload.sub) });
    if (user) sendPasswordChangedEmail(this.resendApiKey, user.email).catch(console.error);

    return { message: "Mật khẩu đã được đặt lại thành công." };
  }

  async #sendOtp(userId: string, email: string, type: "verify_email" | "reset_password") {
    await this.db.delete(otpCodes).where(
      and(eq(otpCodes.userId, userId), eq(otpCodes.type, type)),
    );
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await this.db.insert(otpCodes).values({ id: nanoid(), userId, email, code, type, expiresAt });
    await sendOtpEmail(this.resendApiKey, email, code, type);
  }

  async #verifyOtp(userId: string, email: string, code: string, type: "verify_email" | "reset_password") {
    const otp = await this.db.query.otpCodes.findFirst({
      where: and(eq(otpCodes.userId, userId), eq(otpCodes.email, email), eq(otpCodes.type, type)),
    });
    if (!otp || otp.usedAt) throw new ValidationError("Mã OTP không hợp lệ");
    if (new Date(otp.expiresAt) < new Date()) throw new ValidationError("Mã OTP đã hết hạn");
    if (otp.code !== code) throw new ValidationError("Mã OTP không đúng");
    await this.db.update(otpCodes).set({ usedAt: new Date().toISOString() }).where(eq(otpCodes.id, otp.id));
  }

  async #issueTokens(userId: string, username: string, isAdmin: boolean) {
    const accessToken = await signJWT({ sub: userId, username, isAdmin }, this.jwtSecret, 3600);
    const refreshToken = nanoid(40);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await this.db.insert(refreshTokens).values({ id: nanoid(), userId, token: refreshToken, expiresAt });
    return { accessToken, refreshToken };
  }
}
