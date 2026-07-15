import { GamificationService, XP_RULES } from './gamification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new GamificationService(prisma as unknown as PrismaService);
  });

  describe('addXP', () => {
    it('adds XP and keeps the level when below the next threshold', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', xp: 10, level: 'Débutant' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.addXP('u1', 20);

      expect(result).toEqual({ xpEarned: 20, newXP: 30, newLevel: 'Débutant', levelUp: false });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { xp: 30, level: 'Débutant' },
      });
    });

    it('levels up when crossing a threshold', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', xp: 90, level: 'Débutant' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.addXP('u1', 20);

      expect(result).toMatchObject({ newXP: 110, newLevel: 'Intermédiaire', levelUp: true });
    });

    it('returns null for an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.addXP('missing', 10)).toBeNull();
    });
  });

  describe('recordQuiz', () => {
    it('awards XP per correct answer plus the perfect bonus', async () => {
      const addXP = jest.spyOn(service, 'addXP').mockResolvedValue({} as any);
      jest.spyOn(service, 'checkDailyStreak').mockResolvedValue({} as any);
      jest.spyOn(service, 'checkAndUnlockAchievements').mockResolvedValue([] as any);

      const result = await service.recordQuiz('u1', 25, 25);

      const expected = 25 * XP_RULES.correctAnswer + XP_RULES.seriesPerfect;
      expect(result.xpEarned).toBe(expected);
      expect(addXP).toHaveBeenCalledWith('u1', expected);
    });

    it('does not award the perfect bonus on a partial score', async () => {
      jest.spyOn(service, 'addXP').mockResolvedValue({} as any);
      jest.spyOn(service, 'checkDailyStreak').mockResolvedValue({} as any);
      jest.spyOn(service, 'checkAndUnlockAchievements').mockResolvedValue([] as any);

      const result = await service.recordQuiz('u1', 10, 25);

      expect(result.xpEarned).toBe(10 * XP_RULES.correctAnswer);
    });

    it('does not award the perfect bonus for an empty quiz', async () => {
      jest.spyOn(service, 'addXP').mockResolvedValue({} as any);
      jest.spyOn(service, 'checkDailyStreak').mockResolvedValue({} as any);
      jest.spyOn(service, 'checkAndUnlockAchievements').mockResolvedValue([] as any);

      const result = await service.recordQuiz('u1', 0, 0);

      expect(result.xpEarned).toBe(0);
    });
  });
});
