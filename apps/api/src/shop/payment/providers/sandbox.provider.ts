import { Injectable } from '@nestjs/common';
import type {
  PaymentProvider,
  InitiateInput,
  InitiateResult,
  WebhookResult,
} from '../payment.interface';

/**
 * Sandbox provider used until real Orange Money / Wave credentials are available.
 * initiate() returns a PENDING reference and a fake payment link (so the QR /
 * link checkout UI can be exercised end to end — the link itself is inert,
 * confirmation is driven by the dev-only POST /shop/purchases/:id/simulate-confirm).
 * parseWebhook() trusts the simulated payload.
 */
@Injectable()
export class SandboxProvider implements PaymentProvider {
  readonly id = 'sandbox' as const;

  async initiate(input: InitiateInput): Promise<InitiateResult> {
    return {
      providerRef: `sbx_${input.purchaseId}`,
      // Realistic-looking but inert — lets the front-end render the QR + link.
      redirectUrl: `https://pay.sandbox.permis2.com/c/${input.purchaseId}?amount=${input.amountXof}&cur=XOF`,
      status: 'PENDING',
    };
  }

  async parseWebhook(
    payload: unknown,
    _headers?: Record<string, string>,
    _rawBody?: string
  ): Promise<WebhookResult> {
    const body = (payload ?? {}) as { providerRef?: string; status?: string };
    return {
      providerRef: body.providerRef ?? '',
      status: body.status === 'PAID' ? 'PAID' : 'FAILED',
    };
  }
}
