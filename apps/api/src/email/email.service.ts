import { Injectable, Logger } from '@nestjs/common';

/**
 * Sends transactional email via Brevo (brevo.com) — SMS/WhatsApp moved to
 * DExchange (see SmsService), but email still goes through Brevo, its own
 * BREVO_API_KEY. When the key is absent (local dev), the send is logged to
 * the console instead of hitting the network, mirroring SmsService's dev
 * fallback.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendPdf(
    to: string,
    opts: { subject: string; text: string; filename: string; base64: string }
  ): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      this.logger.log(`[EMAIL DEV] to ${to}: "${opts.subject}" with attachment ${opts.filename}`);
      return;
    }

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          sender: {
            email: process.env.BREVO_EMAIL_SENDER || 'no-reply@permis2.com',
            name: process.env.BREVO_EMAIL_SENDER_NAME || 'PERMIS 2.0',
          },
          to: [{ email: to }],
          subject: opts.subject,
          textContent: opts.text,
          attachment: [{ name: opts.filename, content: opts.base64 }],
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(`Brevo email ${res.status}: ${detail}`);
      }
    } catch (err) {
      this.logger.error(`Brevo email unreachable: ${String(err)}`);
      // Do not throw — the caller (e.g. an invoice send) should not 500 just
      // because the mail provider is briefly unreachable.
    }
  }
}
