import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { MigrateGuestDto } from './dto/migrate-guest.dto';

/** Reset tokens live for one hour. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      email,
      name,
      passwordHash: hashedPassword,
    });

    return {
      accessToken: this.generateAccessToken(user),
      user: this.sanitizeUser(user),
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: this.generateAccessToken(user),
      user: this.sanitizeUser(user),
    };
  }

  async googleLogin(googleUser: any) {
    let user = await this.userService.findByGoogleId(googleUser.id);

    if (!user) {
      // Link onto an existing email account instead of failing the unique-email
      // constraint (or silently creating a duplicate identity).
      const byEmail = await this.userService.findByEmail(googleUser.email);
      if (byEmail) {
        user = await this.userService.linkGoogle(
          byEmail.id,
          googleUser.id,
          googleUser.picture,
        );
      } else {
        user = await this.userService.create({
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          googleId: googleUser.id,
        });
      }
    }

    return {
      accessToken: this.generateAccessToken(user),
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async refreshToken(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: this.generateAccessToken(user),
    };
  }

  /**
   * Merge a guest's locally-tracked progress into a freshly created account.
   * Best-effort: any failure here must never block sign-up/login, so callers
   * invoke this in a try/catch. Idempotent enough for retries — XP is added once
   * per call and the streak is only ever raised, never lowered.
   */
  async migrateGuestProgress(userId: string, dto: MigrateGuestDto) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 1. XP — reuse the canonical level-recomputing helper.
    if (dto.xp && dto.xp > 0) {
      await this.userService.addXP(userId, dto.xp);
    }

    // 2. Streak — only raise the longest streak; never overwrite a higher one.
    if (dto.bestStreak && dto.bestStreak > 0) {
      const existing = await this.prisma.dailyStreak.findUnique({ where: { userId } });
      if (existing) {
        if (dto.bestStreak > existing.longestStreak) {
          await this.prisma.dailyStreak.update({
            where: { userId },
            data: { longestStreak: dto.bestStreak },
          });
        }
      } else {
        await this.prisma.dailyStreak.create({
          data: { userId, longestStreak: dto.bestStreak, currentStreak: 0 },
        });
      }
    }

    // 3. Per-question answers → per-category Statistic rows. We aggregate the
    // guest answers by the question's category, then fold them into the user's
    // existing statistics (creating rows as needed).
    if (dto.answers?.length) {
      const questionIds = dto.answers.map((a) => a.questionId);
      const questions = await this.prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, categoryId: true },
      });
      const categoryByQuestion = new Map(questions.map((q) => [q.id, q.categoryId]));

      // Aggregate { categoryId -> { correct, total } }
      const byCategory = new Map<string, { correct: number; total: number }>();
      for (const ans of dto.answers) {
        const categoryId = categoryByQuestion.get(ans.questionId);
        if (!categoryId) continue; // unknown / stale question id — skip
        const acc = byCategory.get(categoryId) ?? { correct: 0, total: 0 };
        acc.total += 1;
        if (ans.isCorrect) acc.correct += 1;
        byCategory.set(categoryId, acc);
      }

      for (const [categoryId, { correct, total }] of byCategory) {
        const existing = await this.prisma.statistic.findFirst({
          where: { userId, categoryId },
        });
        if (existing) {
          const newCorrect = existing.correctAnswers + correct;
          const newTotal = existing.totalAnswers + total;
          await this.prisma.statistic.update({
            where: { id: existing.id },
            data: {
              correctAnswers: newCorrect,
              totalAnswers: newTotal,
              successRate: newTotal > 0 ? (newCorrect / newTotal) * 100 : 0,
            },
          });
        } else {
          await this.prisma.statistic.create({
            data: {
              userId,
              categoryId,
              correctAnswers: correct,
              totalAnswers: total,
              successRate: total > 0 ? (correct / total) * 100 : 0,
            },
          });
        }
      }
    }

    const fresh = await this.userService.findById(userId);
    return { migrated: true, user: this.sanitizeUser(fresh) };
  }

  /**
   * Begin a password reset. Always resolves with 200 regardless of whether the
   * email exists (no user enumeration). With no email provider configured yet,
   * the reset link is logged to the server console in development.
   */
  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user) {
      // Raw token goes in the link; only its hash is stored.
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const webUrl = process.env.WEB_URL || 'http://localhost:3000';
      const resetLink = `${webUrl}/auth/reset-password?token=${rawToken}`;

      // TODO: replace with a real email provider in production.
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[password-reset] Reset link for ${email}: ${resetLink}`);
      }
    }

    return {
      message:
        'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.',
    };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  private generateAccessToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    if (!user) return user;
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
