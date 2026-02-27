interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(apiKey: string, opts: SendEmailOptions): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Hiu <noreply@hieumoi.online>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

export async function sendOtpEmail(
  apiKey: string,
  to: string,
  code: string,
  type: "verify_email" | "reset_password",
): Promise<void> {
  const isReset = type === "reset_password";
  const subject = isReset ? "Đặt lại mật khẩu Hiu" : "Xác thực email Hiu";
  const action = isReset ? "đặt lại mật khẩu" : "xác thực tài khoản";

  await sendEmail(apiKey, {
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">🎵 Hiu</h1>
        <p style="color:#aaa;margin:0 0 32px;font-size:14px;">Nền tảng âm nhạc & ảnh của bạn</p>
        <p style="margin:0 0 16px;">Mã OTP ${action} của bạn là:</p>
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#a855f7;">${code}</span>
        </div>
        <p style="color:#aaa;font-size:13px;margin:0 0 8px;">Mã có hiệu lực trong <strong style="color:#fff;">10 phút</strong>.</p>
        <p style="color:#aaa;font-size:13px;margin:0;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  apiKey: string,
  to: string,
  displayName: string,
): Promise<void> {
  await sendEmail(apiKey, {
    to,
    subject: "Chào mừng đến với Hiu! 🎵",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">🎵 Hiu</h1>
        <p style="color:#aaa;margin:0 0 32px;font-size:14px;">Nền tảng âm nhạc & ảnh của bạn</p>
        <h2 style="margin:0 0 16px;">Chào ${displayName}! 👋</h2>
        <p style="color:#ccc;margin:0 0 16px;">Tài khoản của bạn đã được xác thực thành công.</p>
        <p style="color:#ccc;margin:0 0 32px;">Bắt đầu khám phá âm nhạc và chia sẻ khoảnh khắc ngay hôm nay.</p>
        <a href="https://hieumoi.online" style="display:inline-block;background:#a855f7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Vào Hiu ngay →</a>
      </div>
    `,
  });
}

export async function sendPasswordChangedEmail(
  apiKey: string,
  to: string,
): Promise<void> {
  await sendEmail(apiKey, {
    to,
    subject: "Mật khẩu Hiu đã được thay đổi",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">🎵 Hiu</h1>
        <p style="color:#aaa;margin:0 0 32px;font-size:14px;">Nền tảng âm nhạc & ảnh của bạn</p>
        <h2 style="margin:0 0 16px;">Mật khẩu đã thay đổi</h2>
        <p style="color:#ccc;margin:0 0 16px;">Mật khẩu tài khoản của bạn vừa được đặt lại thành công.</p>
        <p style="color:#f87171;font-size:13px;margin:0;">Nếu bạn không thực hiện thao tác này, hãy liên hệ ngay với chúng tôi.</p>
      </div>
    `,
  });
}
