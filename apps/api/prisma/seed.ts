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
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed cannot run in production environment');
    process.exit(1);
  }

  console.log('🌱 Starting database seeding...');

  try {
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
      // Use findFirst + create/update to avoid duplicate categories on re-seed
      const existing = await prisma.category.findFirst({
        where: { label: category.label },
      });
      let created;
      if (existing) {
        created = await prisma.category.update({
          where: { id: existing.id },
          data: {
            description: category.description,
            couleur: category.couleur,
            icone: category.icone,
          },
        });
      } else {
        created = await prisma.category.create({
          data: {
            label: category.label,
            description: category.description,
            couleur: category.couleur,
            icone: category.icone,
          },
        });
      }
      createdCategories[category.id] = created.id;
    }
    console.log(`✅ Seeded ${categories.length} categories`);

    // Some lesson arrays (e.g. `regles`) mix plain strings and structured
    // objects across fiches; the schema stores String[], so normalize each
    // element to a readable string without losing the source data.
    const toStringArray = (arr?: unknown[]): string[] =>
      (arr || []).map((item) =>
        typeof item === 'string' ? item : Object.values(item as Record<string, unknown>).join(' — ')
      );

    // Seed lessons
    for (const lesson of fiches) {
      const categoryId = createdCategories[lesson.categorie];
      if (categoryId) {
        const lessonData = {
          categoryId,
          titre: lesson.titre,
          contenu: lesson.contenu,
          points_cles: toStringArray(lesson.points_cles),
          exceptions: toStringArray(lesson.exceptions),
          erreurs_frequentes: toStringArray(lesson.erreurs_frequentes),
          regles: toStringArray(lesson.regles),
          illustrations: toStringArray(lesson.illustrations),
        };
        const existingLesson = await prisma.lesson.findFirst({
          where: { titre: lesson.titre, categoryId },
        });
        if (existingLesson) {
          await prisma.lesson.update({ where: { id: existingLesson.id }, data: lessonData });
        } else {
          await prisma.lesson.create({ data: lessonData });
        }
      }
    }
    console.log(`✅ Seeded ${fiches.length} lessons`);

    // Seed series and questions
    const series = [
      {
        code: 'B1',
        name: 'Série 1',
        description: 'Première série de 25 questions',
        questions: serieB1,
      },
      {
        code: 'B2',
        name: 'Série 2',
        description: 'Deuxième série de 25 questions',
        questions: serieB2,
      },
      {
        code: 'B3',
        name: 'Série 3',
        description: 'Troisième série de 25 questions',
        questions: serieB3,
      },
    ];

    for (const seriesData of series) {
      // Series has @unique on `code` — safe to upsert
      const createdSeries = await prisma.series.upsert({
        where: { code: seriesData.code },
        update: {
          name: seriesData.name,
          description: seriesData.description,
        },
        create: {
          code: seriesData.code,
          name: seriesData.name,
          description: seriesData.description,
        },
      });

      for (const question of seriesData.questions) {
        const categoryId = createdCategories[question.categorie] || createdCategories['Général'];
        // Question is uniquely identified by (serieId, numero)
        const existingQuestion = await prisma.question.findFirst({
          where: { serieId: createdSeries.id, numero: question.numero },
        });
        let createdQuestion;
        const questionData = {
          serieId: createdSeries.id,
          categoryId,
          numero: question.numero,
          enonce: question.enonce,
          signalisation_visible: question.signalisation_visible,
          reponses_correctes: question.reponses_correctes,
          explication: question.explication,
        };
        if (existingQuestion) {
          createdQuestion = await prisma.question.update({
            where: { id: existingQuestion.id },
            data: questionData,
          });
        } else {
          createdQuestion = await prisma.question.create({ data: questionData });
          // Create choices only for new questions
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
      }

      console.log(
        `✅ Seeded series ${seriesData.code} with ${seriesData.questions.length} questions`
      );
    }

    // Seed traffic signs progressively (batch of 10) to avoid timeouts
    const panneauxData = JSON.parse(fs.readFileSync(panneauxPath, 'utf-8'));
    const panneaux = panneauxData.panneaux || [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < panneaux.length; i += BATCH_SIZE) {
      const batch = panneaux.slice(i, i + BATCH_SIZE);
      for (const pan of batch) {
        try {
          const signData = {
            name: pan.nom,
            code: pan.code,
            meaning: pan.signification,
            category: pan.categorie,
            description: pan.description,
            contexte_usage: pan.contexte_usage,
            regle_associee: pan.regle_associee,
            icone: pan.icone,
            image: `/images/signs/${pan.code}.svg`,
          };
          const existingSign = await prisma.trafficSign.findFirst({
            where: { name: pan.nom },
          });
          if (existingSign) {
            await prisma.trafficSign.update({ where: { id: existingSign.id }, data: signData });
          } else {
            await prisma.trafficSign.create({ data: signData });
          }
        } catch (error) {
          console.log(`Sign ${pan.nom} creation/update failed`);
        }
      }
      console.log(
        `✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${Math.min(i + BATCH_SIZE, panneaux.length)}/${panneaux.length} traffic signs seeded`
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Created ${panneaux.length} traffic signs`);

    // Seed boutique product — annual subscription
    await prisma.product.upsert({
      where: { sku: 'abo_annuel' },
      update: {
        title: 'Abonnement Annuel',
        description:
          'Accès illimité à toutes les séries, examens blancs et cours de conduite pendant 1 an.',
        kind: 'subscription',
        priceXof: 2900,
        active: true,
        ordre: 1,
        grants: ['premium_all'],
        validityDays: 365,
      },
      create: {
        sku: 'abo_annuel',
        title: 'Abonnement Annuel',
        description:
          'Accès illimité à toutes les séries, examens blancs et cours de conduite pendant 1 an.',
        kind: 'subscription',
        priceXof: 2900,
        active: true,
        ordre: 1,
        grants: ['premium_all'],
        validityDays: 365,
      },
    });
    console.log('✅ Seeded product: abo_annuel');

    // Seed boutique products — school_pack (Horizon 0: white-label bulk licenses
    // sold to an auto-école). Price per seat decreases with pack size to
    // incentivize volume. Each seat grants the same premium_all access as
    // abo_annuel, for the same validity period.
    const schoolPacks = [
      { sku: 'pack_ecole_10', title: 'Pack École — 10 places', seats: 10, priceXof: 25000, ordre: 10 },
      { sku: 'pack_ecole_20', title: 'Pack École — 20 places', seats: 20, priceXof: 46000, ordre: 11 },
      { sku: 'pack_ecole_50', title: 'Pack École — 50 places', seats: 50, priceXof: 100000, ordre: 12 },
    ];
    for (const pack of schoolPacks) {
      const data = {
        title: pack.title,
        description: `Accès premium (${pack.seats} élèves) pour votre auto-école, distribué par code individuel.`,
        kind: 'school_pack',
        priceXof: pack.priceXof,
        active: true,
        ordre: pack.ordre,
        grants: ['premium_all'],
        validityDays: 365,
        seats: pack.seats,
      };
      await prisma.product.upsert({
        where: { sku: pack.sku },
        update: data,
        create: { sku: pack.sku, ...data },
      });
    }
    console.log(`✅ Seeded ${schoolPacks.length} school_pack products`);

    // Seed demo auto-écoles — populates the public directory (/ecoles) with a
    // realistic spread across Senegalese cities so the map, filters and cards
    // have something to show before real schools onboard. Upserted by slug,
    // always ACTIVE so they appear in listActive().
    const HOURS_STD = {
      'Lun – Ven': '08:00 – 18:00',
      Samedi: '09:00 – 13:00',
      Dimanche: 'Fermé',
    };
    const demoSchools = [
      {
        slug: 'auto-ecole-la-teranga-dakar',
        name: 'Auto-École La Téranga',
        city: 'Dakar',
        district: 'Plateau',
        address: 'Avenue Léopold Sédar Senghor, Dakar',
        latitude: 14.6708,
        longitude: -17.4381,
        priceXof: 90000,
        licenseCategories: ['A', 'B'],
        services: ['Code en salle', 'Conduite', 'Cours en wolof', 'Examen blanc'],
      },
      {
        slug: 'auto-ecole-baobab-point-e',
        name: 'Auto-École Baobab',
        city: 'Dakar',
        district: 'Point E',
        address: 'Rue de Fatick, Point E, Dakar',
        latitude: 14.6937,
        longitude: -17.4632,
        priceXof: 110000,
        licenseCategories: ['B', 'C'],
        services: ['Code en ligne', 'Conduite', 'Simulateur', 'Permis accéléré'],
      },
      {
        slug: 'auto-ecole-liberte-mermoz',
        name: 'Auto-École Liberté',
        city: 'Dakar',
        district: 'Mermoz',
        address: 'Cité Mermoz, Dakar',
        latitude: 14.7057,
        longitude: -17.4776,
        priceXof: 85000,
        licenseCategories: ['A', 'B'],
        services: ['Code en salle', 'Conduite', 'Reprise de conduite'],
      },
      {
        slug: 'auto-ecole-sahel-guediawaye',
        name: 'Auto-École du Sahel',
        city: 'Guédiawaye',
        district: 'Golf Sud',
        address: 'Boulevard du Centenaire, Guédiawaye',
        latitude: 14.7769,
        longitude: -17.4058,
        priceXof: 70000,
        licenseCategories: ['B'],
        services: ['Code en salle', 'Conduite', 'Cours en wolof'],
      },
      {
        slug: 'auto-ecole-plateau-rufisque',
        name: 'Auto-École Plateau',
        city: 'Rufisque',
        district: 'Rufisque Est',
        address: 'Route Nationale 1, Rufisque',
        latitude: 14.7153,
        longitude: -17.2739,
        priceXof: 65000,
        licenseCategories: ['B', 'D'],
        services: ['Code en salle', 'Conduite', 'Transport en commun'],
      },
      {
        slug: 'auto-ecole-cap-vert-thies',
        name: 'Auto-École Cap-Vert',
        city: 'Thiès',
        district: 'Randoulène',
        address: 'Avenue Caen, Thiès',
        latitude: 14.7886,
        longitude: -16.9337,
        priceXof: 75000,
        licenseCategories: ['A', 'B', 'C'],
        services: ['Code en salle', 'Code en ligne', 'Conduite', 'Examen blanc'],
      },
      {
        slug: 'auto-ecole-petite-cote-mbour',
        name: 'Auto-École Petite Côte',
        city: 'Mbour',
        district: 'Château d’eau',
        address: 'Route de Joal, Mbour',
        latitude: 14.4155,
        longitude: -16.9663,
        priceXof: 68000,
        licenseCategories: ['A', 'B'],
        services: ['Code en salle', 'Conduite', 'Permis accéléré'],
      },
      {
        slug: 'auto-ecole-ndar-saint-louis',
        name: 'Auto-École Ndar',
        city: 'Saint-Louis',
        district: 'Sor',
        address: 'Avenue Général de Gaulle, Saint-Louis',
        latitude: 16.0179,
        longitude: -16.4896,
        priceXof: 72000,
        licenseCategories: ['B', 'C'],
        services: ['Code en salle', 'Conduite', 'Cours en wolof'],
      },
      {
        slug: 'auto-ecole-saloum-kaolack',
        name: 'Auto-École du Saloum',
        city: 'Kaolack',
        district: 'Léona',
        address: 'Avenue Valdiodio Ndiaye, Kaolack',
        latitude: 14.1516,
        longitude: -16.0728,
        priceXof: 60000,
        licenseCategories: ['B', 'D'],
        services: ['Code en salle', 'Conduite', 'Transport en commun'],
      },
      {
        slug: 'auto-ecole-casamance-ziguinchor',
        name: 'Auto-École Casamance',
        city: 'Ziguinchor',
        district: 'Escale',
        address: 'Rue du Commerce, Ziguinchor',
        latitude: 12.5641,
        longitude: -16.2735,
        priceXof: 58000,
        licenseCategories: ['A', 'B'],
        services: ['Code en salle', 'Conduite', 'Cours en wolof'],
      },
      {
        slug: 'auto-ecole-touba-darou',
        name: 'Auto-École Touba Darou Salam',
        city: 'Touba',
        district: 'Darou Khoudoss',
        address: 'Boulevard 28, Touba',
        latitude: 14.8676,
        longitude: -15.8785,
        priceXof: 62000,
        licenseCategories: ['B', 'C', 'E'],
        services: ['Code en salle', 'Conduite', 'Poids lourd'],
      },
      {
        slug: 'auto-ecole-almadies-dakar',
        name: 'Auto-École Les Almadies',
        city: 'Dakar',
        district: 'Almadies',
        address: 'Route des Almadies, Dakar',
        latitude: 14.7442,
        longitude: -17.5188,
        priceXof: 135000,
        licenseCategories: ['B'],
        services: ['Conduite', 'Simulateur', 'Permis accéléré', 'Reprise de conduite'],
      },
    ];
    for (const s of demoSchools) {
      const phoneDigits = 700000000 + Math.floor(Math.random() * 99999999);
      const data = {
        name: s.name,
        status: 'ACTIVE' as const,
        city: s.city,
        district: s.district,
        address: s.address,
        phone: `+221 33 ${String(phoneDigits).slice(0, 3)} ${String(phoneDigits).slice(3, 5)} ${String(phoneDigits).slice(5, 7)}`,
        whatsapp: `+221 77 ${String(phoneDigits).slice(0, 3)} ${String(phoneDigits).slice(3, 5)} ${String(phoneDigits).slice(5, 7)}`,
        email: `contact@${s.slug.replace(/^auto-ecole-/, '').replace(/-/g, '')}.sn`,
        openingHours: HOURS_STD,
        services: s.services,
        licenseCategories: s.licenseCategories,
        priceXof: s.priceXof,
        latitude: s.latitude,
        longitude: s.longitude,
      };
      await prisma.school.upsert({
        where: { slug: s.slug },
        update: data,
        create: { slug: s.slug, ...data },
      });
    }
    console.log(`✅ Seeded ${demoSchools.length} demo auto-écoles`);

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
