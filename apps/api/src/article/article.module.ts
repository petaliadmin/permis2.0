import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ArticleService, PrismaService],
  controllers: [ArticleController],
  exports: [ArticleService],
})
export class ArticleModule {}
