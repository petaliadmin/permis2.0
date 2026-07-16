import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TrafficSignCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SIGN_CATEGORIES: Record<string, TrafficSignCategory> = {
  danger: {
    id: 'danger',
    name: 'Signaux de danger',
    description: 'Signaux triangulaires avec bordure rouge',
    icon: '⚠️',
  },
  interdiction: {
    id: 'interdiction',
    name: "Signaux d'interdiction",
    description: 'Signaux circulaires avec bordure rouge',
    icon: '🚫',
  },
  obligation: {
    id: 'obligation',
    name: "Signaux d'obligation",
    description: 'Signaux circulaires avec fond bleu',
    icon: '🔵',
  },
  priorite: {
    id: 'priorite',
    name: 'Signaux de priorité',
    description: 'Signaux jaunes et blancs',
    icon: '✨',
  },
  indication: {
    id: 'indication',
    name: "Signaux d'indication",
    description: 'Signaux rectangulaires avec informations',
    icon: 'ℹ️',
  },
  direction: {
    id: 'direction',
    name: 'Panneaux de direction',
    description: 'Panneaux de direction et de localisation',
    icon: '➡️',
  },
  temporaire: {
    id: 'temporaire',
    name: 'Signalisation temporaire',
    description: 'Panneaux de chantier et de déviation temporaires',
    icon: '🚧',
  },
  restriction: {
    id: 'restriction',
    name: 'Restrictions de dimensions',
    description: 'Panneaux limitant hauteur, largeur ou poids',
    icon: '📏',
  },
  stationnement: {
    id: 'stationnement',
    name: 'Signalisation de stationnement',
    description: "Panneaux réglementant le stationnement et l'arrêt",
    icon: '🅿️',
  },
};

@Injectable()
export class TrafficSignService {
  constructor(private prisma: PrismaService) {}

  async findAll(skip = 0, take = 20) {
    const [signs, total] = await Promise.all([
      this.prisma.trafficSign.findMany({
        skip,
        take,
        orderBy: [{ ordre: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.trafficSign.count(),
    ]);

    return {
      data: signs,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const sign = await this.prisma.trafficSign.findUnique({
      where: { id },
    });

    if (!sign) {
      throw new NotFoundException('Traffic sign not found');
    }

    return sign;
  }

  async findByCategory(category: string, skip = 0, take = 20) {
    const [signs, total] = await Promise.all([
      this.prisma.trafficSign.findMany({
        where: {
          category: {
            equals: category,
            mode: 'insensitive',
          },
        },
        skip,
        take,
        orderBy: [{ ordre: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.trafficSign.count({
        where: {
          category: {
            equals: category,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    return {
      data: signs,
      category,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async search(query: string, skip = 0, take = 20) {
    const [signs, total] = await Promise.all([
      this.prisma.trafficSign.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { meaning: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take,
        orderBy: [{ ordre: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.trafficSign.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { meaning: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: signs,
      query,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async getCategories() {
    const categories = Object.values(SIGN_CATEGORIES);

    // Get count per category
    const counts = await Promise.all(
      Object.keys(SIGN_CATEGORIES).map((cat) =>
        this.prisma.trafficSign.count({
          where: {
            category: {
              equals: cat,
              mode: 'insensitive',
            },
          },
        })
      )
    );

    return categories.map((cat, idx) => ({
      ...cat,
      count: counts[idx],
    }));
  }

  async getRelatedSigns(signId: string, limit = 5) {
    const sign = await this.findById(signId);

    // Find signs with same category or similar meaning
    const relatedSigns = await this.prisma.trafficSign.findMany({
      where: {
        AND: [
          { id: { not: signId } },
          {
            OR: [
              { category: sign.category },
              {
                meaning: {
                  contains: sign.meaning.split(' ')[0],
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      take: limit,
    });

    return relatedSigns;
  }

  async extractSignsFromQuestions() {
    const questions = await this.prisma.question.findMany({
      where: { signalisation_visible: { not: null } },
      select: { signalisation_visible: true },
      distinct: ['signalisation_visible'],
    });

    const signs = questions
      .map((q) => q.signalisation_visible)
      .filter((s) => s !== null) as string[];

    return [...new Set(signs)];
  }

  async seedTrafficSignsFromQuestions() {
    const signs = await this.extractSignsFromQuestions();

    const categorizeSign = (signName: string): string => {
      const lower = signName.toLowerCase();

      // Danger signs
      if (lower.includes('danger') || lower.includes('attention') || lower.includes('travaux')) {
        return 'danger';
      }

      // Interdiction signs
      if (lower.includes('interdit') || lower.includes('pas') || lower.includes('no')) {
        return 'interdiction';
      }

      // Obligation signs
      if (lower.includes('obligation') || lower.includes('must')) {
        return 'obligation';
      }

      // Priority signs
      if (
        lower.includes('priorite') ||
        lower.includes('priority') ||
        lower.includes('stop') ||
        lower.includes('cedez')
      ) {
        return 'priorite';
      }

      // Default to indication
      return 'indication';
    };

    const createdSigns: any[] = [];

    for (const signName of signs) {
      const category = categorizeSign(signName);

      try {
        const sign = await this.prisma.trafficSign.create({
          data: {
            name: signName,
            meaning: `Signal de ${category}`,
            category,
            description: `Signal routier: ${signName}`,
            image: null, // Can be populated later with actual images
          },
        });
        createdSigns.push(sign);
      } catch (error) {
        // Sign might already exist, skip
        console.log(`Sign ${signName} already exists or creation failed`);
      }
    }

    return createdSigns;
  }

  async getSignsForQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { signalisation_visible: true },
    });

    if (!question || !question.signalisation_visible) {
      return [];
    }

    const signs = await this.prisma.trafficSign.findMany({
      where: {
        name: {
          contains: question.signalisation_visible,
          mode: 'insensitive',
        },
      },
    });

    return signs;
  }

  async getQuestionsForSign(signId: string, limit = 5) {
    const sign = await this.findById(signId);

    const questions = await this.prisma.question.findMany({
      where: {
        signalisation_visible: {
          contains: sign.name,
          mode: 'insensitive',
        },
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            label: true,
          },
        },
        choices: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return questions;
  }
}
