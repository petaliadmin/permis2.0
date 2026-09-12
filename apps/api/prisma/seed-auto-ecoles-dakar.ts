import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

// Real Dakar auto-écoles scraped from Google Maps / annuaires (see
// data/auto-ecoles-dakar.json's own `sources`/`avertissement` fields) — a
// much richer directory seed than the dozen fictional demoSchools in
// seed-schools.ts. Upserted by slug (= the JSON's own `id`, already
// kebab-case). Created PENDING, not ACTIVE: unlike seed-schools.ts's made-up
// entries, these are real third-party businesses that never signed up on
// PERMIS 2.0 — an admin reviews and activates them one by one (or in bulk)
// from /admin/schools before they appear in the public directory.
interface DakarEcole {
  id: string;
  nom: string;
  adresse: string;
  quartier: string;
  ville: string;
  contact: { telephones: string[]; email: string | null; site_web: string | null };
  lat: number | null;
  lng: number | null;
}

function loadEcoles(): DakarEcole[] {
  const path = join(__dirname, '..', '..', '..', 'data', 'auto-ecoles-dakar.json');
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return raw.ecoles;
}

export async function seedAutoEcolesDakar(prisma: PrismaClient) {
  const ecoles = loadEcoles();
  for (const e of ecoles) {
    const data = {
      name: e.nom,
      status: 'PENDING' as const,
      city: e.ville,
      district: e.quartier,
      address: e.adresse,
      phone: e.contact.telephones[0] ?? undefined,
      email: e.contact.email ?? undefined,
      latitude: e.lat ?? undefined,
      longitude: e.lng ?? undefined,
    };
    await prisma.school.upsert({
      where: { slug: e.id },
      update: data,
      create: { slug: e.id, ...data },
    });
  }
  console.log(`✅ Seeded ${ecoles.length} auto-écoles de Dakar (statut PENDING, à activer depuis /admin/schools)`);
}

// Standalone entry point: `pnpm run prisma:seed:dakar`.
if (require.main === module) {
  const prisma = new PrismaClient();
  seedAutoEcolesDakar(prisma)
    .catch((e) => {
      console.error('❌ Seeding Dakar auto-écoles failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
