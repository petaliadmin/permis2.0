import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sends SMS and WhatsApp messages via Brevo (brevo.com). When BREVO_API_KEY is
 * absent (local dev), the message is logged to the console instead of hitting
 * the network. Every send is recorded in SmsLog so the admin dashboard can
 * track costs.
 *
 * WhatsApp on Brevo requires a pre-approved message template (Campaigns >
 * WhatsApp in the Brevo dashboard) — free-text messages aren't allowed. Until
 * BREVO_WHATSAPP_TEMPLATE_ID is configured, "whatsapp" requests are sent as
 * SMS instead so delivery doesn't just silently fail.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  async send(phone: string, message: string, channel: 'sms' | 'whatsapp'): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;

    // Dev fallback: log to console so the developer can copy the code.
    if (!apiKey) {
      this.logger.log(`[SMS DEV] +221${phone} via ${channel}: ${message}`);
      await this.logSend(phone, channel, true);
      return;
    }

    const templateId = process.env.BREVO_WHATSAPP_TEMPLATE_ID;
    if (channel === 'whatsapp' && templateId) {
      await this.sendWhatsApp(phone, message, apiKey, templateId);
      return;
    }
    if (channel === 'whatsapp') {
      this.logger.warn('BREVO_WHATSAPP_TEMPLATE_ID not set — sending as SMS instead');
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
      const res = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          sender: (process.env.BREVO_SMS_SENDER || 'PERMIS').slice(0, 11),
          recipient: e164,
          content: message,
          type: 'transactional',
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(`Brevo SMS ${res.status}: ${detail}`);
      } else {
        await this.logSend(phone, channel, false);
      }
    } catch (err) {
      this.logger.error(`Brevo SMS unreachable: ${String(err)}`);
      // Do not throw — OTP was already stored; user can request a new one.
    }
  }

  private async sendWhatsApp(
    phone: string,
    message: string,
    apiKey: string,
    templateId: string
  ): Promise<void> {
    const e164 = Number(this.toE164Sn(phone));

    try {
      const res = await fetch('https://api.brevo.com/v3/whatsapp/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          templateId: Number(templateId),
          contactNumbers: [e164],
          senderNumber: process.env.BREVO_WHATSAPP_SENDER_NUMBER,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(`Brevo WhatsApp ${res.status}: ${detail}`);
      } else {
        await this.logSend(phone, 'whatsapp', false);
      }
    } catch (err) {
      this.logger.error(`Brevo WhatsApp unreachable: ${String(err)}`);
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
