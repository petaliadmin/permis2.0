import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { Role, SchoolEnrollmentStatus, SchoolMemberRole, SchoolStatus } from '@permis2.0/types';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { AddSchoolMemberDto } from './dto/add-school-member.dto';
import { CreateEnrollmentRequestDto } from './dto/create-enrollment-request.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';

const STAFF_NOTIFIABLE_ROLES = [
  SchoolMemberRole.OWNER,
  SchoolMemberRole.MANAGER,
  SchoolMemberRole.SECRETARY,
];

const ACTIVE_STUDENTS_COUNT = { students: { where: { status: 'ACTIVE' as const } } };

const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

/** Flattens Prisma's `_count.students` into the flat `studentsCount` field exposed by the API. */
function withStudentsCount<T extends { _count: { students: number } }>(
  school: T
): Omit<T, '_count'> & { studentsCount: number } {
  const { _count, ...rest } = school;
  return { ...rest, studentsCount: _count.students };
}

/**
 * Phase 0 fondations: CRUD minimal pour les écoles (tenants) + gestion du
 * staff (SchoolMembership). Isolation multi-tenant : toute sous-ressource
 * DOIT être filtrée par un `where` composite `{ id, schoolId }`, jamais par
 * `{ id }` seul — voir SchoolRolesGuard pour la vérification d'accès à schoolId.
 */
@Injectable()
export class SchoolService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  async listActive(filters: {
    city?: string;
    category?: string;
    maxPriceXof?: number;
    q?: string;
    take?: number;
  }) {
    const take = Math.min(filters.take ?? 20, 50);
    return this.prisma.school.findMany({
      where: {
        status: SchoolStatus.ACTIVE,
        ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' } } : {}),
        ...(filters.category ? { licenseCategories: { has: filters.category } } : {}),
        ...(filters.maxPriceXof != null ? { priceXof: { lte: filters.maxPriceXof } } : {}),
        ...(filters.q ? { name: { contains: filters.q, mode: 'insensitive' } } : {}),
      },
      include: { _count: { select: ACTIVE_STUDENTS_COUNT } },
      orderBy: { createdAt: 'desc' },
      take,
    }).then((schools) => schools.map(withStudentsCount));
  }

  async getOne(schoolId: string, viewer?: { userId: string; role: Role }) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { _count: { select: ACTIVE_STUDENTS_COUNT } },
    });
    if (!school) throw new NotFoundException('École introuvable');
    await this.assertVisible(school, viewer);
    return withStudentsCount(school);
  }

  async getBySlug(slug: string, viewer?: { userId: string; role: Role }) {
    const school = await this.prisma.school.findUnique({
      where: { slug },
      include: { _count: { select: ACTIVE_STUDENTS_COUNT } },
    });
    if (!school) throw new NotFoundException('École introuvable');
    await this.assertVisible(school, viewer);
    return withStudentsCount(school);
  }

  /** Non-active schools are only visible to the platform admin or one of their own staff. */
  private async assertVisible(
    school: { id: string; status: string },
    viewer?: { userId: string; role: Role }
  ) {
    if (school.status === SchoolStatus.ACTIVE) return;
    if (viewer?.role === Role.ADMIN) return;
    const membership = viewer
      ? await this.prisma.schoolMembership.findFirst({
          where: { schoolId: school.id, userId: viewer.userId, active: true },
          select: { id: true },
        })
      : null;
    if (!membership) throw new NotFoundException('École introuvable');
  }

  async listMine(userId: string) {
    const memberships = await this.prisma.schoolMembership.findMany({
      where: { userId, active: true },
      include: { school: true },
    });
    return memberships.map((m) => ({ ...m.school, myRole: m.role }));
  }

  async create(userId: string, dto: CreateSchoolDto) {
    const base = slugify(dto.name) || 'ecole';
    return this.prisma.$transaction(async (tx) => {
      // Retry on the rare slug collision instead of pre-checking existence.
      for (let attempt = 0; attempt < 5; attempt++) {
        const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
        try {
          const school = await tx.school.create({
            data: { ...dto, slug, status: SchoolStatus.PENDING },
          });
          await tx.schoolMembership.create({
            data: { schoolId: school.id, userId, role: SchoolMemberRole.OWNER },
          });
          return school;
        } catch (err: any) {
          if (err?.code !== 'P2002' || attempt === 4) throw err;
        }
      }
      throw new Error('Impossible de générer un slug unique');
    });
  }

  async update(schoolId: string, dto: UpdateSchoolDto) {
    // schoolId already validated by SchoolRolesGuard for this request's caller.
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('École introuvable');
    return this.prisma.school.update({ where: { id: schoolId }, data: dto });
  }

  async listMembers(schoolId: string) {
    return this.prisma.schoolMembership.findMany({
      where: { schoolId, active: true },
      include: { user: { select: { id: true, name: true, phone: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(schoolId: string, dto: AddSchoolMemberDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return this.prisma.schoolMembership.upsert({
      where: { schoolId_userId_role: { schoolId, userId: dto.userId, role: dto.role } },
      create: { schoolId, userId: dto.userId, role: dto.role },
      update: { active: true },
    });
  }

  async removeMember(schoolId: string, membershipId: string) {
    // Composite where — the "règle d'or": never trust membershipId alone.
    const membership = await this.prisma.schoolMembership.findFirst({
      where: { id: membershipId, schoolId },
    });
    if (!membership) throw new NotFoundException('Membre introuvable');

    if (membership.role === SchoolMemberRole.OWNER) {
      const otherOwners = await this.prisma.schoolMembership.count({
        where: { schoolId, role: SchoolMemberRole.OWNER, active: true, id: { not: membershipId } },
      });
      if (otherOwners === 0) {
        throw new ForbiddenException("Impossible de retirer le dernier propriétaire de l'école");
      }
    }

    return this.prisma.schoolMembership.update({
      where: { id: membershipId },
      data: { active: false },
    });
  }

  // ─── Pré-inscription (SchoolEnrollmentRequest) ──────────────────────────────

  async submitEnrollmentRequest(
    schoolId: string,
    dto: CreateEnrollmentRequestDto,
    studentUserId?: string
  ) {
    // Same non-disclosure logic as getOne: a non-ACTIVE school 404s for the public.
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school || school.status !== SchoolStatus.ACTIVE) {
      throw new NotFoundException('École introuvable');
    }

    const request = await this.prisma.schoolEnrollmentRequest.create({
      data: { ...dto, schoolId, studentUserId: studentUserId ?? null },
    });

    const staff = await this.prisma.schoolMembership.findMany({
      where: { schoolId, active: true, role: { in: STAFF_NOTIFIABLE_ROLES } },
      select: { userId: true },
    });
    await Promise.all(
      staff.map((m) =>
        this.notificationService.create(
          m.userId,
          'Nouvelle pré-inscription',
          `${dto.firstName} ${dto.lastName} a demandé à s'inscrire à ${school.name}.`,
          'info'
        )
      )
    );

    return request;
  }

  async listEnrollmentRequests(schoolId: string, status?: SchoolEnrollmentStatus) {
    return this.prisma.schoolEnrollmentRequest.findMany({
      where: { schoolId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateEnrollmentStatus(
    schoolId: string,
    requestId: string,
    staffUserId: string,
    dto: UpdateEnrollmentStatusDto
  ) {
    // Composite where — the "règle d'or": never trust requestId alone.
    const request = await this.prisma.schoolEnrollmentRequest.findFirst({
      where: { id: requestId, schoolId },
    });
    if (!request) throw new NotFoundException('Demande introuvable');

    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.schoolEnrollmentRequest.update({
        where: { id: requestId },
        data: {
          status: dto.status,
          statusNote: dto.statusNote,
          respondedByUserId: staffUserId,
          respondedAt: new Date(),
        },
      });

      if (dto.status === SchoolEnrollmentStatus.CONFIRMED && request.studentUserId) {
        await tx.schoolStudent.upsert({
          where: { schoolId_userId: { schoolId, userId: request.studentUserId } },
          create: {
            schoolId,
            userId: request.studentUserId,
            enrollmentRequestId: requestId,
            licenseCategory: request.licenseCategory,
          },
          update: {},
        });
      }

      return updated;
    });

    if (request.studentUserId) {
      await this.notificationService.create(
        request.studentUserId,
        "Mise à jour de votre pré-inscription",
        this.statusMessage(dto.status),
        dto.status === SchoolEnrollmentStatus.REFUSED ? 'warning' : 'success'
      );
    }

    return updated;
  }

  private statusMessage(status: SchoolEnrollmentStatus): string {
    switch (status) {
      case SchoolEnrollmentStatus.IN_PROGRESS:
        return 'Votre demande de pré-inscription est en cours de traitement.';
      case SchoolEnrollmentStatus.ACCEPTED:
        return 'Votre demande de pré-inscription a été acceptée.';
      case SchoolEnrollmentStatus.REFUSED:
        return "Votre demande de pré-inscription n'a pas été retenue.";
      case SchoolEnrollmentStatus.CONFIRMED:
        return 'Votre inscription est confirmée. Bienvenue !';
      default:
        return 'Le statut de votre demande de pré-inscription a changé.';
    }
  }

  // ─── Superadmin (délégué depuis AdminController) ────────────────────────────

  async listAll() {
    return this.prisma.school.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(schoolId: string, status: SchoolStatus) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('École introuvable');
    return this.prisma.school.update({ where: { id: schoolId }, data: { status } });
  }
}
