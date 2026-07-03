import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { MigrateGuestDto } from './dto/migrate-guest.dto';
import { RegisterDto } from './dto/register.dto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  // ─── Phone / OTP / PIN ───────────────────────────────────────────────────────

  async requestOtp(rawPhone: string, channel: 'sms' | 'whatsapp') {
    const phone = this.normalizePhone(rawPhone);

    // Purge expired / already-used tokens for this number
    await this.prisma.otpToken.deleteMany({
      where: {
        phone,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

    await this.prisma.otpToken.create({
      data: {
        phone,
        codeHash,
        channel,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const message = `PERMIS2.0 — Ton code de vérification : ${rawCode}. Valide 10 minutes.`;
    await this.smsService.send(phone, message, channel);

    // Return code in non-production so the frontend can show it in dev mode
    const devCode = process.env.NODE_ENV !== 'production' ? rawCode : undefined;
    return { sent: true, ...(devCode ? { devCode } : {}) };
  }

  async verifyOtp(rawPhone: string, code: string): Promise<boolean> {
    const phone = this.normalizePhone(rawPhone);
    const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');

    const token = await this.prisma.otpToken.findFirst({
      where: {
        phone,
        codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) return false;

    await this.prisma.otpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  async loginWithPin(rawPhone: string, pin: string) {
    const phone = this.normalizePhone(rawPhone);
    const user = await this.userService.findByPhone(phone);

    if (!user || !user.pinHash) {
      throw new UnauthorizedException('Numéro ou code incorrect');
    }

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Numéro ou code incorrect');
    }

    return { accessToken: this.generateAccessToken(user), user: this.sanitizeUser(user) };
  }

  async registerWithPin(name: string, rawPhone: string, pin: string) {
    const phone = this.normalizePhone(rawPhone);
    const existing = await this.userService.findByPhone(phone);
    if (existing) {
      throw new ConflictException('Ce numéro est déjà utilisé');
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const user = await this.userService.create({ name, phone, pinHash });

    return { accessToken: this.generateAccessToken(user), user: this.sanitizeUser(user) };
  }

  // ─── Email / Password ────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const { email, password, name } = dto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      email,
      name,
      passwordHash: hashedPassword,
    });

    return { accessToken: this.generateAccessToken(user), user: this.sanitizeUser(user) };
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

    return { accessToken: this.generateAccessToken(user), user: this.sanitizeUser(user) };
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
    return { accessToken: this.generateAccessToken(user) };
  }

  // ─── Password Reset ──────────────────────────────────────────────────────────

  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user) {
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
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  // ─── Guest migration ─────────────────────────────────────────────────────────

  async migrateGuestProgress(userId: string, dto: MigrateGuestDto) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (dto.xp && dto.xp > 0) {
      await this.userService.addXP(userId, dto.xp);
    }

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

    if (dto.answers?.length) {
      const questionIds = dto.answers.map((a) => a.questionId);
      const questions = await this.prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, categoryId: true },
      });
      const categoryByQuestion = new Map(questions.map((q) => [q.id, q.categoryId]));

      const byCategory = new Map<string, { correct: number; total: number }>();
      for (const ans of dto.answers) {
        const categoryId = categoryByQuestion.get(ans.questionId);
        if (!categoryId) continue;
        const acc = byCategory.get(categoryId) ?? { correct: 0, total: 0 };
        acc.total += 1;
        if (ans.isCorrect) acc.correct += 1;
        byCategory.set(categoryId, acc);
      }

      for (const [categoryId, { correct, total }] of byCategory) {
        const existing = await this.prisma.statistic.findFirst({ where: { userId, categoryId } });
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

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Strip all non-digits and remove leading 221 country prefix. */
  private normalizePhone(raw: string): string {
    return raw.replace(/\D/g, '').replace(/^221/, '');
  }

  private generateAccessToken(user: any) {
    const payload = { sub: user.id, email: user.email ?? null, role: user.role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    if (!user) return user;
    const { passwordHash, pinHash, ...sanitized } = user;
    return sanitized;
  }
}
