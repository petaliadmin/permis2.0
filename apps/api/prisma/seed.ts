import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Category {
  id: string;
  label: string;
  description: string;
  couleur: string;
  icone: string;
}

interface Lesson {
  id: string;
  categorie: string;
  titre: string;
  contenu: string;
  points_cles: string[];
  exceptions?: string[];
  erreurs_frequentes?: string[];
  regles?: string[];
  illustrations?: string[];
}

interface Question {
  numero: number;
  enonce: string;
  signalisation_visible?: string;
  propositions: { lettre: string; texte: string }[];
  reponses_correctes: string[];
  explication: string;
  categorie: string;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await prisma.favorite.deleteMany();
    await prisma.examQuestion.deleteMany();
    await prisma.examResult.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.statistic.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.choice.deleteMany();
    await prisma.question.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.series.deleteMany();
    await prisma.category.deleteMany();
    await prisma.trafficSign.deleteMany();
    console.log('✅ Cleared existing data');

    // Load JSON files
    const baseDir = path.dirname(__filename);
    const categoriesPath = path.join(baseDir, '../../../categories_et_meta.json');
    const fichesPath = path.join(baseDir, '../../../fiches_theoriques.json');
    const b1Path = path.join(baseDir, '../../../serie_B1.json');
    const b2Path = path.join(baseDir, '../../../serie_B2.json');
    const b3Path = path.join(baseDir, '../../../serie_B3.json');
    const panneauxPath = path.join(baseDir, '../../../panneaux_senegal.json');

    // JSON files wrap their arrays: { categories: [...] }, { fiches: [...]
    const categories: Category[] = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8')).categories;
    const fiches: Lesson[] = JSON.parse(fs.readFileSync(fichesPath, 'utf-8')).fiches;
    const serieB1: Question[] = JSON.parse(fs.readFileSync(b1Path, 'utf-8')).questions;
    const serieB2: Question[] = JSON.parse(fs.readFileSync(b2Path, 'utf-8')).questions;
    const serieB3: Question[] = JSON.parse(fs.readFileSync(b3Path, 'utf-8')).questions;

    // Seed categories — lessons and questions reference categories by their JSON `id`
    const createdCategories: { [key: string]: string } = {};
    for (const category of categories) {
      const created = await prisma.category.create({
        data: {
          label: category.label,
          description: category.description,
          couleur: category.couleur,
          icone: category.icone,
        },
      });
      createdCategories[category.id] = created.id;
    }
    console.log(`✅ Created ${categories.length} categories`);

    // Some lesson arrays (e.g. `regles`) mix plain strings and structured
    // objects across fiches; the schema stores String[], so normalize each
    // element to a readable string without losing the source data.
    const toStringArray = (arr?: unknown[]): string[] =>
      (arr || []).map((item) =>
        typeof item === 'string'
          ? item
          : Object.values(item as Record<string, unknown>).join(' — ')
      );

    // Seed lessons
    for (const lesson of fiches) {
      const categoryId = createdCategories[lesson.categorie];
      if (categoryId) {
        await prisma.lesson.create({
          data: {
            categoryId,
            titre: lesson.titre,
            contenu: lesson.contenu,
            points_cles: toStringArray(lesson.points_cles),
            exceptions: toStringArray(lesson.exceptions),
            erreurs_frequentes: toStringArray(lesson.erreurs_frequentes),
            regles: toStringArray(lesson.regles),
            illustrations: toStringArray(lesson.illustrations),
          },
        });
      }
    }
    console.log(`✅ Created ${fiches.length} lessons`);

    // Seed series and questions
    const series = [
      { code: 'B1', name: 'Série 1', description: 'Première série de 25 questions', questions: serieB1 },
      { code: 'B2', name: 'Série 2', description: 'Deuxième série de 25 questions', questions: serieB2 },
      { code: 'B3', name: 'Série 3', description: 'Troisième série de 25 questions', questions: serieB3 },
    ];

    for (const seriesData of series) {
      const createdSeries = await prisma.series.create({
        data: {
          code: seriesData.code,
          name: seriesData.name,
          description: seriesData.description,
        },
      });

      for (const question of seriesData.questions) {
        const categoryId = createdCategories[question.categorie] || createdCategories['Général'];
        const createdQuestion = await prisma.question.create({
          data: {
            serieId: createdSeries.id,
            categoryId,
            numero: question.numero,
            enonce: question.enonce,
            signalisation_visible: question.signalisation_visible,
            reponses_correctes: question.reponses_correctes,
            explication: question.explication,
          },
        });

        // Create choices
        for (let i = 0; i < question.propositions.length; i++) {
          await prisma.choice.create({
            data: {
              questionId: createdQuestion.id,
              text: question.propositions[i].texte,
              order: i + 1,
            },
          });
        }
      }

      console.log(`✅ Created series ${seriesData.code} with ${seriesData.questions.length} questions`);
    }

    // Seed traffic signs progressively (batch of 10) to avoid timeouts
    const panneauxData = JSON.parse(fs.readFileSync(panneauxPath, 'utf-8'));
    const panneaux = panneauxData.panneaux || [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < panneaux.length; i += BATCH_SIZE) {
      const batch = panneaux.slice(i, i + BATCH_SIZE);
      for (const pan of batch) {
        try {
          await prisma.trafficSign.create({
            data: {
              name: pan.nom,
              code: pan.code,
              meaning: pan.signification,
              category: pan.categorie,
              description: pan.description,
              contexte_usage: pan.contexte_usage,
              regle_associee: pan.regle_associee,
              icone: pan.icone,
              image: `/images/signs/${pan.code}.svg`,
            },
          });
        } catch (error) {
          console.log(`Sign ${pan.nom} already exists or creation failed`);
        }
      }
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${Math.min(i + BATCH_SIZE, panneaux.length)}/${panneaux.length} traffic signs seeded`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Created ${panneaux.length} traffic signs`);

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
