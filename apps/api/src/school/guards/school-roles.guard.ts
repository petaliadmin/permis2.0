import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, SchoolMemberRole } from '@permis2.0/types';
import { PrismaService } from '../../prisma/prisma.service';
import { SCHOOL_ROLES_KEY } from '../decorators/school-roles.decorator';

/**
 * Resolves the tenant-scoped role in DB on every request (never cached in the
 * JWT — a scoped role can change without the user re-logging in, and a user
 * can hold different roles in different schools). Requires the route to
 * expose the target school as `:schoolId`.
 *
 * Only verifies access to `schoolId` itself. Sub-resources (members, etc.)
 * must additionally be looked up with a composite `{ id, schoolId }` where —
 * never `{ id }` alone — otherwise a valid member of school A could reach a
 * sub-resource belonging to school B by guessing/enumerating its id.
 */
@Injectable()
export class SchoolRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SchoolMemberRole[]>(SCHOOL_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // Platform super admin bypasses tenant scoping.
    if (user.role === Role.ADMIN) return true;

    const schoolId = request.params?.schoolId;
    if (!schoolId) throw new BadRequestException('schoolId manquant dans la route');

    const membership = await this.prisma.schoolMembership.findFirst({
      where: { schoolId, userId: user.userId, active: true, role: { in: requiredRoles } },
      select: { id: true, school: { select: { subscriptionExpiresAt: true } } },
    });
    if (!membership) throw new ForbiddenException('Accès non autorisé pour cette auto-école');

    // Platform access gate: the school management space requires an ACTIVE
    // SCHOOL subscription. 402 (not 403) so the frontend can distinguish
    // "wrong role" from "pay to unlock" and show the subscribe screen.
    const subscriptionExpiresAt = membership.school.subscriptionExpiresAt;
    if (!subscriptionExpiresAt || subscriptionExpiresAt <= new Date()) {
      throw new HttpException('Abonnement école requis', HttpStatus.PAYMENT_REQUIRED);
    }

    request.schoolMembership = membership;
    return true;
  }
}
