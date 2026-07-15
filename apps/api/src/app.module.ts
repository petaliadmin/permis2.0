import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { LessonModule } from './lesson/lesson.module';
import { SeriesModule } from './series/series.module';
import { QuestionModule } from './question/question.module';
import { ExamModule } from './exam/exam.module';
import { GamificationModule } from './gamification/gamification.module';
import { TrafficSignModule } from './traffic-sign/traffic-sign.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AiCoachModule } from './ai-coach/ai-coach.module';
import { PrismaService } from './prisma/prisma.service';
import { AdminModule } from './admin/admin.module';
import { NotificationModule } from './notification/notification.module';
import { ShopModule } from './shop/shop.module';
import { EntitlementModule } from './entitlement/entitlement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate(config: Record<string, unknown>) {
        const errors: string[] = [];
        if (!config['DATABASE_URL']) errors.push('DATABASE_URL is required');
        if (!config['JWT_SECRET']) errors.push('JWT_SECRET is required');
        if (config['JWT_SECRET'] && String(config['JWT_SECRET']).length < 16)
          errors.push('JWT_SECRET must be at least 16 characters');
        if (errors.length) throw new Error(errors.join('; '));
        return { ...config, PORT: config['PORT'] ? Number(config['PORT']) : 3001 };
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    CategoryModule,
    LessonModule,
    SeriesModule,
    QuestionModule,
    ExamModule,
    GamificationModule,
    TrafficSignModule,
    StatisticsModule,
    AiCoachModule,
    AdminModule,
    NotificationModule,
    ShopModule,
    EntitlementModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
