import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionInputDto } from './dto/question-input.dto';
import { SeriesInputDto } from './dto/series-input.dto';
import { LessonInputDto } from './dto/lesson-input.dto';

/** Estimated Termii cost per SMS/WhatsApp message, in XOF (override via env). */
const SMS_COST_XOF = Number(process.env.SMS_COST_XOF || 15);

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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

  /**
   * Manual subscription activation (temporary WhatsApp payment flow).
   * Grants the product's entitlement keys and records a PAID purchase with
   * provider "manual" so revenue reporting stays accurate. The user gets
   * access immediately — entitlements are read per request, no re-login needed.
   */
  async grantSubscription(userId: string, sku = 'abo_annuel') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const product = await this.prisma.product.findUnique({ where: { sku } });
    if (!product) throw new NotFoundException(`Produit « ${sku} » introuvable`);

    const expiresAt = product.validityDays
      ? new Date(Date.now() + product.validityDays * 24 * 60 * 60 * 1000)
      : null;

    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        productId: product.id,
        provider: 'manual',
        method: 'whatsapp',
        phone: user.phone,
        amountXof: product.priceXof,
        status: 'PAID',
        providerRef: `manual-${Date.now()}`,
      },
    });

    for (const key of product.grants) {
      await this.prisma.entitlement.upsert({
        where: { userId_key: { userId, key } },
        update: { expiresAt, source: 'manual', purchaseId: purchase.id },
        create: { userId, key, expiresAt, source: 'manual', purchaseId: purchase.id },
      });
    }

    return {
      granted: true,
      user: { id: user.id, name: user.name, phone: user.phone },
      product: product.title,
      keys: product.grants,
      expiresAt,
    };
  }

  /** Remove the entitlements granted by a product (manual deactivation). */
  async revokeSubscription(userId: string, sku = 'abo_annuel') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const product = await this.prisma.product.findUnique({ where: { sku } });
    if (!product) throw new NotFoundException(`Produit « ${sku} » introuvable`);

    const removed = await this.prisma.entitlement.deleteMany({
      where: { userId, key: { in: product.grants } },
    });
    return { revoked: removed.count };
  }

  /** Full profile for the admin drawer: subscription, purchases, activity. */
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
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [entitlements, purchases, examCount, streak, otpCount] = await Promise.all([
      this.prisma.entitlement.findMany({
        where: { userId: id },
        select: { key: true, source: true, expiresAt: true, createdAt: true },
      }),
      this.prisma.purchase.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amountXof: true,
          status: true,
          provider: true,
          method: true,
          createdAt: true,
          product: { select: { title: true } },
        },
      }),
      this.prisma.examResult.count({ where: { userId: id } }),
      this.prisma.dailyStreak.findUnique({
        where: { userId: id },
        select: { currentStreak: true, longestStreak: true },
      }),
      user.phone ? this.prisma.smsLog.count({ where: { phone: user.phone } }) : 0,
    ]);

    const totalSpentXof = purchases
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amountXof, 0);

    return { user, entitlements, purchases, examCount, streak, otpCount, totalSpentXof };
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

  // ─── Revenue (recettes) ──────────────────────────────────────────────────────

  async getRevenue() {
    const [paidPurchases, activeSubscriptions, smsSent, smsSimulated] = await Promise.all([
      this.prisma.purchase.findMany({
        where: { status: 'PAID' },
        select: {
          amountXof: true,
          createdAt: true,
          provider: true,
          product: { select: { sku: true, title: true } },
        },
      }),
      this.prisma.entitlement.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      }),
      this.prisma.smsLog.count({ where: { simulated: false } }),
      this.prisma.smsLog.count({ where: { simulated: true } }),
    ]);

    const totalXof = paidPurchases.reduce((s, p) => s + p.amountXof, 0);

    // Revenue by product
    const byProduct = new Map<string, { title: string; count: number; totalXof: number }>();
    for (const p of paidPurchases) {
      const key = p.product.sku;
      const e = byProduct.get(key) ?? { title: p.product.title, count: 0, totalXof: 0 };
      e.count += 1;
      e.totalXof += p.amountXof;
      byProduct.set(key, e);
    }

    // Revenue by month (last 6 months)
    const byMonth = new Map<string, number>();
    for (const p of paidPurchases) {
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
        salesCount: paidPurchases.length,
        activeSubscriptions,
        byProduct: [...byProduct.entries()].map(([sku, v]) => ({ sku, ...v })),
        byMonth: months,
      },
      costs: {
        sms: {
          sent: smsSent,
          simulated: smsSimulated,
          unitXof: SMS_COST_XOF,
          totalXof: smsCostXof,
        },
        email: { sent: 0, totalXof: 0, note: 'Aucun envoi d’e-mails configuré' },
        other: { totalXof: 0 },
      },
      net: { totalXof: totalXof - smsCostXof },
    };
  }
}
