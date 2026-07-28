import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, SchoolMemberRole } from '@permis2.0/types';
import { SchoolRolesGuard } from './school-roles.guard';

function makeContext(params: { user?: any; schoolId?: string }): ExecutionContext {
  const request = { user: params.user, params: { schoolId: params.schoolId } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('SchoolRolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: { schoolMembership: { findFirst: jest.Mock } };
  let guard: SchoolRolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = { schoolMembership: { findFirst: jest.fn() } };
    guard = new SchoolRolesGuard(reflector as any, prisma as any);
  });

  it('allows the request through when no @SchoolRoles metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = makeContext({ user: { userId: 'u1', role: Role.USER } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.schoolMembership.findFirst).not.toHaveBeenCalled();
  });

  it('bypasses the DB lookup for the platform super admin (Role.ADMIN)', async () => {
    reflector.getAllAndOverride.mockReturnValue([SchoolMemberRole.OWNER]);
    const context = makeContext({ user: { userId: 'admin1', role: Role.ADMIN }, schoolId: 's1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.schoolMembership.findFirst).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when :schoolId is missing from the route', async () => {
    reflector.getAllAndOverride.mockReturnValue([SchoolMemberRole.OWNER]);
    const context = makeContext({ user: { userId: 'u1', role: Role.USER } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows access when an active membership with a required role exists', async () => {
    reflector.getAllAndOverride.mockReturnValue([SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER]);
    prisma.schoolMembership.findFirst.mockResolvedValue({ id: 'm1' });
    const context = makeContext({ user: { userId: 'u1', role: Role.USER }, schoolId: 's1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.schoolMembership.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: 's1',
        userId: 'u1',
        active: true,
        role: { in: [SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER] },
      },
      select: { id: true },
    });
  });

  it('throws ForbiddenException when no matching active membership exists', async () => {
    reflector.getAllAndOverride.mockReturnValue([SchoolMemberRole.OWNER]);
    prisma.schoolMembership.findFirst.mockResolvedValue(null);
    const context = makeContext({ user: { userId: 'u1', role: Role.USER }, schoolId: 's1' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns false when there is no authenticated user', async () => {
    reflector.getAllAndOverride.mockReturnValue([SchoolMemberRole.OWNER]);
    const context = makeContext({ user: undefined, schoolId: 's1' });

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });
});
