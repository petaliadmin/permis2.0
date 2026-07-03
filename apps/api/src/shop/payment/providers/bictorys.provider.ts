import { timingSafeEqual } from 'node:crypto';
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

const DEFAULT_API_URL = 'https://api.test.bictorys.com';

/**
 * Maps our UI method to a Bictorys `payment_type`. `card` is intentionally
 * absent: omitting `payment_type` makes Bictorys serve its hosted checkout page
 * (the redirect flow), which handles card entry so we never touch card data.
 */
const PAYMENT_TYPE: Partial<Record<PaymentMethod, string>> = {
  orange_money: 'orange_money',
  wave: 'wave_money',
};

interface ChargeResponse {
  transactionId?: string;
  chargeId?: string;
  /** Payment-instruction / hosted-checkout URL to redirect the customer to. */
  link?: string;
  message?: string;
}

interface BictorysWebhookPayload {
  merchantReference?: string;
  paymentReference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  pspName?: string;
}

/**
 * Bictorys adapter (bictorys.com) — a West-African aggregator covering Orange
 * Money, Wave and cards through one API. Charge: POST /pay/v1/charges. The
 * customer confirms asynchronously; Bictorys then calls POST /shop/webhook/bictorys.
 *
 * Correlation: we set `merchantReference = purchaseId` so the webhook maps back
 * to the purchase via the existing providerRef lookup. Webhooks are authenticated
 * by comparing the `X-Secret-Key` header to BICTORYS_SECRET_KEY (Bictorys does
 * not HMAC-sign the body).
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

    const paymentType = input.method ? PAYMENT_TYPE[input.method] : undefined;
    const query = paymentType ? `?payment_type=${paymentType}` : '';

    const body = {
      amount: input.amountXof,
      currency: 'XOF',
      country,
      // Both references carry the purchase id: merchantReference is echoed back
      // in the webhook (our correlation key); paymentReference shows on the page.
      merchantReference: input.purchaseId,
      paymentReference: input.purchaseId,
      successRedirectUrl: `${frontend}/boutique?status=success`,
      errorRedirectUrl: `${frontend}/boutique?status=error`,
      customer: {
        name: input.name || 'Client',
        phone: input.phone,
        email: input.email || '',
        city: '',
        country,
        locale: 'fr-FR',
      },
      allowUpdateCustomer: true,
    };

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

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(`Bictorys charge ${res.status}: ${detail}`);
      throw new InternalServerErrorException('Payment initiation failed');
    }

    const json = (await res.json().catch(() => ({}))) as ChargeResponse;

    return {
      providerRef: input.purchaseId,
      redirectUrl: json.link,
      status: 'PENDING',
    };
  }

  async parseWebhook(
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<WebhookResult> {
    this.verifySecret(headers['x-secret-key']);

    const body = (payload ?? {}) as BictorysWebhookPayload;
    const merchantReference = body.merchantReference || body.paymentReference;
    if (!merchantReference) {
      throw new BadRequestException('Webhook missing merchantReference');
    }

    return {
      providerRef: merchantReference,
      status: mapStatus(body.status),
      amountXof:
        typeof body.amount === 'number' ? Math.round(body.amount) : undefined,
      currency: body.currency,
    };
  }

  /** Constant-time comparison of the shared secret; rejects if unset or unequal. */
  private verifySecret(received?: string): void {
    const expected = process.env.BICTORYS_SECRET_KEY;
    if (!expected) {
      throw new InternalServerErrorException(
        'BICTORYS_SECRET_KEY is not configured',
      );
    }
    const a = Buffer.from(received ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn('Bictorys webhook rejected: invalid X-Secret-Key');
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}

/** Maps a Bictorys transaction status to our terminal/non-terminal verdict. */
function mapStatus(status?: string): WebhookResult['status'] {
  switch ((status ?? '').toLowerCase()) {
    case 'succeeded':
      return 'PAID';
    case 'failed':
    case 'cancelled':
    case 'canceled':
    case 'declined':
      return 'FAILED';
    // pending, authorized, processing, … — non-terminal, treat as no-op.
    default:
      return 'PENDING';
  }
}
