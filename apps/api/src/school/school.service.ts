import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  Role,
  SchoolEnrollmentStatus,
  SchoolMemberRole,
  SchoolPaymentStatus,
  SchoolPaymentType,
  SchoolStatus,
  SchoolStudentStatus,
} from '@permis2.0/types';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { AddSchoolMemberDto } from './dto/add-school-member.dto';
import { CreateEnrollmentRequestDto } from './dto/create-enrollment-request.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { BulkAddStudentsDto } from './dto/bulk-add-students.dto';
import { BulkAddMembersDto } from './dto/bulk-add-members.dto';
import { BulkCreateVehiclesDto } from './dto/bulk-create-vehicles.dto';
import { SendPaymentEmailDto } from './dto/send-payment-email.dto';
import { EmailService } from '../email/email.service';

export interface BulkRowResult {
  index: number;
  ok: boolean;
  error?: string;
}

const EXPIRY_ALERT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    private notificationService: NotificationService,
    private emailService: EmailService
  ) {}

  /** Normalizes to the same 9-digit local format User.phone/guestPhone are stored in. */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^221/, '');
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  async listActive(filters: {
    city?: string;
    category?: string;
    maxPriceXof?: number;
    q?: string;
    take?: number;
    /** Homepage "Top 20": only schools with a currently-active featured_placement. */
    featured?: boolean;
  }) {
    const take = Math.min(filters.take ?? 20, filters.featured ? 20 : 50);
    return this.prisma.school.findMany({
      where: {
        status: SchoolStatus.ACTIVE,
        ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' } } : {}),
        ...(filters.category ? { licenseCategories: { has: filters.category } } : {}),
        ...(filters.maxPriceXof != null ? { priceXof: { lte: filters.maxPriceXof } } : {}),
        ...(filters.q ? { name: { contains: filters.q, mode: 'insensitive' } } : {}),
        ...(filters.featured ? { featuredUntil: { gt: new Date() } } : {}),
      },
      include: { _count: { select: ACTIVE_STUDENTS_COUNT } },
      orderBy: filters.featured ? { featuredUntil: 'desc' } : { createdAt: 'desc' },
      take,
    }).then((schools) => schools.map(withStudentsCount));
  }

  /** Lean, unbounded list for sitemap generation — active schools only. */
  async listSlugsForSitemap() {
    return this.prisma.school.findMany({
      where: { status: SchoolStatus.ACTIVE },
      select: { slug: true, updatedAt: true, city: true },
    });
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
      include: { school: { include: { _count: { select: ACTIVE_STUDENTS_COUNT } } } },
    });
    return memberships.map((m) => ({ ...withStudentsCount(m.school), myRole: m.role }));
  }

  private static readonly SCHOOL_SUMMARY_SELECT = {
    id: true,
    slug: true,
    name: true,
    city: true,
    district: true,
    logoUrl: true,
  } as const;

  /** assignedInstructor/assignedVehicle — shared by listStudents/getStudent/listMyEnrollments. */
  private static readonly STUDENT_ASSIGNMENTS_INCLUDE = {
    assignedInstructor: { include: { user: { select: { id: true, name: true, phone: true } } } },
    assignedVehicle: { select: { id: true, plate: true, brand: true, model: true } },
  } as const;

  /** Schools the current user is a STUDENT at (SchoolStudent) — distinct from listMine() (staff). */
  async listMyEnrollments(userId: string) {
    return this.prisma.schoolStudent.findMany({
      where: { userId },
      include: {
        school: { select: SchoolService.SCHOOL_SUMMARY_SELECT },
        ...SchoolService.STUDENT_ASSIGNMENTS_INCLUDE,
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  /** The current user's own pre-registration requests, across all schools. */
  async listMyEnrollmentRequests(userId: string) {
    return this.prisma.schoolEnrollmentRequest.findMany({
      where: { studentUserId: userId },
      include: { school: { select: SchoolService.SCHOOL_SUMMARY_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** The current user's own sessions (as a student), across all schools. */
  async listMySessions(userId: string) {
    return this.prisma.session.findMany({
      where: { student: { userId } },
      include: {
        school: { select: SchoolService.SCHOOL_SUMMARY_SELECT },
        instructor: { include: { user: { select: { id: true, name: true, phone: true } } } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  /** The current user's own invoices/payments (as a student), across all schools. */
  async listMyPayments(userId: string) {
    return this.prisma.schoolPayment.findMany({
      where: { student: { userId } },
      include: { school: { select: SchoolService.SCHOOL_SUMMARY_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateSchoolDto) {
    const base = slugify(dto.name) || 'ecole';
    // 3-month free trial from account creation — trialEndsAt is set once and
    // never touched again (see SchoolService.update / ShopService.markPaid,
    // which only ever move subscriptionExpiresAt forward), so the frontend
    // can later tell "still on the original trial" (subscriptionExpiresAt
    // === trialEndsAt) apart from "a subscription has extended past it".
    const trialEndsAt = this.addMonths(new Date(), 3);
    // Retry on the rare slug collision instead of pre-checking existence.
    // Each attempt gets its OWN transaction: once a query inside a Postgres
    // transaction errors, that transaction is aborted and every later query
    // on it fails with 25P02 ("current transaction is aborted") — retrying
    // the create with a new slug inside the same `tx` never actually works,
    // it just replaces the real P2002 with a confusing abort error.
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
      try {
        return await this.prisma.$transaction(async (tx) => {
          const school = await tx.school.create({
            data: {
              ...dto,
              slug,
              status: SchoolStatus.PENDING,
              subscriptionExpiresAt: trialEndsAt,
              trialEndsAt,
            },
          });
          await tx.schoolMembership.create({
            data: { schoolId: school.id, userId, role: SchoolMemberRole.OWNER },
          });
          return school;
        });
      } catch (err: any) {
        if (err?.code !== 'P2002' || attempt === 4) throw err;
      }
    }
    throw new Error('Impossible de générer un slug unique');
  }

  async update(schoolId: string, dto: UpdateSchoolDto) {
    // schoolId already validated by SchoolRolesGuard for this request's caller.
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('École introuvable');

    // `priceXof` (used by the /ecoles search filter and "à partir de" cards)
    // is derived, never client-set once per-category pricing is in play — the
    // school edits pricesByCategory, this keeps the summary field in sync.
    const data: Omit<UpdateSchoolDto, 'priceXof'> & { priceXof?: number | null } = { ...dto };
    if (dto.pricesByCategory) {
      const values = Object.values(dto.pricesByCategory).filter(
        (v): v is number => typeof v === 'number' && Number.isFinite(v)
      );
      data.priceXof = values.length > 0 ? Math.min(...values) : null;
    }

    return this.prisma.school.update({ where: { id: schoolId }, data });
  }

  async listMembers(schoolId: string) {
    return this.prisma.schoolMembership.findMany({
      where: { schoolId, active: true },
      include: { user: { select: { id: true, name: true, phone: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Exact phone match only — no fuzzy search, and only {id,name,phone} are exposed. */
  async lookupUserByPhone(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone: this.normalizePhone(phone) },
      select: { id: true, name: true, phone: true },
    });
    if (!user) throw new NotFoundException('Aucun utilisateur avec ce numéro');
    return user;
  }

  async addMember(schoolId: string, dto: AddSchoolMemberDto) {
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('Utilisateur introuvable');

      return this.prisma.schoolMembership.upsert({
        where: { schoolId_userId_role: { schoolId, userId: dto.userId, role: dto.role } },
        create: { schoolId, userId: dto.userId, role: dto.role },
        update: { active: true },
      });
    }

    return this.prisma.schoolMembership.create({
      data: {
        schoolId,
        role: dto.role,
        guestName: dto.guestName,
        guestPhone: this.normalizePhone(dto.guestPhone!),
      },
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
      where: { schoolId, active: true, role: { in: STAFF_NOTIFIABLE_ROLES }, userId: { not: null } },
      select: { userId: true },
    });
    await Promise.all(
      staff.map((m) =>
        this.notificationService.create(
          m.userId!,
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

  // ─── Élèves (SchoolStudent) ──────────────────────────────────────────────────

  async listStudents(schoolId: string, status?: SchoolStudentStatus) {
    return this.prisma.schoolStudent.findMany({
      where: { schoolId, ...(status ? { status } : {}) },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        ...SchoolService.STUDENT_ASSIGNMENTS_INCLUDE,
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async getStudent(schoolId: string, id: string) {
    // Composite where — the "règle d'or": never trust id alone.
    const student = await this.prisma.schoolStudent.findFirst({
      where: { id, schoolId },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        ...SchoolService.STUDENT_ASSIGNMENTS_INCLUDE,
      },
    });
    if (!student) throw new NotFoundException('Élève introuvable');
    return student;
  }

  async updateStudent(schoolId: string, id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.schoolStudent.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundException('Élève introuvable');

    // Cross-tenant guard: an instructor/vehicle assigned to a student must
    // belong to the SAME school — otherwise a staff member could reach into
    // another school's fleet/team by id.
    if (dto.assignedInstructorMembershipId) {
      const instructor = await this.prisma.schoolMembership.findFirst({
        where: {
          id: dto.assignedInstructorMembershipId,
          schoolId,
          active: true,
          role: { in: [SchoolMemberRole.INSTRUCTOR, SchoolMemberRole.COACH] },
        },
      });
      if (!instructor) throw new BadRequestException('Moniteur/coach introuvable pour cette école');
    }
    if (dto.assignedVehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id: dto.assignedVehicleId, schoolId },
      });
      if (!vehicle) throw new BadRequestException('Véhicule introuvable pour cette école');
    }

    return this.prisma.schoolStudent.update({ where: { id }, data: dto });
  }

  async addStudent(schoolId: string, dto: AddStudentDto) {
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('Utilisateur introuvable');

      // Idempotent: adding an already-attached student just updates their category.
      return this.prisma.schoolStudent.upsert({
        where: { schoolId_userId: { schoolId, userId: dto.userId } },
        create: { schoolId, userId: dto.userId, licenseCategory: dto.licenseCategory },
        update: { licenseCategory: dto.licenseCategory },
      });
    }

    return this.prisma.schoolStudent.create({
      data: {
        schoolId,
        licenseCategory: dto.licenseCategory,
        guestName: dto.guestName,
        guestPhone: this.normalizePhone(dto.guestPhone!),
      },
    });
  }

  // ─── Import en masse (contact, CSV/Excel) ────────────────────────────────────

  /**
   * Each row is resolved to an existing account by phone when possible,
   * otherwise created as a guest — same rule as the single-row add flows.
   * Rows are processed independently so one bad row doesn't block the rest.
   */
  async addStudentsBulk(schoolId: string, dto: BulkAddStudentsDto): Promise<BulkRowResult[]> {
    const results: BulkRowResult[] = [];
    for (let index = 0; index < dto.rows.length; index++) {
      const row = dto.rows[index];
      try {
        const phone = this.normalizePhone(row.phone);
        const existingUser = await this.prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
          await this.prisma.schoolStudent.upsert({
            where: { schoolId_userId: { schoolId, userId: existingUser.id } },
            create: { schoolId, userId: existingUser.id, licenseCategory: row.licenseCategory },
            update: { licenseCategory: row.licenseCategory },
          });
        } else {
          await this.prisma.schoolStudent.create({
            data: { schoolId, guestName: row.name, guestPhone: phone, licenseCategory: row.licenseCategory },
          });
        }
        results.push({ index, ok: true });
      } catch (err: any) {
        results.push({ index, ok: false, error: err?.message || 'Erreur inconnue' });
      }
    }
    return results;
  }

  async addMembersBulk(schoolId: string, dto: BulkAddMembersDto): Promise<BulkRowResult[]> {
    const results: BulkRowResult[] = [];
    for (let index = 0; index < dto.rows.length; index++) {
      const row = dto.rows[index];
      try {
        const phone = this.normalizePhone(row.phone);
        const existingUser = await this.prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
          await this.prisma.schoolMembership.upsert({
            where: { schoolId_userId_role: { schoolId, userId: existingUser.id, role: row.role } },
            create: { schoolId, userId: existingUser.id, role: row.role },
            update: { active: true },
          });
        } else {
          await this.prisma.schoolMembership.create({
            data: { schoolId, guestName: row.name, guestPhone: phone, role: row.role },
          });
        }
        results.push({ index, ok: true });
      } catch (err: any) {
        results.push({ index, ok: false, error: err?.message || 'Erreur inconnue' });
      }
    }
    return results;
  }

  async createVehiclesBulk(schoolId: string, dto: BulkCreateVehiclesDto): Promise<BulkRowResult[]> {
    const results: BulkRowResult[] = [];
    for (let index = 0; index < dto.rows.length; index++) {
      const row = dto.rows[index];
      try {
        await this.prisma.vehicle.upsert({
          where: { schoolId_plate: { schoolId, plate: row.plate } },
          create: { schoolId, ...row },
          update: { brand: row.brand, model: row.model, category: row.category },
        });
        results.push({ index, ok: true });
      } catch (err: any) {
        results.push({ index, ok: false, error: err?.message || 'Erreur inconnue' });
      }
    }
    return results;
  }

  // ─── Véhicules ────────────────────────────────────────────────────────────────

  private withVehicleAlerts<
    T extends { insuranceExpiresAt: Date | null; technicalInspectionExpiresAt: Date | null },
  >(vehicle: T) {
    const soon = (d: Date | null) => !!d && d.getTime() - Date.now() < EXPIRY_ALERT_WINDOW_MS;
    return {
      ...vehicle,
      insuranceExpiringSoon: soon(vehicle.insuranceExpiresAt),
      inspectionExpiringSoon: soon(vehicle.technicalInspectionExpiresAt),
    };
  }

  async listVehicles(schoolId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
    return vehicles.map((v) => this.withVehicleAlerts(v));
  }

  async createVehicle(schoolId: string, dto: CreateVehicleDto) {
    try {
      const vehicle = await this.prisma.vehicle.create({ data: { ...dto, schoolId } });
      return this.withVehicleAlerts(vehicle);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException('Cette immatriculation est déjà enregistrée');
      }
      throw err;
    }
  }

  async updateVehicle(schoolId: string, id: string, dto: UpdateVehicleDto) {
    // Composite where — the "règle d'or": never trust id alone.
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, schoolId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable');

    try {
      const updated = await this.prisma.vehicle.update({ where: { id }, data: dto });
      return this.withVehicleAlerts(updated);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException('Cette immatriculation est déjà enregistrée');
      }
      throw err;
    }
  }

  async deleteVehicle(schoolId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, schoolId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable');
    await this.prisma.vehicle.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Séances (planning) ──────────────────────────────────────────────────────

  private static readonly SESSION_INCLUDE = {
    student: { include: { user: { select: { id: true, name: true, phone: true } } } },
    instructor: { include: { user: { select: { id: true, name: true, phone: true } } } },
    vehicle: { select: { id: true, plate: true, brand: true, model: true } },
  } as const;

  async listSessions(schoolId: string, studentId?: string, from?: string, to?: string) {
    return this.prisma.session.findMany({
      where: {
        schoolId,
        ...(studentId ? { studentId } : {}),
        ...(from || to
          ? { startsAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      include: SchoolService.SESSION_INCLUDE,
      orderBy: { startsAt: 'asc' },
    });
  }

  /** Verifies studentId/instructorMembershipId/vehicleId all belong to `schoolId` — the same cross-tenant guard as updateStudent(). */
  private async assertSessionRefsBelongToSchool(
    schoolId: string,
    refs: { studentId?: string; instructorMembershipId?: string | null; vehicleId?: string | null }
  ) {
    if (refs.studentId) {
      const student = await this.prisma.schoolStudent.findFirst({
        where: { id: refs.studentId, schoolId },
      });
      if (!student) throw new BadRequestException('Élève introuvable pour cette école');
    }
    if (refs.instructorMembershipId) {
      const instructor = await this.prisma.schoolMembership.findFirst({
        where: {
          id: refs.instructorMembershipId,
          schoolId,
          active: true,
          role: { in: [SchoolMemberRole.INSTRUCTOR, SchoolMemberRole.COACH] },
        },
      });
      if (!instructor) throw new BadRequestException('Moniteur/coach introuvable pour cette école');
    }
    if (refs.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({ where: { id: refs.vehicleId, schoolId } });
      if (!vehicle) throw new BadRequestException('Véhicule introuvable pour cette école');
    }
  }

  async createSession(schoolId: string, dto: CreateSessionDto) {
    await this.assertSessionRefsBelongToSchool(schoolId, dto);
    return this.prisma.session.create({
      data: { ...dto, schoolId, startsAt: new Date(dto.startsAt), endsAt: new Date(dto.endsAt) },
      include: SchoolService.SESSION_INCLUDE,
    });
  }

  async updateSession(schoolId: string, id: string, dto: UpdateSessionDto) {
    // Composite where — the "règle d'or": never trust id alone.
    const session = await this.prisma.session.findFirst({ where: { id, schoolId } });
    if (!session) throw new NotFoundException('Séance introuvable');

    await this.assertSessionRefsBelongToSchool(schoolId, dto);

    return this.prisma.session.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: SchoolService.SESSION_INCLUDE,
    });
  }

  // ─── Paiements (factures manuelles) ──────────────────────────────────────────

  /** Includes email — needed to prefill the "envoyer par email" share action. */
  private static readonly PAYMENT_INCLUDE = {
    student: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
  } as const;

  async listPayments(schoolId: string, studentId?: string, status?: SchoolPaymentStatus) {
    return this.prisma.schoolPayment.findMany({
      where: {
        schoolId,
        ...(studentId ? { studentId } : {}),
        ...(status ? { status } : {}),
      },
      include: SchoolService.PAYMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** "F-2026-0001" / "D-2026-0001" — sequential per school, per type, per year. */
  private async nextPaymentNumber(schoolId: string, type: SchoolPaymentType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === SchoolPaymentType.DEVIS ? 'D' : 'F';
    const count = await this.prisma.schoolPayment.count({
      where: { schoolId, type, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async createPayment(schoolId: string, dto: CreatePaymentDto) {
    const student = await this.prisma.schoolStudent.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new BadRequestException('Élève introuvable pour cette école');

    const type = dto.type ?? SchoolPaymentType.FACTURE;
    const amountXof = dto.items.reduce((sum, i) => sum + i.qty * i.unitPriceXof, 0);

    return this.prisma.schoolPayment.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        type,
        number: await this.nextPaymentNumber(schoolId, type),
        amountXof,
        description: dto.description,
        items: dto.items as any,
        notes: dto.notes,
        method: dto.method,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: SchoolService.PAYMENT_INCLUDE,
    });
  }

  async sendPaymentEmail(schoolId: string, id: string, dto: SendPaymentEmailDto) {
    // Composite where — the "règle d'or": never trust id alone.
    const payment = await this.prisma.schoolPayment.findFirst({ where: { id, schoolId } });
    if (!payment) throw new NotFoundException('Facture introuvable');

    await this.emailService.sendPdf(dto.to, {
      subject: `${payment.number ?? (payment.type === SchoolPaymentType.DEVIS ? 'Devis' : 'Facture')} — ${payment.description}`,
      text: `Veuillez trouver ci-joint votre ${payment.type === SchoolPaymentType.DEVIS ? 'devis' : 'facture'}.`,
      filename: dto.filename,
      base64: dto.pdfBase64,
    });

    return { sent: true };
  }

  async updatePayment(schoolId: string, id: string, dto: UpdatePaymentDto) {
    // Composite where — the "règle d'or": never trust id alone.
    const payment = await this.prisma.schoolPayment.findFirst({ where: { id, schoolId } });
    if (!payment) throw new NotFoundException('Facture introuvable');

    return this.prisma.schoolPayment.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paidAt: dto.status === SchoolPaymentStatus.PAID ? new Date() : undefined,
      },
      include: SchoolService.PAYMENT_INCLUDE,
    });
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
