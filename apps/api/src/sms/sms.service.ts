import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const API_BASE = 'https://api.dexchange-sms.com/api/v1';

/**
 * Sends SMS and WhatsApp messages via DExchange (dexchange-sms.com), a
 * Senegal/West-Africa SMS & WhatsApp provider. When DEXCHANGE_API_KEY is
 * absent (local dev), the message is logged to the console instead of
 * hitting the network. Every send is recorded in SmsLog so the admin
 * dashboard can track costs.
 *
 * WhatsApp on DExchange is a WhatsApp-Web bridge tied to a real phone number
 * connected once via QR code from the DExchange dashboard — not the official
 * Meta Business API — so the session can disconnect at any time. A WhatsApp
 * send that fails (network error or non-2xx, e.g. session not connected)
 * falls back to SMS instead of silently failing.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  async send(phone: string, message: string, channel: 'sms' | 'whatsapp'): Promise<void> {
    const apiKey = process.env.DEXCHANGE_API_KEY;

    // Dev fallback: log to console so the developer can copy the code.
    if (!apiKey) {
      this.logger.log(`[SMS DEV] +221${phone} via ${channel}: ${message}`);
      await this.logSend(phone, channel, true);
      return;
    }

    if (channel === 'whatsapp') {
      const sent = await this.sendWhatsApp(phone, message, apiKey);
      if (sent) return;
      this.logger.warn(
        'DExchange WhatsApp send failed (session disconnected?) — sending as SMS instead'
      );
    }
    await this.sendSms(phone, message, apiKey, channel);
  }

  private async sendSms(
    phone: string,
    message: string,
    apiKey: string,
    channel: 'sms' | 'whatsapp'
  ): Promise<void> {
    const e164 = this.toE164Sn(phone);

    try {
      const res = await fetch(`${API_BASE}/send/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          signature: (process.env.DEXCHANGE_SMS_SENDER || 'DEXCHANGE').slice(0, 11),
          content: message,
          number: [e164],
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(`DExchange SMS ${res.status}: ${detail}`);
      } else {
        await this.logSend(phone, channel, false);
      }
    } catch (err) {
      this.logger.error(`DExchange SMS unreachable: ${String(err)}`);
      // Do not throw — OTP was already stored; user can request a new one.
    }
  }

  /** Returns whether the WhatsApp message actually went out. */
  private async sendWhatsApp(phone: string, message: string, apiKey: string): Promise<boolean> {
    const e164 = this.toE164Sn(phone);

    try {
      const res = await fetch(`${API_BASE}/whatsapp/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ to: e164, body: message }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(`DExchange WhatsApp ${res.status}: ${detail}`);
        return false;
      }
      await this.logSend(phone, 'whatsapp', false);
      return true;
    } catch (err) {
      this.logger.error(`DExchange WhatsApp unreachable: ${String(err)}`);
      return false;
    }
  }

  /** Cost-tracking entry — never blocks the send path. */
  private async logSend(phone: string, channel: string, simulated: boolean): Promise<void> {
    try {
      await this.prisma.smsLog.create({ data: { phone, channel, simulated } });
    } catch {
      // Cost log is best-effort only
    }
  }

  /** Convert a 9-digit Senegalese local number to international format (221XXXXXXXXX, no leading +). */
  private toE164Sn(local: string): string {
    const digits = local.replace(/\D/g, '').replace(/^221/, '');
    return `221${digits}`;
  }
}
