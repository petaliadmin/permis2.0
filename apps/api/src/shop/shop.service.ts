import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EntitlementService } from '../entitlement/entitlement.service';
import { PaymentService } from './payment/payment.service';
import { CheckoutDto } from './dto/checkout.dto';
import { SchoolMemberRole } from '@permis2.0/types';

/** Product kinds whose purchase applies to a School rather than the buying user. */
const SCHOOL_SCOPED_KINDS = ['school_subscription', 'featured_placement'];

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
    private payment: PaymentService
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

  async getPurchase(userId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: { id: true, sku: true, title: true, kind: true, priceXof: true },
        },
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.userId !== userId) throw new ForbiddenException('Not your purchase');
    return purchase;
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
   * A school_subscription/featured_placement purchase must be attributed to a
   * school the buyer actually owns — otherwise anyone could pay to extend a
   * stranger's subscription or visibility. Returns the validated schoolId, or
   * throws.
   */
  private async assertOwnerOfSchool(userId: string, schoolId: string | undefined) {
    if (!schoolId) throw new BadRequestException('schoolId requis pour ce produit');
    const membership = await this.prisma.schoolMembership.findFirst({
      where: { schoolId, userId, active: true, role: SchoolMemberRole.OWNER },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException("Vous n'êtes pas propriétaire de cette auto-école");
    return schoolId;
  }

  /**
   * Manual (WhatsApp) payment mode: records a PENDING purchase when the user
   * opens the WhatsApp link, so the admin has a trackable request to confirm
   * instead of relying entirely on the WhatsApp conversation. No provider is
   * involved — confirmation happens via AdminService.confirmPurchase (which
   * calls markPaid), not a webhook.
   */
  async requestManual(userId: string, productId: string, schoolId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
    }
    if (SCHOOL_SCOPED_KINDS.includes(product.kind)) {
      schoolId = await this.assertOwnerOfSchool(userId, schoolId);
    }

    // Re-clicking the WhatsApp link shouldn't pile up duplicate requests.
    const existing = await this.prisma.purchase.findFirst({
      where: { userId, productId, provider: 'manual', status: 'PENDING' },
    });
    if (existing) return { purchaseId: existing.id };

    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        productId,
        schoolId,
        provider: 'manual',
        method: 'whatsapp',
        amountXof: product.priceXof,
        status: 'PENDING',
      },
    });
    return { purchaseId: purchase.id };
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
      /** Payment link — shown as a button and encoded as a QR code. */
      redirectUrl: initiated.redirectUrl,
      /** Provider-supplied QR (base64 PNG), preferred over a QR of the link. */
      qrCode: initiated.qrCode,
      /** USSD instructions for Orange Money / Free Money (show to user, then poll). */
      ussdMessage: initiated.ussdMessage,
    };
  }

  /** Provider callback: resolve the verdict and grant on PAID. */
  async handleWebhook(
    providerId: string,
    payload: unknown,
    headers: Record<string, string>,
    rawBody?: string
  ) {
    const provider = this.payment.getProvider(providerId as any);
    const result = await provider.parseWebhook(payload, headers, rawBody);

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
      if (result.amountXof !== undefined && result.amountXof !== purchase.amountXof) {
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
   * Upserts one entitlement grant for a user within a transaction. Subscription
   * (validityDays set): extends from a still-active expiry (renewal) or from now,
   * so paying early never loses remaining time. Permanent grant (validityDays
   * null) stays non-expiring.
   */
  private async grantEntitlementToUser(
    tx: Prisma.TransactionClient,
    userId: string,
    key: string,
    validityDays: number | null,
    purchaseId: string
  ) {
    const now = new Date();
    const existing = await tx.entitlement.findUnique({
      where: { userId_key: { userId, key } },
    });

    let expiresAt: Date | null = null;
    if (validityDays != null) {
      const base = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
      expiresAt = new Date(base.getTime() + validityDays * 24 * 60 * 60 * 1000);
    }

    await tx.entitlement.upsert({
      where: { userId_key: { userId, key } },
      update: { expiresAt, source: 'purchase', purchaseId },
      create: { userId, key, source: 'purchase', purchaseId, expiresAt },
    });
  }

  /**
   * Extends a School's `subscriptionExpiresAt` or `featuredUntil` within a
   * transaction — same renewal rule as grantEntitlementToUser (extends from a
   * still-active expiry, or from now).
   */
  private async extendSchoolField(
    tx: Prisma.TransactionClient,
    schoolId: string,
    field: 'subscriptionExpiresAt' | 'featuredUntil',
    validityDays: number
  ) {
    const now = new Date();
    const school = await tx.school.findUniqueOrThrow({ where: { id: schoolId } });
    const current = school[field];
    const base = current && current > now ? current : now;
    const next = new Date(base.getTime() + validityDays * 24 * 60 * 60 * 1000);
    await tx.school.update({ where: { id: schoolId }, data: { [field]: next } });
  }

  /**
   * Flips a purchase to PAID and grants its product's entitlements. Idempotent:
   * a no-op if already PAID, and entitlement upserts dedupe on (userId, key).
   *
   * `school_subscription`/`featured_placement` are school-scoped: they extend
   * a field on `purchase.school` rather than granting the buyer an Entitlement
   * (which is a user-scoped concept). Every other kind keeps the direct
   * per-grant Entitlement behavior.
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

    await this.prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'PAID' },
      });

      if (SCHOOL_SCOPED_KINDS.includes(purchase.product.kind)) {
        if (!purchase.schoolId) {
          throw new BadRequestException('Purchase has no schoolId for a school-scoped product');
        }
        const field =
          purchase.product.kind === 'school_subscription' ? 'subscriptionExpiresAt' : 'featuredUntil';
        await this.extendSchoolField(tx, purchase.schoolId, field, purchase.product.validityDays ?? 0);
        return;
      }

      for (const key of purchase.product.grants) {
        await this.grantEntitlementToUser(
          tx,
          purchase.userId,
          key,
          purchase.product.validityDays,
          purchase.id
        );
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
