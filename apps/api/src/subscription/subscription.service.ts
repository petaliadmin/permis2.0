import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma, SubscriptionType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EntitlementService } from '../entitlement/entitlement.service';
import { RequestSubscriptionDto } from './dto/request-subscription.dto';
import { SubscriptionPlanInputDto } from './dto/subscription-plan-input.dto';
import { SchoolMemberRole } from '@permis2.0/types';

const SCHOOL_SCOPED_TYPES: SubscriptionType[] = ['SCHOOL', 'SCHOOL_FEATURED'];

/**
 * Standard subscription system: one catalog (SubscriptionPlan) covering the
 * three tiers — STUDENT (premium access), SCHOOL (accès espace de gestion),
 * SCHOOL_FEATURED (mise en avant "Top 20"). Every request creates a new
 * Subscription row (no upsert), so renewals stay in a real ledger.
 *
 * Payment is manual/WhatsApp only for now (Orange Money / Carte bancaire stay
 * UI-disabled): requestSubscription never accepts a client-supplied payment
 * method, and confirmation is always an explicit admin action.
 */
@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementService
  ) {}

  async listPlans(opts: { type?: SubscriptionType; activeOnly?: boolean } = {}) {
    const { type, activeOnly = true } = opts;
    return this.prisma.subscriptionPlan.findMany({
      where: { ...(type ? { type } : {}), ...(activeOnly ? { active: true } : {}) },
      orderBy: [{ type: 'asc' }, { ordre: 'asc' }],
    });
  }

  async getMyEntitlements(userId: string) {
    const keys = await this.entitlements.getKeys(userId);
    const premium = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', plan: { type: 'STUDENT' }, endDate: { gt: new Date() } },
      orderBy: { endDate: 'desc' },
      select: { endDate: true },
    });
    return { keys, premiumExpiresAt: premium?.endDate ?? null };
  }

  async getMySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true, school: { select: { id: true, name: true } } },
    });
  }

  /**
   * A SCHOOL/SCHOOL_FEATURED request must be attributed to a school the buyer
   * actually owns — otherwise anyone could pay to extend a stranger's
   * subscription or visibility. Returns the validated schoolId, or throws.
   */
  private async assertOwnerOfSchool(userId: string, schoolId: string | undefined) {
    if (!schoolId) throw new BadRequestException('schoolId requis pour ce type de plan');
    const membership = await this.prisma.schoolMembership.findFirst({
      where: { schoolId, userId, active: true, role: SchoolMemberRole.OWNER },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException("Vous n'êtes pas propriétaire de cette auto-école");
    return schoolId;
  }

  /**
   * Manual (WhatsApp) request: records a PENDING subscription so it shows up
   * in the admin "Demandes" list. Re-requesting the same plan while a PENDING
   * row already exists returns that row instead of piling up duplicates.
   */
  async requestSubscription(userId: string, dto: RequestSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.active) throw new NotFoundException('Plan not found');

    let schoolId = dto.schoolId;
    if (SCHOOL_SCOPED_TYPES.includes(plan.type)) {
      schoolId = await this.assertOwnerOfSchool(userId, schoolId);
    } else {
      schoolId = undefined;
    }

    // Only WHATSAPP/WAVE ever reach here (DTO-validated) — both manual,
    // transfer-then-confirm channels. Orange Money/Card stay UI-disabled.
    const paymentMethod = dto.method ?? 'WHATSAPP';

    const existing = await this.prisma.subscription.findFirst({
      where: { userId, planId: plan.id, status: 'PENDING', paymentMethod },
    });
    if (existing) return existing;

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        schoolId,
        paymentMethod,
        amountXof: plan.priceXof,
        status: 'PENDING',
      },
    });
  }

  /**
   * Extends a School's `subscriptionExpiresAt` or `featuredUntil` within a
   * transaction. Renewal rule: extend from a still-active expiry, or from
   * now — paying early never loses remaining time.
   */
  private async extendSchoolField(
    tx: Prisma.TransactionClient,
    schoolId: string,
    field: 'subscriptionExpiresAt' | 'featuredUntil',
    durationDays: number
  ) {
    const now = new Date();
    const school = await tx.school.findUniqueOrThrow({ where: { id: schoolId } });
    const current = school[field];
    const base = current && current > now ? current : now;
    const next = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
    await tx.school.update({ where: { id: schoolId }, data: { [field]: next } });
    return next;
  }

  /**
   * Confirms a PENDING subscription. Idempotent — a no-op if already ACTIVE.
   * STUDENT: extends the user's own active endDate (renewal-aware). SCHOOL /
   * SCHOOL_FEATURED: extends the matching School field with the same
   * renewal rule, and mirrors the resulting date onto this row for
   * admin display/audit (the School field remains the actual access gate).
   */
  async confirmSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status === 'ACTIVE') return subscription;

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      let endDate: Date;

      if (SCHOOL_SCOPED_TYPES.includes(subscription.plan.type)) {
        if (!subscription.schoolId) {
          throw new BadRequestException('Subscription has no schoolId for a school-scoped plan');
        }
        const field =
          subscription.plan.type === 'SCHOOL' ? 'subscriptionExpiresAt' : 'featuredUntil';
        endDate = await this.extendSchoolField(tx, subscription.schoolId, field, subscription.plan.durationDays);
      } else {
        const currentActive = await tx.subscription.findFirst({
          where: {
            userId: subscription.userId,
            status: 'ACTIVE',
            plan: { type: 'STUDENT' },
            endDate: { gt: now },
            id: { not: subscription.id },
          },
          orderBy: { endDate: 'desc' },
        });
        const base = currentActive?.endDate && currentActive.endDate > now ? currentActive.endDate : now;
        endDate = new Date(base.getTime() + subscription.plan.durationDays * 24 * 60 * 60 * 1000);
      }

      return tx.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE', startDate: now, endDate, confirmedAt: now },
      });
    });
  }

  /** Admin instant grant (no PENDING step) — e.g. goodwill/manual activation from admin/users. */
  async adminGrantStudent(userId: string, planId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = planId
      ? await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      : await this.prisma.subscriptionPlan.findFirst({
          where: { type: 'STUDENT', active: true },
          orderBy: { ordre: 'asc' },
        });
    if (!plan) throw new NotFoundException('Plan élève introuvable');

    const now = new Date();
    const currentActive = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', plan: { type: 'STUDENT' }, endDate: { gt: now } },
      orderBy: { endDate: 'desc' },
    });
    const base = currentActive?.endDate && currentActive.endDate > now ? currentActive.endDate : now;
    const endDate = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        paymentMethod: 'ADMIN',
        amountXof: plan.priceXof,
        status: 'ACTIVE',
        startDate: now,
        endDate,
        confirmedAt: now,
      },
    });

    return {
      granted: true,
      user: { id: user.id, name: user.name, phone: user.phone },
      plan: plan.title,
      endDate,
      subscriptionId: subscription.id,
    };
  }

  /** Cancels every currently-active STUDENT subscription for a user. */
  async adminRevokeStudent(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const result = await this.prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE', plan: { type: 'STUDENT' } },
      data: { status: 'CANCELLED' },
    });
    return { revoked: result.count };
  }

  // ─── Admin plan catalog ──────────────────────────────────────────────────

  async listAllPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: [{ type: 'asc' }, { ordre: 'asc' }] });
  }

  async createPlan(dto: SubscriptionPlanInputDto) {
    return this.prisma.subscriptionPlan.create({ data: { ...dto, active: dto.active ?? true } });
  }

  async updatePlan(id: string, dto: SubscriptionPlanInputDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plan introuvable');
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async deletePlan(id: string) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plan introuvable');
    const inUse = await this.prisma.subscription.count({ where: { planId: id } });
    if (inUse > 0) {
      throw new BadRequestException(
        'Ce plan a déjà des abonnements associés — désactivez-le plutôt que de le supprimer.'
      );
    }
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Admin subscriptions list / confirm (Demandes) ──────────────────────

  async listSubscriptions(status?: string, type?: SubscriptionType) {
    return this.prisma.subscription.findMany({
      where: { ...(status ? { status: status as any } : {}), ...(type ? { plan: { type } } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        plan: { select: { title: true, type: true } },
        school: { select: { id: true, name: true } },
      },
    });
  }
}
