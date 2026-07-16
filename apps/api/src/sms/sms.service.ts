import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sends SMS and WhatsApp messages via Termii (termii.com) — an African-focused
 * aggregator with strong Senegal coverage. When TERMII_API_KEY is absent (local
 * dev), the message is logged to the console instead of hitting the network.
 * Every send is recorded in SmsLog so the admin dashboard can track costs.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  async send(phone: string, message: string, channel: 'sms' | 'whatsapp'): Promise<void> {
    const apiKey = process.env.TERMII_API_KEY;

    // Dev fallback: log to console so the developer can copy the code.
    if (!apiKey) {
      this.logger.log(`[SMS DEV] +221${phone} via ${channel}: ${message}`);
      await this.logSend(phone, channel, true);
      return;
    }

    const e164 = this.toE164Sn(phone);
    const termiiChannel = channel === 'whatsapp' ? 'WhatsApp' : 'generic';

    try {
      const res = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          to: e164,
          from: process.env.TERMII_SENDER_ID || 'PERMIS',
          sms: message,
          type: 'plain',
          channel: termiiChannel,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(`Termii ${res.status}: ${detail}`);
      } else {
        await this.logSend(phone, channel, false);
      }
    } catch (err) {
      this.logger.error(`Termii unreachable: ${String(err)}`);
      // Do not throw — OTP was already stored; user can request a new one.
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

  /** Convert a 9-digit Senegalese local number to E.164 (+221XXXXXXXXX). */
  private toE164Sn(local: string): string {
    const digits = local.replace(/\D/g, '').replace(/^221/, '');
    return `221${digits}`;
  }
}
