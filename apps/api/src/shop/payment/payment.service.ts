import { Injectable, BadRequestException } from '@nestjs/common';
import type { PaymentProviderId } from '@permis2.0/types';
import type { PaymentProvider } from './payment.interface';
import { SandboxProvider } from './providers/sandbox.provider';
import { BictorysProvider } from './providers/bictorys.provider';

/**
 * Resolves a checkout to a concrete payment adapter. Until PAYMENT_LIVE is
 * explicitly enabled, every checkout is forced through the offline sandbox so the
 * flow is exercisable end-to-end without credentials. When live, all methods route
 * through Bictorys (the requested *method* is carried in the checkout DTO, not
 * here — provider routing and payment method are separate axes).
 */
@Injectable()
export class PaymentService {
  private readonly providers: Record<PaymentProviderId, PaymentProvider>;

  constructor(sandbox: SandboxProvider, bictorys: BictorysProvider) {
    this.providers = {
      sandbox,
      bictorys,
    };
  }

  private get live(): boolean {
    return process.env.PAYMENT_LIVE === 'true';
  }

  /** The provider actually used for a checkout (sandbox unless live payments are on). */
  resolveProvider(): PaymentProvider {
    return this.live ? this.providers.bictorys : this.providers.sandbox;
  }

  getProvider(id: PaymentProviderId): PaymentProvider {
    const provider = this.providers[id];
    if (!provider) {
      throw new BadRequestException(`Unknown payment provider: ${id}`);
    }
    return provider;
  }
}
