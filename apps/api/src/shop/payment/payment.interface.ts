import type { PaymentProviderId, PaymentMethod } from '@permis2.0/types';

export interface InitiateInput {
  purchaseId: string;
  amountXof: number;
  phone: string;
  /** Method the user picked; the provider maps it to its own payment_type. */
  method?: PaymentMethod;
  /** Customer identity, forwarded to the provider when available. */
  email?: string;
  name?: string;
}

export interface InitiateResult {
  providerRef: string;
  /** Present when the customer must be redirected (hosted checkout / card). */
  redirectUrl?: string;
  status: 'PENDING';
}

export interface WebhookResult {
  providerRef: string;
  /**
   * Terminal verdict, or `PENDING` for non-terminal provider statuses
   * (e.g. Bictorys `pending`/`authorized`) — the caller must treat PENDING as a
   * no-op so an intermediate callback can't corrupt an in-flight purchase.
   */
  status: 'PAID' | 'FAILED' | 'PENDING';
  /** Amount reported by the provider, checked against the stored purchase. */
  amountXof?: number;
  currency?: string;
}

/**
 * A payment adapter: either Bictorys (aggregates Orange Money / Wave / card) or
 * the offline sandbox. The flow is always: initiate() returns a PENDING reference
 * (plus a redirect URL for card/hosted checkout), then the provider calls our
 * webhook asynchronously once the customer confirms — parseWebhook() turns that
 * callback into a PAID/FAILED/PENDING verdict.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderId;
  initiate(input: InitiateInput): Promise<InitiateResult>;
  parseWebhook(
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<WebhookResult>;
}
