import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { LessonModule } from './lesson/lesson.module';
import { ConduiteModule } from './conduite/conduite.module';
import { SeriesModule } from './series/series.module';
import { QuestionModule } from './question/question.module';
import { ExamModule } from './exam/exam.module';
import { GamificationModule } from './gamification/gamification.module';
import { TrafficSignModule } from './traffic-sign/traffic-sign.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AiCoachModule } from './ai-coach/ai-coach.module';
import { PrismaService } from './prisma/prisma.service';
import { AdminModule } from './admin/admin.module';
import { EntitlementModule } from './entitlement/entitlement.module';
import { ShopModule } from './shop/shop.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    UserModule,
    CategoryModule,
    LessonModule,
    ConduiteModule,
    SeriesModule,
    QuestionModule,
    ExamModule,
    GamificationModule,
    TrafficSignModule,
    StatisticsModule,
    AiCoachModule,
    AdminModule,
    EntitlementModule,
    ShopModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}
