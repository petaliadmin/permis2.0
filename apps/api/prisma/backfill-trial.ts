/**
 * One-time backfill: grants the 3-month free trial (introduced alongside the
 * school_subscription paywall) retroactively to every School that doesn't
 * have one yet — i.e. every school created before this feature existed,
 * which would otherwise stay blocked by SchoolRolesGuard forever with no
 * grace period. Trial is computed from the school's own `createdAt`, not
 * from today, so long-standing schools don't get a fresh 3 months just for
 * having existed before this script ran.
 *
 * Idempotent: only touches rows where subscriptionExpiresAt IS NULL, so
 * schools that already have a trial (new create() path) or a real paid
 * subscription (extended past the trial by ShopService.markPaid) are left
 * untouched. Safe to re-run, and safe to run against production — unlike
 * seed.ts, this doesn't insert demo data.
 *
 *   pnpm --filter @permis2.0/api run prisma:backfill-trial
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  const schools = await prisma.school.findMany({
    where: { subscriptionExpiresAt: null },
    select: { id: true, name: true, createdAt: true },
  });

  if (schools.length === 0) {
    console.log('✅ No school needs a trial backfill.');
    return;
  }

  for (const school of schools) {
    const trialEndsAt = addMonths(school.createdAt, 3);
    await prisma.school.update({
      where: { id: school.id },
      data: { subscriptionExpiresAt: trialEndsAt, trialEndsAt },
    });
    console.log(
      `  ${school.name} (${school.id}) — créée le ${school.createdAt.toISOString().slice(0, 10)}, essai jusqu'au ${trialEndsAt.toISOString().slice(0, 10)}`
    );
  }

  console.log(`✅ Backfilled the 3-month trial for ${schools.length} school(s).`);
}

main()
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
