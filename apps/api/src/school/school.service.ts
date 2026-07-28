import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SchoolMemberRole, SchoolStatus } from '@permis2.0/types';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { AddSchoolMemberDto } from './dto/add-school-member.dto';

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

/**
 * Phase 0 fondations: CRUD minimal pour les écoles (tenants) + gestion du
 * staff (SchoolMembership). Isolation multi-tenant : toute sous-ressource
 * DOIT être filtrée par un `where` composite `{ id, schoolId }`, jamais par
 * `{ id }` seul — voir SchoolRolesGuard pour la vérification d'accès à schoolId.
 */
@Injectable()
export class SchoolService {
  constructor(private prisma: PrismaService) {}

  async listActive(filters: { city?: string; q?: string }) {
    return this.prisma.school.findMany({
      where: {
        status: SchoolStatus.ACTIVE,
        ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' } } : {}),
        ...(filters.q
          ? { name: { contains: filters.q, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(schoolId: string, viewer?: { userId: string; role: Role }) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('École introuvable');

    if (school.status === SchoolStatus.ACTIVE) return school;

    // Non-active schools are only visible to the platform admin or a staff member.
    if (viewer?.role === Role.ADMIN) return school;
    const membership = viewer
      ? await this.prisma.schoolMembership.findFirst({
          where: { schoolId, userId: viewer.userId, active: true },
          select: { id: true },
        })
      : null;
    if (!membership) throw new NotFoundException('École introuvable');
    return school;
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
