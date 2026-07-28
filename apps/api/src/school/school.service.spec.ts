import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SchoolMemberRole } from '@permis2.0/types';
import { SchoolService } from './school.service';

describe('SchoolService — tenant isolation', () => {
  let prisma: {
    schoolMembership: { findFirst: jest.Mock; count: jest.Mock; update: jest.Mock };
  };
  let service: SchoolService;

  beforeEach(() => {
    prisma = {
      schoolMembership: {
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new SchoolService(prisma as any);
  });

  describe('removeMember', () => {
    it('rejects a membership id that belongs to a different school (cross-tenant guess)', async () => {
      // membershipIdOfB exists in the DB, but under schoolB, not schoolA — the
      // composite where { id, schoolId } must not match it.
      prisma.schoolMembership.findFirst.mockResolvedValue(null);

      await expect(service.removeMember('schoolA', 'membershipIdOfB')).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(prisma.schoolMembership.findFirst).toHaveBeenCalledWith({
        where: { id: 'membershipIdOfB', schoolId: 'schoolA' },
      });
      expect(prisma.schoolMembership.update).not.toHaveBeenCalled();
    });

    it('deactivates a member that does belong to the school', async () => {
      prisma.schoolMembership.findFirst.mockResolvedValue({
        id: 'm1',
        role: SchoolMemberRole.INSTRUCTOR,
      });
      prisma.schoolMembership.update.mockResolvedValue({ id: 'm1', active: false });

      await service.removeMember('schoolA', 'm1');
      expect(prisma.schoolMembership.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { active: false },
      });
    });

    it('refuses to remove the last active OWNER of a school', async () => {
      prisma.schoolMembership.findFirst.mockResolvedValue({ id: 'm1', role: SchoolMemberRole.OWNER });
      prisma.schoolMembership.count.mockResolvedValue(0);

      await expect(service.removeMember('schoolA', 'm1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.schoolMembership.update).not.toHaveBeenCalled();
    });

    it('allows removing an OWNER when another active OWNER remains', async () => {
      prisma.schoolMembership.findFirst.mockResolvedValue({ id: 'm1', role: SchoolMemberRole.OWNER });
      prisma.schoolMembership.count.mockResolvedValue(1);
      prisma.schoolMembership.update.mockResolvedValue({ id: 'm1', active: false });

      await expect(service.removeMember('schoolA', 'm1')).resolves.toEqual({ id: 'm1', active: false });
    });
  });
});
