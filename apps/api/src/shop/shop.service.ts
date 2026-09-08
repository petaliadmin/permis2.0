import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EntitlementService } from '../entitlement/entitlement.service';
import { PaymentService } from './payment/payment.service';
import { CheckoutDto } from './dto/checkout.dto';

/** Short, unambiguous claim code for a school-pack seat (excludes 0/O/1/I). */
function generateSeatCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

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
   * Manual (WhatsApp) payment mode: records a PENDING purchase when the user
   * opens the WhatsApp link, so the admin has a trackable request to confirm
   * instead of relying entirely on the WhatsApp conversation. No provider is
   * involved — confirmation happens via AdminService.confirmPurchase (which
   * calls markPaid), not a webhook.
   */
  async requestManual(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
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
   * so paying/claiming early never loses remaining time. Permanent grant
   * (validityDays null) stays non-expiring. Shared by markPaid (direct purchase)
   * and claimSeat (school-pack seat claim) so both follow the same expiry rule.
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
   * Flips a purchase to PAID and grants its product's entitlements. Idempotent:
   * a no-op if already PAID, and entitlement upserts dedupe on (userId, key).
   *
   * A `school_pack` product is a white-label bulk license (Horizon 0, sold to
   * an auto-école): the buyer is the school's referent account, not a student,
   * so it does NOT receive the grants directly. Instead we generate `seats`
   * claimable `PackSeat` codes; each student redeems one via claimSeat().
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

      if (purchase.product.kind === 'school_pack') {
        const seats = purchase.product.seats ?? 0;
        for (let i = 0; i < seats; i++) {
          // Retry on the rare code collision (unique constraint) instead of
          // pre-checking existence — cheaper for a handful of seats per pack.
          for (let attempt = 0; attempt < 5; attempt++) {
            try {
              await tx.packSeat.create({
                data: { purchaseId: purchase.id, code: generateSeatCode() },
              });
              break;
            } catch (err: any) {
              if (err?.code !== 'P2002' || attempt === 4) throw err;
            }
          }
        }
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
   * PAID school_pack purchases with their seat pool. With no userId, this is
   * platform-wide (the superadmin "Auto-écoles" view); scoped to a userId, it's
   * "my packs" for the buyer's own /auto-ecole dashboard.
   */
  async listSchoolPacks(userId?: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: {
        status: 'PAID',
        product: { kind: 'school_pack' },
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        product: { select: { title: true, sku: true, seats: true } },
        packSeats: {
          select: { id: true, code: true, claimedAt: true, claimedBy: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return purchases.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      buyer: p.user,
      product: p.product,
      seats: p.packSeats,
      claimedCount: p.packSeats.filter((s) => s.claimedAt).length,
    }));
  }

  /**
   * A student redeems a school-pack seat code, granting them the pack
   * product's entitlements directly (bypassing the buyer/referent account).
   */
  async claimSeat(userId: string, code: string) {
    const seat = await this.prisma.packSeat.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { purchase: { include: { product: true } } },
    });
    if (!seat) {
      throw new NotFoundException('Code invalide');
    }
    if (seat.purchase.status !== 'PAID') {
      throw new BadRequestException('Ce pack n’est pas encore actif');
    }

    await this.prisma.$transaction(async (tx) => {
      // Atomic claim: only succeeds if still unclaimed, closing the race
      // between two students submitting the same code concurrently.
      const { count } = await tx.packSeat.updateMany({
        where: { id: seat.id, claimedAt: null },
        data: { claimedByUserId: userId, claimedAt: new Date() },
      });
      if (count === 0) {
        throw new BadRequestException('Ce code a déjà été utilisé');
      }
      for (const key of seat.purchase.product.grants) {
        await this.grantEntitlementToUser(
          tx,
          userId,
          key,
          seat.purchase.product.validityDays,
          seat.purchase.id
        );
      }
    });

    return { ok: true, grants: seat.purchase.product.grants };
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
