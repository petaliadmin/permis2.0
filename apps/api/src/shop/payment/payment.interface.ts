import type { PaymentProviderId, PaymentMethod } from '@permis2.0/types';

export interface InitiateInput {
  purchaseId: string;
  amountXof: number;
  /** Optional phone pre-fill; formatted as +221XXXXXXXXX before sending to provider. */
  phone?: string;
  /** Chosen method — mapped to the provider's payment_type for better UX. */
  method?: PaymentMethod;
  /** Customer identity, forwarded to the provider when available. */
  email?: string;
  name?: string;
}

export interface InitiateResult {
  providerRef: string;
  /**
   * Bictorys `link`: for Wave this is a deep-link to Wave; for card / hosted checkout
   * it's the Bictorys payment page. Frontend should redirect to it when present.
   */
  redirectUrl?: string;
  /**
   * USSD instruction string returned by Bictorys for Orange Money / Free Money
   * (e.g. "Validez la demande de paiement reçue sur votre téléphone").
   * Frontend should display this message and poll for the webhook confirmation.
   */
  ussdMessage?: string;
  status: 'PENDING';
}

export interface WebhookResult {
  providerRef: string;
  /**
   * Terminal verdict, or `PENDING` for non-terminal provider statuses
   * (e.g. Bictorys `pending`/`authorized`) — the caller treats PENDING as a
   * no-op so an intermediate callback can't corrupt an in-flight purchase.
   */
  status: 'PAID' | 'FAILED' | 'PENDING';
  /** Amount reported by the provider, checked against the stored purchase. */
  amountXof?: number;
  currency?: string;
}

/**
 * A payment adapter: either Bictorys (aggregates Orange Money / Wave / Free Money / card)
 * or the offline sandbox. Flow: initiate() → PENDING + optional redirect or USSD message;
 * provider calls our webhook asynchronously → parseWebhook() returns PAID/FAILED/PENDING.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderId;
  initiate(input: InitiateInput): Promise<InitiateResult>;
  parseWebhook(
    payload: unknown,
    headers: Record<string, string>,
    rawBody?: string
  ): Promise<WebhookResult>;
}
