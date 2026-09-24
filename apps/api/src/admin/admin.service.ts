import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, SubscriptionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SchoolService } from '../school/school.service';
import { SchoolStatus } from '@permis2.0/types';
import { QuestionInputDto } from './dto/question-input.dto';
import { SeriesInputDto } from './dto/series-input.dto';
import { LessonInputDto } from './dto/lesson-input.dto';
import { ArticleInputDto } from './dto/article-input.dto';
import { SubscriptionPlanInputDto } from '../subscription/dto/subscription-plan-input.dto';

/** Estimated DExchange cost per SMS/WhatsApp message, in XOF (override via env). */
const SMS_COST_XOF = Number(process.env.SMS_COST_XOF || 15);

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
    private schoolService: SchoolService
  ) {}

  // ─── Users ───────────────────────────────────────────────────────────────────

  async setBlocked(id: string, blocked: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { blocked },
      select: { id: true, name: true, phone: true, role: true, blocked: true },
    });
  }

  async suspendUser(id: string, days: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.user.update({
      where: { id },
      data: { suspendedUntil },
      select: { id: true, name: true, phone: true, role: true, suspendedUntil: true },
    });
  }

  async unsuspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { suspendedUntil: null },
      select: { id: true, name: true, phone: true, role: true, suspendedUntil: true },
    });
  }

  async updateUser(id: string, dto: { name?: string; phone?: string; email?: string; role?: 'USER' | 'ADMIN' }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing) throw new BadRequestException('Ce numéro est déjà utilisé par un autre compte');
    }
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Cet e-mail est déjà utilisé par un autre compte');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        blocked: true,
        suspendedUntil: true,
      },
    });
  }

  /**
   * Manual subscription activation (temporary WhatsApp payment flow). Grants
   * the user an ACTIVE STUDENT subscription immediately — no re-login needed,
   * entitlements are read per request.
   */
  async grantSubscription(userId: string, planId?: string) {
    return this.subscriptionService.adminGrantStudent(userId, planId);
  }

  /** Cancels the user's currently-active STUDENT subscription(s). */
  async revokeSubscription(userId: string) {
    return this.subscriptionService.adminRevokeStudent(userId);
  }

  // ─── Subscription requests ───────────────────────────────────────────────────

  /**
   * All subscriptions, most recent first, optionally filtered by status/type.
   * Used by the admin "Demandes" view to surface manual (WhatsApp) requests
   * awaiting confirmation without having to open each user one by one.
   */
  async listSubscriptions(status?: string, type?: SubscriptionType) {
    return this.subscriptionService.listSubscriptions(status, type);
  }

  /**
   * Confirms a specific PENDING subscription (as opposed to grantSubscription,
   * which creates a brand new ACTIVE one). Delegates to SubscriptionService so
   * the extension logic — including renewal — stays in one place.
   */
  async confirmSubscription(id: string) {
    return this.subscriptionService.confirmSubscription(id);
  }


  // ─── Schools (multi-tenant, Phase 0) ─────────────────────────────────────────

  async listSchools() {
    return this.schoolService.listAll();
  }

  async updateSchoolStatus(id: string, status: SchoolStatus) {
    return this.schoolService.updateStatus(id, status);
  }

  async deleteSchool(id: string) {
    return this.schoolService.delete(id);
  }

  /** Full profile for the admin drawer: subscriptions, activity. */
  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        xp: true,
        level: true,
        role: true,
        blocked: true,
        suspendedUntil: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [subscriptions, examCount, streak, otpCount] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amountXof: true,
          status: true,
          paymentMethod: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          plan: { select: { title: true, type: true } },
        },
      }),
      this.prisma.examResult.count({ where: { userId: id } }),
      this.prisma.dailyStreak.findUnique({
        where: { userId: id },
        select: { currentStreak: true, longestStreak: true },
      }),
      user.phone ? this.prisma.smsLog.count({ where: { phone: user.phone } }) : 0,
    ]);

    const totalSpentXof = subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.amountXof, 0);

    return { user, subscriptions, examCount, streak, otpCount, totalSpentXof };
  }

  // ─── Questions (quiz) CRUD ───────────────────────────────────────────────────

  async listQuestions(skip = 0, take = 10, q?: string, serieId?: string) {
    const where = {
      ...(q ? { enonce: { contains: q, mode: 'insensitive' as const } } : {}),
      ...(serieId ? { serieId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: [{ serieId: 'asc' }, { numero: 'asc' }],
        include: {
          choices: { orderBy: { order: 'asc' } },
          category: { select: { id: true, label: true } },
          series: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.question.count({ where }),
    ]);
    return { data, total };
  }

  async createQuestion(dto: QuestionInputDto) {
    await this.assertQuestionRefs(dto);
    return this.prisma.question.create({
      data: {
        serieId: dto.serieId,
        categoryId: dto.categoryId,
        numero: dto.numero,
        enonce: dto.enonce,
        explication: dto.explication,
        reponses_correctes: dto.reponses_correctes,
        image: dto.image || null,
        signalisation_visible: dto.signalisation_visible || null,
        choices: {
          create: dto.choices.map((text, order) => ({ text, order })),
        },
      },
      include: { choices: { orderBy: { order: 'asc' } } },
    });
  }

  async updateQuestion(id: string, dto: QuestionInputDto) {
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Question not found');
    await this.assertQuestionRefs(dto);

    // Replace choices wholesale — simplest consistent model for the admin form
    return this.prisma.$transaction(async (tx) => {
      await tx.choice.deleteMany({ where: { questionId: id } });
      return tx.question.update({
        where: { id },
        data: {
          serieId: dto.serieId,
          categoryId: dto.categoryId,
          numero: dto.numero,
          enonce: dto.enonce,
          explication: dto.explication,
          reponses_correctes: dto.reponses_correctes,
          image: dto.image || null,
          signalisation_visible: dto.signalisation_visible || null,
          choices: { create: dto.choices.map((text, order) => ({ text, order })) },
        },
        include: { choices: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async deleteQuestion(id: string) {
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Question not found');
    await this.prisma.question.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertQuestionRefs(dto: QuestionInputDto) {
    // Every correct answer must be one of the choices
    for (const rep of dto.reponses_correctes) {
      if (!dto.choices.includes(rep)) {
        throw new BadRequestException(
          `La bonne réponse « ${rep} » doit faire partie des choix proposés`
        );
      }
    }
    const [serie, category] = await Promise.all([
      this.prisma.series.findUnique({ where: { id: dto.serieId } }),
      this.prisma.category.findUnique({ where: { id: dto.categoryId } }),
    ]);
    if (!serie) throw new BadRequestException('Série introuvable');
    if (!category) throw new BadRequestException('Catégorie introuvable');
  }

  // ─── Series (examens) CRUD ───────────────────────────────────────────────────

  async listSeries() {
    return this.prisma.series.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { questions: true } } },
    });
  }

  async createSeries(dto: SeriesInputDto) {
    const dup = await this.prisma.series.findUnique({ where: { code: dto.code } });
    if (dup) throw new BadRequestException(`Le code « ${dto.code} » est déjà utilisé`);
    return this.prisma.series.create({ data: dto });
  }

  async updateSeries(id: string, dto: SeriesInputDto) {
    const existing = await this.prisma.series.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Série introuvable');
    const dup = await this.prisma.series.findUnique({ where: { code: dto.code } });
    if (dup && dup.id !== id)
      throw new BadRequestException(`Le code « ${dto.code} » est déjà utilisé`);
    return this.prisma.series.update({ where: { id }, data: dto });
  }

  async deleteSeries(id: string) {
    const existing = await this.prisma.series.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (!existing) throw new NotFoundException('Série introuvable');
    if (existing._count.questions > 0) {
      throw new BadRequestException(
        `Impossible : la série contient ${existing._count.questions} questions. Supprimez-les ou déplacez-les d'abord.`
      );
    }
    await this.prisma.series.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Lessons (cours) CRUD ────────────────────────────────────────────────────

  async createLesson(dto: LessonInputDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Catégorie introuvable');
    return this.prisma.lesson.create({ data: dto });
  }

  async updateLesson(id: string, dto: LessonInputDto) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leçon introuvable');
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Catégorie introuvable');
    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async deleteLesson(id: string) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leçon introuvable');
    await this.prisma.lesson.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Articles (blog) CRUD ──────────────────────────────────────────────────────

  async listArticles() {
    return this.prisma.article.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async createArticle(dto: ArticleInputDto) {
    const dup = await this.prisma.article.findUnique({ where: { slug: dto.slug } });
    if (dup) throw new BadRequestException(`Le slug « ${dto.slug} » est déjà utilisé`);
    const { published, blocks, faqs, ...rest } = dto;
    return this.prisma.article.create({
      data: {
        ...rest,
        published: !!published,
        publishedAt: published ? new Date() : null,
        blocks: blocks as Prisma.InputJsonValue,
        faqs: faqs as Prisma.InputJsonValue,
      },
    });
  }

  async updateArticle(id: string, dto: ArticleInputDto) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article introuvable');
    const dup = await this.prisma.article.findUnique({ where: { slug: dto.slug } });
    if (dup && dup.id !== id)
      throw new BadRequestException(`Le slug « ${dto.slug} » est déjà utilisé`);
    const { published, blocks, faqs, ...rest } = dto;
    const publishedAt = published ? (existing.publishedAt ?? new Date()) : existing.publishedAt;
    return this.prisma.article.update({
      where: { id },
      data: {
        ...rest,
        published: !!published,
        publishedAt,
        blocks: blocks as Prisma.InputJsonValue,
        faqs: faqs as Prisma.InputJsonValue,
      },
    });
  }

  async deleteArticle(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article introuvable');
    await this.prisma.article.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Subscription plan pricing (élève / école / mise en avant) ───────────────

  async listSubscriptionPlans() {
    return this.subscriptionService.listAllPlans();
  }

  async createSubscriptionPlan(dto: SubscriptionPlanInputDto) {
    return this.subscriptionService.createPlan(dto);
  }

  async updateSubscriptionPlan(id: string, dto: SubscriptionPlanInputDto) {
    return this.subscriptionService.updatePlan(id, dto);
  }

  async deleteSubscriptionPlan(id: string) {
    return this.subscriptionService.deletePlan(id);
  }

  // ─── Revenue (recettes) ──────────────────────────────────────────────────────

  async getRevenue() {
    const now = new Date();
    const [activeSubs, studentActive, schoolActive, schoolFeaturedActive, smsSent, smsSimulated] =
      await Promise.all([
        this.prisma.subscription.findMany({
          where: { status: 'ACTIVE' },
          select: {
            amountXof: true,
            createdAt: true,
            plan: { select: { id: true, title: true } },
          },
        }),
        this.prisma.subscription.count({
          where: { status: 'ACTIVE', endDate: { gt: now }, plan: { type: 'STUDENT' } },
        }),
        this.prisma.school.count({ where: { subscriptionExpiresAt: { gt: now } } }),
        this.prisma.school.count({ where: { featuredUntil: { gt: now } } }),
        this.prisma.smsLog.count({ where: { simulated: false } }),
        this.prisma.smsLog.count({ where: { simulated: true } }),
      ]);

    const totalXof = activeSubs.reduce((s, p) => s + p.amountXof, 0);
    // Active subscriptions across all 3 tiers — STUDENT rows are counted
    // directly; SCHOOL/SCHOOL_FEATURED are gated by the School fields
    // themselves (see Subscription model doc), not by a Subscription row.
    const activeSubscriptions = studentActive + schoolActive + schoolFeaturedActive;

    // Revenue by plan
    const byPlan = new Map<string, { title: string; count: number; totalXof: number }>();
    for (const p of activeSubs) {
      const key = p.plan.id;
      const e = byPlan.get(key) ?? { title: p.plan.title, count: 0, totalXof: 0 };
      e.count += 1;
      e.totalXof += p.amountXof;
      byPlan.set(key, e);
    }

    // Revenue by month (last 6 months)
    const byMonth = new Map<string, number>();
    for (const p of activeSubs) {
      const key = p.createdAt.toISOString().slice(0, 7); // YYYY-MM
      byMonth.set(key, (byMonth.get(key) ?? 0) + p.amountXof);
    }
    const months = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({ month, totalXof: total }));

    const smsCostXof = smsSent * SMS_COST_XOF;

    return {
      revenue: {
        totalXof,
        salesCount: activeSubs.length,
        activeSubscriptions,
        byProduct: [...byPlan.entries()].map(([planId, v]) => ({ sku: planId, ...v })),
        byMonth: months,
      },
      costs: {
        sms: {
          sent: smsSent,
          simulated: smsSimulated,
          unitXof: SMS_COST_XOF,
          totalXof: smsCostXof,
        },
        // EmailService (SMTP/nodemailer) does send real email — invoices, devis —
        // but nothing logs each send the way SmsLog does for SMS/WhatsApp, so
        // there's no count to cost out yet. Not "unconfigured", just untracked.
        email: { sent: 0, totalXof: 0, note: 'Envois non comptabilisés pour le moment' },
        other: { totalXof: 0 },
      },
      net: { totalXof: totalXof - smsCostXof },
    };
  }
}
