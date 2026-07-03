import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementService } from '../entitlement/entitlement.service';
import { PaymentService } from './payment/payment.service';
import { CheckoutDto } from './dto/checkout.dto';

/**
 * Boutique back-end (Sprint 6): products, checkout, payment webhook handling, and
 * entitlement granting. A purchase is created PENDING; entitlements are granted
 * only when it flips to PAID (via the provider webhook or the dev confirm route),
 * idempotently so webhook retries are safe.
 */
@Injectable()
export class ShopService {
  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementService,
    private payment: PaymentService,
  ) {}

  /** Active catalog; flags products the user already fully owns. */
  async listProducts(userId?: string) {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: { ordre: 'asc' },
    });
    const keys = new Set(await this.entitlements.getKeys(userId));
    return products.map((p) => ({
      ...p,
      owned: p.grants.length > 0 && p.grants.every((g) => keys.has(g)),
    }));
  }

  async getEntitlements(userId: string) {
    // Only non-expired grants are active. Mirrors EntitlementService.getKeys so a
    // lapsed subscription (expiresAt in the past) re-locks content client-side too.
    const now = new Date();
    const rows = await this.prisma.entitlement.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return { keys: rows.map((r) => r.key), rows };
  }

  async getPurchases(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, sku: true, title: true, kind: true, priceXof: true },
        },
      },
    });
  }

  /** Returns the most recent PENDING purchase for the user, or null if none. */
  async getPendingCheckout(userId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, sku: true, title: true, kind: true, priceXof: true },
        },
      },
    });
    return purchase ?? null;
  }

  /**
   * Creates a PENDING purchase and asks the provider to initiate payment. No
   * entitlement is granted here — that happens on the PAID webhook/confirm.
   */
  async checkout(userId: string, dto: CheckoutDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
    }

    const provider = this.payment.resolveProvider();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        productId: product.id,
        provider: provider.id,
        method: dto.method,
        phone: dto.phone,
        amountXof: product.priceXof,
        status: 'PENDING',
      },
    });

    const initiated = await provider.initiate({
      purchaseId: purchase.id,
      amountXof: product.priceXof,
      phone: dto.phone,
      method: dto.method,
      email: user?.email ?? undefined,
      name: user?.name,
    });

    await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: { providerRef: initiated.providerRef },
    });

    return {
      purchaseId: purchase.id,
      status: 'PENDING' as const,
      providerRef: initiated.providerRef,
      redirectUrl: initiated.redirectUrl,
    };
  }

  /** Provider callback: resolve the verdict and grant on PAID. */
  async handleWebhook(
    providerId: string,
    payload: unknown,
    headers: Record<string, string>,
  ) {
    const provider = this.payment.getProvider(providerId as any);
    const result = await provider.parseWebhook(payload, headers);

    // Non-terminal provider status (e.g. Bictorys pending/authorized): acknowledge
    // without touching the purchase so a later terminal callback still decides it.
    if (result.status === 'PENDING') {
      return { ok: true, ignored: true };
    }

    const purchase = await this.prisma.purchase.findFirst({
      where: { providerRef: result.providerRef },
    });
    if (!purchase) {
      throw new NotFoundException('Purchase not found for providerRef');
    }

    if (result.status === 'PAID') {
      // Reject (don't fail) on an amount mismatch: leaves the purchase PENDING so
      // a spoofed amount can't cancel a legit purchase or grant the wrong one.
      if (
        result.amountXof !== undefined &&
        result.amountXof !== purchase.amountXof
      ) {
        throw new BadRequestException('Webhook amount does not match purchase');
      }
      await this.markPaid(purchase.id);
    } else {
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'FAILED' },
      });
    }
    return { ok: true };
  }

  /**
   * Flips a purchase to PAID and grants its product's entitlements. Idempotent:
   * a no-op if already PAID, and entitlement upserts dedupe on (userId, key).
   *
   * When the product has `validityDays`, the grant expires (a subscription). A
   * renewal made while the entitlement is still active *extends* from the current
   * expiry rather than overwriting it, so paying early never loses remaining time.
   * `validityDays === null` keeps the grant permanent.
   */
  async markPaid(purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { product: true },
    });
    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }
    if (purchase.status === 'PAID') {
      return purchase; // already processed — webhook retry
    }

    const now = new Date();
    const validityDays = purchase.product.validityDays;

    await this.prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'PAID' },
      });

      for (const key of purchase.product.grants) {
        const existing = await tx.entitlement.findUnique({
          where: { userId_key: { userId: purchase.userId, key } },
        });

        // Subscription: extend from a still-active expiry (renewal) or from now;
        // permanent grant (validityDays null) stays non-expiring.
        let expiresAt: Date | null = null;
        if (validityDays != null) {
          const base =
            existing?.expiresAt && existing.expiresAt > now
              ? existing.expiresAt
              : now;
          expiresAt = new Date(
            base.getTime() + validityDays * 24 * 60 * 60 * 1000,
          );
        }

        await tx.entitlement.upsert({
          where: { userId_key: { userId: purchase.userId, key } },
          update: { expiresAt, source: 'purchase', purchaseId: purchase.id },
          create: {
            userId: purchase.userId,
            key,
            source: 'purchase',
            purchaseId: purchase.id,
            expiresAt,
          },
        });
      }
    });

    return this.prisma.purchase.findUnique({ where: { id: purchase.id } });
  }

  /**
   * Dev-only: simulate a successful Mobile Money confirmation for a sandbox
   * purchase. Rejected when running with live payments enabled in production.
   */
  async devConfirm(userId: string, purchaseId: string) {
    // Never available in production, regardless of PAYMENT_LIVE — otherwise a
    // deployment that forgot to set PAYMENT_LIVE=true would hand out premium
    // entitlements for free.
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev confirm is disabled in production');
    }
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }
    if (purchase.userId !== userId) {
      throw new ForbiddenException('Not your purchase');
    }
    // Only ever confirm sandbox purchases; a real provider purchase must be
    // settled by its authenticated webhook.
    if (purchase.provider !== 'sandbox') {
      throw new ForbiddenException('Dev confirm is only for sandbox purchases');
    }
    await this.markPaid(purchaseId);
    return { ok: true, status: 'PAID' as const };
  }
}
