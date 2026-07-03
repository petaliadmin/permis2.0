import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Server-side access control for premium content (Sprint 6). The single source
 * of truth for the entitlement KEY scheme:
 *   - premium_all      → unlocks everything
 *   - pack_quiz        → all premium Series (Code quizzes)
 *   - pack_exams       → all ExamTemplates
 *   - pack_formation   → all premium DrivingCourses (Conduite)
 *   - exam:<templateId>→ one ExamTemplate (per-unit purchase)
 *
 * Access is resolved "any-of": free content OR a matching key the user holds.
 * Guests (no userId) hold no keys.
 */
@Injectable()
export class EntitlementService {
  constructor(private prisma: PrismaService) {}

  /** Non-expired entitlement keys for a user. Empty for guests. */
  async getKeys(userId?: string): Promise<string[]> {
    if (!userId) return [];
    const now = new Date();
    const rows = await this.prisma.entitlement.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { key: true },
    });
    return rows.map((r) => r.key);
  }

  async has(userId: string | undefined, key: string): Promise<boolean> {
    const keys = await this.getKeys(userId);
    return keys.includes(key);
  }

  async hasAccessToSeries(
    userId: string | undefined,
    series: { isFree?: boolean },
  ): Promise<boolean> {
    if (series.isFree) return true;
    const keys = await this.getKeys(userId);
    return keys.includes('premium_all') || keys.includes('pack_quiz');
  }

  async hasAccessToCourse(
    userId: string | undefined,
    course: { isFree?: boolean },
  ): Promise<boolean> {
    if (course.isFree) return true;
    const keys = await this.getKeys(userId);
    return keys.includes('premium_all') || keys.includes('pack_formation');
  }

  async hasAccessToExamTemplate(
    userId: string | undefined,
    template: { id: string; isFree?: boolean },
  ): Promise<boolean> {
    if (template.isFree) return true;
    const keys = await this.getKeys(userId);
    return (
      keys.includes('premium_all') ||
      keys.includes('pack_exams') ||
      keys.includes(`exam:${template.id}`)
    );
  }
}
