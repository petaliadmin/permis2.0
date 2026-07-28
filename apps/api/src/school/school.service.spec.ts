import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SchoolEnrollmentStatus, SchoolMemberRole, SchoolStatus } from '@permis2.0/types';
import { SchoolService } from './school.service';

describe('SchoolService — tenant isolation', () => {
  let prisma: any;
  let notificationService: { create: jest.Mock };
  let service: SchoolService;

  beforeEach(() => {
    prisma = {
      school: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      schoolMembership: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      schoolEnrollmentRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prisma)),
      schoolStudent: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      vehicle: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      schoolPayment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    notificationService = { create: jest.fn().mockResolvedValue(undefined) };
    service = new SchoolService(prisma, notificationService as any);
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

  describe('lookupUserByPhone', () => {
    it('normalizes the phone (strips spaces/+221) before matching', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Fatou Diop', phone: '771234567' });

      await service.lookupUserByPhone('+221 77 123 45 67');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '771234567' },
        select: { id: true, name: true, phone: true },
      });
    });

    it('throws NotFoundException when no user matches', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.lookupUserByPhone('771234567')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('submitEnrollmentRequest', () => {
    const dto = { firstName: 'Fatou', lastName: 'Diop', phone: '771234567' };

    it('rejects a non-ACTIVE school (404, no disclosure)', async () => {
      prisma.school.findUnique.mockResolvedValue({ id: 's1', status: SchoolStatus.PENDING });

      await expect(service.submitEnrollmentRequest('s1', dto as any)).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(prisma.schoolEnrollmentRequest.create).not.toHaveBeenCalled();
    });

    it('creates the request and notifies active OWNER/MANAGER/SECRETARY staff only', async () => {
      prisma.school.findUnique.mockResolvedValue({ id: 's1', status: SchoolStatus.ACTIVE, name: 'École X' });
      prisma.schoolEnrollmentRequest.create.mockResolvedValue({ id: 'req1', ...dto });
      prisma.schoolMembership.findMany.mockResolvedValue([{ userId: 'owner1' }, { userId: 'sec1' }]);

      await service.submitEnrollmentRequest('s1', dto as any, 'student1');

      expect(prisma.schoolEnrollmentRequest.create).toHaveBeenCalledWith({
        data: { ...dto, schoolId: 's1', studentUserId: 'student1' },
      });
      expect(prisma.schoolMembership.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 's1',
          active: true,
          role: { in: [SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER, SchoolMemberRole.SECRETARY] },
        },
        select: { userId: true },
      });
      expect(notificationService.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateEnrollmentStatus', () => {
    it('rejects a request id that belongs to a different school (cross-tenant guess)', async () => {
      prisma.schoolEnrollmentRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.updateEnrollmentStatus('schoolA', 'reqOfSchoolB', 'staff1', {
          status: SchoolEnrollmentStatus.ACCEPTED,
        } as any)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.schoolEnrollmentRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'reqOfSchoolB', schoolId: 'schoolA' },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates a SchoolStudent when confirming a request tied to a known user', async () => {
      prisma.schoolEnrollmentRequest.findFirst.mockResolvedValue({
        id: 'req1',
        schoolId: 's1',
        studentUserId: 'student1',
        licenseCategory: 'B',
      });
      prisma.schoolEnrollmentRequest.update.mockResolvedValue({ id: 'req1', status: 'CONFIRMED' });

      await service.updateEnrollmentStatus('s1', 'req1', 'staff1', {
        status: SchoolEnrollmentStatus.CONFIRMED,
      } as any);

      expect(prisma.schoolStudent.upsert).toHaveBeenCalledWith({
        where: { schoolId_userId: { schoolId: 's1', userId: 'student1' } },
        create: { schoolId: 's1', userId: 'student1', enrollmentRequestId: 'req1', licenseCategory: 'B' },
        update: {},
      });
      expect(notificationService.create).toHaveBeenCalledWith(
        'student1',
        expect.any(String),
        expect.any(String),
        'success'
      );
    });

    it('does not create a SchoolStudent for a guest lead without an account', async () => {
      prisma.schoolEnrollmentRequest.findFirst.mockResolvedValue({
        id: 'req1',
        schoolId: 's1',
        studentUserId: null,
      });
      prisma.schoolEnrollmentRequest.update.mockResolvedValue({ id: 'req1', status: 'CONFIRMED' });

      await service.updateEnrollmentStatus('s1', 'req1', 'staff1', {
        status: SchoolEnrollmentStatus.CONFIRMED,
      } as any);

      expect(prisma.schoolStudent.upsert).not.toHaveBeenCalled();
      expect(notificationService.create).not.toHaveBeenCalled();
    });
  });

  describe('getStudent / updateStudent', () => {
    it('rejects a student id that belongs to a different school (cross-tenant guess)', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue(null);

      await expect(service.getStudent('schoolA', 'studentOfSchoolB')).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(prisma.schoolStudent.findFirst).toHaveBeenCalledWith({
        where: { id: 'studentOfSchoolB', schoolId: 'schoolA' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          assignedInstructor: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
          assignedVehicle: { select: { id: true, plate: true, brand: true, model: true } },
        },
      });
    });

    it('rejects an update for a student id that belongs to a different school', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStudent('schoolA', 'studentOfSchoolB', { status: 'SUSPENDED' } as any)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.schoolStudent.update).not.toHaveBeenCalled();
    });

    it('rejects assigning an instructor that belongs to a different school', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue({ id: 's1', schoolId: 'schoolA' });
      prisma.schoolMembership.findFirst.mockResolvedValue(null); // not found scoped to schoolA

      await expect(
        service.updateStudent('schoolA', 's1', {
          assignedInstructorMembershipId: 'instructorOfSchoolB',
        } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.schoolMembership.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'instructorOfSchoolB',
          schoolId: 'schoolA',
          active: true,
          role: { in: [SchoolMemberRole.INSTRUCTOR, SchoolMemberRole.COACH] },
        },
      });
      expect(prisma.schoolStudent.update).not.toHaveBeenCalled();
    });

    it('rejects assigning a vehicle that belongs to a different school', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue({ id: 's1', schoolId: 'schoolA' });
      prisma.vehicle.findFirst.mockResolvedValue(null); // not found scoped to schoolA

      await expect(
        service.updateStudent('schoolA', 's1', { assignedVehicleId: 'vehicleOfSchoolB' } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: 'vehicleOfSchoolB', schoolId: 'schoolA' },
      });
      expect(prisma.schoolStudent.update).not.toHaveBeenCalled();
    });

    it('allows assigning an instructor and vehicle that do belong to the school', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue({ id: 's1', schoolId: 'schoolA' });
      prisma.schoolMembership.findFirst.mockResolvedValue({ id: 'instructor1' });
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle1' });
      prisma.schoolStudent.update.mockResolvedValue({ id: 's1' });

      await service.updateStudent('schoolA', 's1', {
        assignedInstructorMembershipId: 'instructor1',
        assignedVehicleId: 'vehicle1',
      } as any);

      expect(prisma.schoolStudent.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { assignedInstructorMembershipId: 'instructor1', assignedVehicleId: 'vehicle1' },
      });
    });
  });

  describe('addStudent', () => {
    it('throws NotFoundException when the userId does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addStudent('s1', { userId: 'ghost', licenseCategory: 'B' })
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.schoolStudent.upsert).not.toHaveBeenCalled();
    });

    it('upserts idempotently on [schoolId, userId]', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.schoolStudent.upsert.mockResolvedValue({ id: 'st1' });

      await service.addStudent('s1', { userId: 'u1', licenseCategory: 'B' });

      expect(prisma.schoolStudent.upsert).toHaveBeenCalledWith({
        where: { schoolId_userId: { schoolId: 's1', userId: 'u1' } },
        create: { schoolId: 's1', userId: 'u1', licenseCategory: 'B' },
        update: { licenseCategory: 'B' },
      });
    });
  });

  describe('createVehicle', () => {
    it('rejects a duplicate plate for the same school (unique constraint)', async () => {
      prisma.vehicle.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createVehicle('s1', { plate: 'DK-1234-AB' } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateVehicle / deleteVehicle', () => {
    it('rejects a vehicle id that belongs to a different school (cross-tenant guess)', async () => {
      prisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.updateVehicle('schoolA', 'vehicleOfSchoolB', { status: 'MAINTENANCE' } as any)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.vehicle.update).not.toHaveBeenCalled();
    });

    it('rejects deleting a vehicle id that belongs to a different school', async () => {
      prisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.deleteVehicle('schoolA', 'vehicleOfSchoolB')).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(prisma.vehicle.delete).not.toHaveBeenCalled();
    });

    it('deletes a vehicle that does belong to the school', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'v1', schoolId: 's1' });
      prisma.vehicle.delete.mockResolvedValue({});

      await expect(service.deleteVehicle('s1', 'v1')).resolves.toEqual({ deleted: true });
      expect(prisma.vehicle.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
    });
  });

  describe('createSession', () => {
    const dto = {
      studentId: 'studentOfSchoolB',
      type: 'PRACTICE',
      startsAt: '2026-08-01T09:00:00.000Z',
      endsAt: '2026-08-01T10:00:00.000Z',
    };

    it('rejects a studentId that belongs to a different school', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue(null);

      await expect(service.createSession('schoolA', dto as any)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('creates the session when all refs belong to the school', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue({ id: 'studentOfSchoolB' });
      prisma.session.create.mockResolvedValue({ id: 'sess1' });

      await service.createSession('schoolA', dto as any);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          schoolId: 'schoolA',
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
        },
        include: expect.any(Object),
      });
    });
  });

  describe('updateSession', () => {
    it('rejects a session id that belongs to a different school (cross-tenant guess)', async () => {
      prisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSession('schoolA', 'sessionOfSchoolB', { notes: 'x' } as any)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.session.update).not.toHaveBeenCalled();
    });

    it('rejects assigning an instructor from a different school', async () => {
      prisma.session.findFirst.mockResolvedValue({ id: 'sess1', schoolId: 'schoolA' });
      prisma.schoolMembership.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSession('schoolA', 'sess1', {
          instructorMembershipId: 'instructorOfSchoolB',
        } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.session.update).not.toHaveBeenCalled();
    });
  });

  describe('createPayment', () => {
    it('rejects a studentId that belongs to a different school', async () => {
      prisma.schoolStudent.findFirst.mockResolvedValue(null);

      await expect(
        service.createPayment('schoolA', {
          studentId: 'studentOfSchoolB',
          amountXof: 100000,
          description: 'Frais',
        } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.schoolPayment.create).not.toHaveBeenCalled();
    });
  });

  describe('updatePayment', () => {
    it('rejects a payment id that belongs to a different school (cross-tenant guess)', async () => {
      prisma.schoolPayment.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePayment('schoolA', 'paymentOfSchoolB', { status: 'PAID' } as any)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.schoolPayment.update).not.toHaveBeenCalled();
    });

    it('stamps paidAt when marking a payment PAID', async () => {
      prisma.schoolPayment.findFirst.mockResolvedValue({ id: 'p1', schoolId: 's1' });
      prisma.schoolPayment.update.mockResolvedValue({ id: 'p1', status: 'PAID' });

      await service.updatePayment('s1', 'p1', { status: 'PAID' } as any);

      const call = prisma.schoolPayment.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'p1' });
      expect(call.data.status).toBe('PAID');
      expect(call.data.paidAt).toBeInstanceOf(Date);
    });
  });
});
