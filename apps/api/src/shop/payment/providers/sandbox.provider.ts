import { Injectable } from '@nestjs/common';
import type {
  PaymentProvider,
  InitiateInput,
  InitiateResult,
  WebhookResult,
} from '../payment.interface';

/**
 * Sandbox provider used until real Orange Money / Wave credentials are available.
 * initiate() returns a PENDING reference and does NOT auto-confirm — confirmation
 * is driven manually via the dev-only POST /shop/confirm/:purchaseId route (which
 * calls ShopService.devConfirm). parseWebhook() trusts the simulated payload.
 */
@Injectable()
export class SandboxProvider implements PaymentProvider {
  readonly id = 'sandbox' as const;

  async initiate(input: InitiateInput): Promise<InitiateResult> {
    return {
      providerRef: `sbx_${input.purchaseId}`,
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
