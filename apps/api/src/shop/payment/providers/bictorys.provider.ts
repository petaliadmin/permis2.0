import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { PaymentMethod } from '@permis2.0/types';
import type {
  PaymentProvider,
  InitiateInput,
  InitiateResult,
  WebhookResult,
} from '../payment.interface';

// Test:       https://api.test.bictorys.com
// Production: https://api.bictorys.com  (set BICTORYS_API_URL in .env)
const DEFAULT_API_URL = 'https://api.test.bictorys.com';

/**
 * Maps our PaymentMethod to the Bictorys `payment_type` query parameter.
 * When absent (card), Bictorys displays its hosted checkout page.
 *
 * Supported Bictorys payment_type values: wave_money, orange_money,
 * free_money, mtn_money, moov, mobicash, maxit, togo, cell, bictorys, card
 */
const BICTORYS_PAYMENT_TYPE: Partial<Record<PaymentMethod, string>> = {
  orange_money: 'orange_money',
  wave: 'wave_money',
  free_money: 'free_money',
  // card: omitted → Bictorys hosted checkout handles card entry
};

/**
 * Normalize a Senegalese phone number to the format Bictorys requires:
 * +INDICATIF+NUMERO (no spaces, e.g. +221771234567).
 */
function normalizePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('221') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+221${digits}`;
  if (raw.startsWith('+') && digits.length >= 11) return raw.replace(/\s/g, '');
  return raw.replace(/\s/g, '');
}

interface BictorysChargeResponse {
  transactionId?: string;
  chargeId?: string;
  /** Wave deep-link or hosted checkout URL. */
  link?: string;
  /** Hosted checkout redirect URL. */
  redirectUrl?: string;
  /** USSD instruction for Orange Money / Free Money (show to user). */
  message?: string;
  /** Base64 PNG QR code for desktop/TPE. */
  qrCode?: string;
  error?: string;
  errors?: string;
}

interface BictorysWebhookPayload {
  merchantReference?: string;
  paymentReference?: string;
  transactionId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  pspName?: string;
}

/**
 * Bictorys adapter (bictorys.com) — West-African payment aggregator for
 * Orange Money, Wave, Free Money and Carte through a single API.
 *
 * Integration strategy: Direct API with payment_type routing.
 * - wave       → payment_type=wave_money  → returns `link` (Wave deep-link) → redirect
 * - orange_money→ payment_type=orange_money → returns `message` (USSD) → show to user + poll
 * - free_money  → payment_type=free_money  → returns `message` (USSD) → show to user + poll
 * - card        → no payment_type          → returns `link`/`redirectUrl` → Bictorys card page
 *
 * Correlation: merchantReference = purchaseId, echoed back in the webhook.
 * Webhook auth: HMAC-SHA256 preferred (X-Webhook-Signature); fallback to X-Secret-Key.
 */
@Injectable()
export class BictorysProvider implements PaymentProvider {
  readonly id = 'bictorys' as const;
  private readonly logger = new Logger(BictorysProvider.name);

  private get apiUrl(): string {
    return process.env.BICTORYS_API_URL || DEFAULT_API_URL;
  }

  async initiate(input: InitiateInput): Promise<InitiateResult> {
    const apiKey = process.env.BICTORYS_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('BICTORYS_API_KEY is not configured');
    }

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const country = process.env.PAYMENT_COUNTRY || 'SN';

    const paymentType = input.method ? BICTORYS_PAYMENT_TYPE[input.method] : undefined;
    const query = paymentType ? `?payment_type=${paymentType}` : '';

    const body = {
      amount: input.amountXof,
      currency: 'XOF',
      country,
      // deviceId is required by the Bictorys API — use purchaseId as a unique device fingerprint.
      deviceId: input.purchaseId,
      merchantReference: input.purchaseId,
      paymentReference: input.purchaseId,
      successRedirectUrl: `${frontend}/boutique?status=success`,
      errorRedirectUrl: `${frontend}/boutique?status=error`,
      customer: {
        name: input.name || 'Client',
        phone: normalizePhone(input.phone),
        email: input.email || '',
        country,
        locale: 'fr-FR',
      },
      allowUpdateCustomer: true,
    };

    this.logger.debug(`Bictorys charge → ${this.apiUrl}/pay/v1/charges${query}`);

    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}/pay/v1/charges${query}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`Bictorys charge request failed: ${String(err)}`);
      throw new InternalServerErrorException('Payment provider unreachable');
    }

    const json = (await res.json().catch(() => ({}))) as BictorysChargeResponse;

    if (!res.ok) {
      const detail = json.error || json.errors || res.status;
      this.logger.error(`Bictorys charge HTTP ${res.status}: ${JSON.stringify(detail)}`);
      throw new InternalServerErrorException('Payment initiation failed');
    }

    this.logger.debug(
      `Bictorys charge response: ${JSON.stringify({ link: json.link, redirectUrl: json.redirectUrl, message: json.message })}`
    );

    // Prefer the specific link (Wave deep-link / hosted checkout) over generic redirectUrl.
    const redirectUrl = json.link ?? json.redirectUrl;

    return {
      providerRef: input.purchaseId,
      redirectUrl,
      ussdMessage: json.message,
      status: 'PENDING',
    };
  }

  async parseWebhook(
    payload: unknown,
    headers: Record<string, string>,
    rawBody?: string
  ): Promise<WebhookResult> {
    this.verifyWebhookSignature(headers, rawBody);

    const body = (payload ?? {}) as BictorysWebhookPayload;
    // Bictorys echoes our merchantReference which we set to purchaseId.
    const providerRef = body.merchantReference || body.paymentReference || body.transactionId;
    if (!providerRef) {
      throw new BadRequestException('Webhook missing merchantReference / paymentReference');
    }

    return {
      providerRef,
      status: mapStatus(body.status),
      amountXof: typeof body.amount === 'number' ? Math.round(body.amount) : undefined,
      currency: body.currency,
    };
  }

  /**
   * Validates the Bictorys webhook signature.
   * Preferred: HMAC-SHA256 using X-Webhook-Signature + X-Webhook-Timestamp.
   * Fallback:  timing-safe comparison of X-Secret-Key.
   */
  private verifyWebhookSignature(headers: Record<string, string>, rawBody?: string): void {
    const secret = process.env.BICTORYS_SECRET_KEY;
    if (!secret) {
      throw new InternalServerErrorException('BICTORYS_SECRET_KEY is not configured');
    }

    const hmacSig = headers['x-webhook-signature'];
    const timestamp = headers['x-webhook-timestamp'];

    if (hmacSig && timestamp && rawBody) {
      // Reject stale timestamps (> 5 minutes) to prevent replay attacks.
      const age = Date.now() - Number(timestamp);
      if (age > 300_000) {
        this.logger.warn('Bictorys webhook rejected: timestamp too old');
        throw new BadRequestException('Webhook timestamp too old');
      }

      const computed = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

      if (computed !== hmacSig) {
        this.logger.warn('Bictorys webhook rejected: invalid HMAC signature');
        throw new BadRequestException('Invalid webhook signature');
      }
      return;
    }

    // Fallback: X-Secret-Key static comparison (always present per Bictorys docs).
    const received = headers['x-secret-key'];
    const a = Buffer.from(received ?? '');
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn('Bictorys webhook rejected: invalid X-Secret-Key');
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}

function mapStatus(status?: string): WebhookResult['status'] {
  switch ((status ?? '').toLowerCase()) {
    case 'succeeded':
    case 'authorized':
      return 'PAID';
    case 'failed':
    case 'cancelled':
    case 'canceled':
    case 'declined':
    case 'reversed':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}
