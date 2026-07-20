import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: { findByPhone: jest.Mock; create: jest.Mock; findById: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let prisma: {
    otpToken: { deleteMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  };
  let smsService: { send: jest.Mock };

  beforeEach(() => {
    userService = { findByPhone: jest.fn(), create: jest.fn(), findById: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };
    prisma = {
      otpToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    smsService = { send: jest.fn().mockResolvedValue(undefined) };

    service = new AuthService(
      userService as any,
      jwtService as any,
      prisma as any,
      smsService as any
    );
  });

  describe('phone normalization', () => {
    it.each([
      ['+221 77 123 45 67', '771234567'],
      ['221771234567', '771234567'],
      ['77 123 45 67', '771234567'],
      ['771234567', '771234567'],
    ])('normalizes %s to %s', (input, expected) => {
      expect((service as any).normalizePhone(input)).toBe(expected);
    });
  });

  describe('requestOtp', () => {
    it('stores a hashed 6-digit code and sends it via SMS', async () => {
      await service.requestOtp('77 123 45 67', 'sms');

      expect(prisma.otpToken.create).toHaveBeenCalledTimes(1);
      const data = prisma.otpToken.create.mock.calls[0][0].data;
      expect(data.phone).toBe('771234567');
      expect(data.codeHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex — never the raw code
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());

      expect(smsService.send).toHaveBeenCalledTimes(1);
      const [phone, message] = smsService.send.mock.calls[0];
      expect(phone).toBe('771234567');
      expect(message).toMatch(/\d{6}/);
      // WebOTP binding line, so supporting browsers can auto-read the SMS.
      expect(message).toMatch(/\n@[^\s]+ #\d{6}$/);
    });

    it('never returns the raw code in the response', async () => {
      const result = await service.requestOtp('771234567', 'sms');
      expect(result).toEqual({ sent: true });
    });
  });

  describe('loginWithPin', () => {
    it('returns a token for a valid PIN', async () => {
      const pinHash = await bcrypt.hash('1234', 4);
      userService.findByPhone.mockResolvedValue({
        id: 'u1',
        phone: '771234567',
        pinHash,
        role: 'USER',
        xp: 0,
      });

      const result = await service.loginWithPin('771234567', '1234');

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user.pinHash).toBeUndefined(); // never leaked
    });

    it('rejects a wrong PIN', async () => {
      const pinHash = await bcrypt.hash('1234', 4);
      userService.findByPhone.mockResolvedValue({ id: 'u1', pinHash, role: 'USER' });

      await expect(service.loginWithPin('771234567', '9999')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('rejects an unknown phone', async () => {
      userService.findByPhone.mockResolvedValue(null);
      await expect(service.loginWithPin('770000000', '1234')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
