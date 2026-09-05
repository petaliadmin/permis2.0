import { PrismaClient } from '@prisma/client';

// Demo auto-écoles — populates the public directory (/ecoles) with a
// realistic spread across Senegalese cities so the map, filters and cards
// have something to show before real schools onboard. Upserted by slug,
// always ACTIVE so they appear in listActive().
//
// Kept as its own module (rather than inline in seed.ts) so it can be run
// standalone after restoring a database backup that predates this table —
// backups don't carry local-only demo data, and re-running the *whole*
// seed against restored real content would duplicate categories/lessons/
// questions that don't dedupe by natural key the way schools do by slug.
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

export async function seedDemoSchools(prisma: PrismaClient) {
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
}

// Standalone entry point: `pnpm run prisma:seed:schools`.
if (require.main === module) {
  const prisma = new PrismaClient();
  seedDemoSchools(prisma)
    .catch((e) => {
      console.error('❌ Seeding demo schools failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
