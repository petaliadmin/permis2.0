import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * Sends transactional email over plain SMTP via nodemailer — no HTTP
 * email-API vendor, works with any SMTP server (transactional-email host,
 * mailbox provider, etc.) configured via SMTP_* env vars. When SMTP_HOST is
 * absent (local dev), the send is logged to the console instead of hitting
 * the network, mirroring SmsService's dev fallback.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  /** Lazily builds (and caches) the transporter — env vars don't change at runtime. */
  private getTransporter(): Transporter | null {
    const host = process.env.SMTP_HOST;
    if (!host) return null;

    if (!this.transporter) {
      this.transporter = createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      });
    }
    return this.transporter;
  }

  async sendPdf(
    to: string,
    opts: { subject: string; text: string; filename: string; base64: string }
  ): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.log(`[EMAIL DEV] to ${to}: "${opts.subject}" with attachment ${opts.filename}`);
      return;
    }

    try {
      await transporter.sendMail({
        from: {
          name: process.env.SMTP_FROM_NAME || 'PERMIS 2.0',
          address: process.env.SMTP_FROM_EMAIL || 'no-reply@permis2.com',
        },
        replyTo: process.env.SMTP_REPLY_TO || 'contact@permis2.com',
        to,
        subject: opts.subject,
        text: opts.text,
        attachments: [{ filename: opts.filename, content: opts.base64, encoding: 'base64' }],
      });
    } catch (err) {
      this.logger.error(`SMTP email failed: ${String(err)}`);
      // Do not throw — the caller (e.g. an invoice send) should not 500 just
      // because the mail server is briefly unreachable.
    }
  }
}
