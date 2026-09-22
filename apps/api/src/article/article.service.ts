import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async findAllPublished() {
    return this.prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, published: true },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }
}
