/**
 * Synchronise le contenu éditorial (panneaux, questions de quiz, diapos
 * d'examen) depuis les fichiers JSON du dossier web vers la base de données.
 * Idempotent : upsert par clé naturelle (code panneau, id question, id diapo).
 *
 *   pnpm --filter @permis2.0/api run sync:content
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const WEB_DATA = path.resolve(__dirname, '../../web/public/data');

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(WEB_DATA, file), 'utf8')) as T;
}

// ─── Panneaux ──────────────────────────────────────────────────────────────────

interface PanneauJson {
  code: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  advice: string[];
}

async function syncPanneaux() {
  const panneaux = readJson<PanneauJson[]>('panneaux.json');
  let i = 0;
  for (const p of panneaux) {
    i += 1;
    const data = {
      name: p.name,
      category: p.category,
      description: p.description,
      meaning: p.description,
      advice: p.advice,
      ordre: i,
      icone: p.icon,
      image: `/icons/panneaux/${p.code}.svg`,
    };
    const existing = await prisma.trafficSign.findFirst({ where: { code: p.code } });
    if (existing) await prisma.trafficSign.update({ where: { id: existing.id }, data });
    else await prisma.trafficSign.create({ data: { code: p.code, ...data } });
  }
  // Remove DB rows whose code no longer exists in the source of truth
  const codes = panneaux.map((p) => p.code);
  const removed = await prisma.trafficSign.deleteMany({
    where: { OR: [{ code: null }, { code: { notIn: codes } }] },
  });
  console.log(`✅ Panneaux: ${panneaux.length} synchronisés, ${removed.count} obsolètes retirés`);
}

// ─── Questions de quiz ─────────────────────────────────────────────────────────

interface QuizQuestionJson {
  id: string;
  categorie: string;
  enonce: string;
  options: string[];
  bonneReponse: string;
  explication?: string;
  image?: string;
}

const CATEGORY_META: Record<string, { couleur: string; icone: string }> = {
  'Panneaux de danger': { couleur: '#EF4444', icone: 'ti-alert-triangle' },
  "Panneaux d'interdiction": { couleur: '#EF4444', icone: 'ti-ban' },
  'Panneaux de priorité': { couleur: '#F59E0B', icone: 'ti-square-rotated' },
  'Panneaux de direction': { couleur: '#16A34A', icone: 'ti-arrows-right' },
  'Restrictions (hauteur/largeur/poids)': { couleur: '#EF4444', icone: 'ti-ruler' },
  'Priorité aux intersections': { couleur: '#F59E0B', icone: 'ti-arrows-cross' },
  'Priorité & Arrêt (STOP / Cédez)': { couleur: '#F59E0B', icone: 'ti-octagon' },
  'Rond-point & Giratoire': { couleur: '#F59E0B', icone: 'ti-rotate' },
  'Limitation de vitesse': { couleur: '#2563EB', icone: 'ti-gauge' },
  Dépassement: { couleur: '#2563EB', icone: 'ti-car' },
  'Stationnement & Arrêt': { couleur: '#2563EB', icone: 'ti-parking' },
  'Feux tricolores': { couleur: '#16A34A', icone: 'ti-traffic-lights' },
  'Signalisation temporaire': { couleur: '#F97316', icone: 'ti-traffic-cone' },
  'Passage à niveau': { couleur: '#EF4444', icone: 'ti-train' },
};

async function syncQuizQuestions() {
  const questions = readJson<QuizQuestionJson[]>('questions_doc.json');

  // Container series for standalone quiz questions (not tied to exam series)
  const serie = await prisma.series.upsert({
    where: { code: 'QUIZ' },
    update: {},
    create: {
      code: 'QUIZ',
      name: 'Banque de questions Quiz',
      description: 'Questions utilisées par le mode Quiz thématique',
      isFree: true,
    },
  });

  // Ensure categories exist (matched by label)
  const labels = [...new Set(questions.map((q) => q.categorie))];
  const catByLabel = new Map<string, string>();
  for (const label of labels) {
    const meta = CATEGORY_META[label] ?? { couleur: '#64748B', icone: 'ti-cards' };
    const existing = await prisma.category.findFirst({ where: { label } });
    const cat =
      existing ??
      (await prisma.category.create({
        data: { label, description: `Questions : ${label}`, ...meta },
      }));
    catByLabel.set(label, cat.id);
  }

  let created = 0;
  let updated = 0;
  const perCat = new Map<string, number>();
  for (const q of questions) {
    const numero = (perCat.get(q.categorie) ?? 0) + 1;
    perCat.set(q.categorie, numero);
    const data = {
      serieId: serie.id,
      categoryId: catByLabel.get(q.categorie)!,
      numero,
      enonce: q.enonce,
      explication: q.explication ?? '',
      reponses_correctes: [q.bonneReponse],
      image: q.image ?? null,
    };
    const existing = await prisma.question.findUnique({ where: { id: q.id } });
    if (existing) {
      await prisma.$transaction([
        prisma.choice.deleteMany({ where: { questionId: q.id } }),
        prisma.question.update({
          where: { id: q.id },
          data: { ...data, choices: { create: q.options.map((text, order) => ({ text, order })) } },
        }),
      ]);
      updated += 1;
    } else {
      await prisma.question.create({
        data: {
          id: q.id,
          ...data,
          choices: { create: q.options.map((text, order) => ({ text, order })) },
        },
      });
      created += 1;
    }
  }
  console.log(`✅ Questions quiz: ${created} créées, ${updated} mises à jour (série QUIZ)`);
}

// ─── Diapos d'examen ───────────────────────────────────────────────────────────

interface DiaposJson {
  exams: { id: number; title: string; questions: unknown[] }[];
}

async function syncDiapos() {
  const { exams } = readJson<DiaposJson>('diapos.json');
  for (const exam of exams) {
    await prisma.diapoExam.upsert({
      where: { id: exam.id },
      update: { title: exam.title, questions: exam.questions as object[] },
      create: { id: exam.id, title: exam.title, questions: exam.questions as object[] },
    });
  }
  // Remove DB rows whose id no longer exists in the source of truth
  const ids = exams.map((e) => e.id);
  const removed = await prisma.diapoExam.deleteMany({ where: { id: { notIn: ids } } });
  console.log(`✅ Diapos: ${exams.length} examens synchronisés, ${removed.count} obsolètes retirés`);
}

async function main() {
  await syncPanneaux();
  await syncQuizQuestions();
  await syncDiapos();
}

main()
  .catch((e) => {
    console.error('❌ Sync failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
