// @ts-ignore - cloudflare:sockets là runtime API của Cloudflare Workers
import { connect } from "cloudflare:sockets";

export interface SmtpConfig {
  host: string;
  port: number;     // 465 = SMTPS (SSL), 587 = STARTTLS
  username: string;
  password: string;
  from: string;     // VD: "Hiu <noreply@hieumoi.online>"
}

export interface SmtpMailOptions {
  to: string;
  subject: string;
  html: string;
}

class SmtpStream {
  private buf = "";
  private dec = new TextDecoder();
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;

  constructor(sock: { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }) {
    this.reader = sock.readable.getReader();
    this.writer = sock.writable.getWriter();
  }

  /** Đọc một SMTP response (xử lý response nhiều dòng: 250- / 250) */
  async recv(): Promise<{ code: number; lines: string[] }> {
    const lines: string[] = [];
    let code = 0;
    let more = true;
    while (more) {
      while (!this.buf.includes("\r\n")) {
        const { done, value } = await this.reader.read();
        if (done) throw new Error("SMTP: kết nối bị đóng bất ngờ");
        this.buf += this.dec.decode(value, { stream: true });
      }
      const i = this.buf.indexOf("\r\n");
      const line = this.buf.slice(0, i);
      this.buf = this.buf.slice(i + 2);
      code = parseInt(line.slice(0, 3));
      lines.push(line.slice(4));
      more = line[3] === "-";
    }
    return { code, lines };
  }

  async send(cmd: string) {
    await this.writer.write(new TextEncoder().encode(cmd + "\r\n"));
  }

  async expect(code: number): Promise<string[]> {
    const resp = await this.recv();
    if (resp.code !== code) {
      throw new Error(`SMTP: chờ ${code}, nhận ${resp.code} — ${resp.lines.join("; ")}`);
    }
    return resp.lines;
  }

  release() {
    try { this.reader.releaseLock(); } catch { /* ignore */ }
    try { this.writer.releaseLock(); } catch { /* ignore */ }
  }
}

function b64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function mimeEncodeHeader(s: string): string {
  return /[^\x00-\x7F]/.test(s) ? `=?UTF-8?B?${b64(s)}?=` : s;
}

function extractAddr(from: string): string {
  return from.match(/<([^>]+)>/)?.[1] ?? from;
}

function wrapAt76(s: string): string {
  return s.match(/.{1,76}/g)?.join("\r\n") ?? s;
}

export async function sendSmtpEmail(config: SmtpConfig, opts: SmtpMailOptions): Promise<void> {
  const isSsl = config.port === 465;

  // @ts-ignore
  let sock = connect(
    { hostname: config.host, port: config.port },
    { secureTransport: isSsl ? "on" : "starttls", allowHalfOpen: false },
  );

  let stream = new SmtpStream(sock);
  const domain = extractAddr(config.from).split("@")[1] ?? "localhost";

  try {
    await stream.expect(220);

    await stream.send(`EHLO ${domain}`);
    await stream.expect(250);

    if (!isSsl) {
      await stream.send("STARTTLS");
      await stream.expect(220);
      stream.release();
      // @ts-ignore
      sock = sock.startTls();
      stream = new SmtpStream(sock);
      await stream.send(`EHLO ${domain}`);
      await stream.expect(250);
    }

    // AUTH LOGIN
    await stream.send("AUTH LOGIN");
    await stream.expect(334);
    await stream.send(b64(config.username));
    await stream.expect(334);
    await stream.send(b64(config.password));
    await stream.expect(235);

    // Envelope
    await stream.send(`MAIL FROM:<${extractAddr(config.from)}>`);
    await stream.expect(250);
    await stream.send(`RCPT TO:<${opts.to}>`);
    await stream.expect(250);

    // Body
    await stream.send("DATA");
    await stream.expect(354);

    const msg = [
      `From: ${config.from}`,
      `To: ${opts.to}`,
      `Subject: ${mimeEncodeHeader(opts.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      wrapAt76(b64(opts.html)),
      `.`,
    ].join("\r\n");

    await stream.send(msg);
    await stream.expect(250);
    await stream.send("QUIT");
  } finally {
    stream.release();
    await sock.close().catch(() => {});
  }
}
