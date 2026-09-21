import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolStatus, SchoolStudentStatus } from '@permis2.0/types';

/** Real, computed platform-wide numbers for the homepage stat badges —
 *  SEO audit finding (Étape 3/6): the previous badges were hardcoded
 *  marketing copy (+300, +20 000, 4.9/5, 95%) not backed by any data.
 *  No number here is invented; a metric with no data yet is null/0, never
 *  a placeholder. */
@Injectable()
export class PlatformStatsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [schoolsCount, studentsCount, cities, ratingAgg] = await Promise.all([
      this.prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
      this.prisma.schoolStudent.count({
        where: { status: SchoolStudentStatus.ACTIVE, school: { status: SchoolStatus.ACTIVE } },
      }),
      this.prisma.school.findMany({
        where: { status: SchoolStatus.ACTIVE, city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
      this.prisma.schoolReview.aggregate({ _avg: { rating: true }, _count: true }),
    ]);

    return {
      schoolsCount,
      studentsCount,
      citiesCount: cities.length,
      averageRating: ratingAgg._avg.rating,
      reviewCount: ratingAgg._count,
    };
  }
}
