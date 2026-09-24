/**
 * One-shot, idempotent data migration: converts every active premium_all
 * Entitlement into an ACTIVE STUDENT Subscription row, before the old
 * Product/Purchase/Entitlement tables are dropped from the schema.
 *
 * School.subscriptionExpiresAt / trialEndsAt / featuredUntil need NO
 * migration — those columns are untouched by this refactor and carry over
 * as-is (they were never derived from Product/Purchase in a way this script
 * needs to replicate).
 *
 * Run this BEFORE removing Product/Purchase/Entitlement from schema.prisma
 * and running `prisma db push --accept-data-loss`. Safe to re-run.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FAR_FUTURE_DAYS = 3650; // legacy permanent grants (expiresAt: null) → 10y

async function main() {
  const studentPlan = await prisma.subscriptionPlan.findFirst({
    where: { type: 'STUDENT', active: true },
    orderBy: { ordre: 'asc' },
  });
  if (!studentPlan) {
    throw new Error('Seed the STUDENT subscription plan before running this migration.');
  }

  const now = new Date();
  // Raw SQL, not prisma.entitlement — the `entitlements` table may already be
  // gone from schema.prisma (and the generated client) by the time this runs
  // against a given environment, but the physical table still exists in the
  // DB until the destructive `db push --accept-data-loss` (phase 3). Reading
  // it via $queryRaw works regardless of what the current client knows about.
  const activeEntitlements = await prisma.$queryRaw<
    Array<{ userId: string; expiresAt: Date | null; createdAt: Date }>
  >`SELECT "userId", "expiresAt", "createdAt" FROM "entitlements"
    WHERE "key" = 'premium_all' AND ("expiresAt" IS NULL OR "expiresAt" > ${now})`;

  let migrated = 0;
  let skipped = 0;
  for (const ent of activeEntitlements) {
    const already = await prisma.subscription.findFirst({
      where: { userId: ent.userId, planId: studentPlan.id, status: 'ACTIVE' },
    });
    if (already) {
      skipped++;
      continue;
    }
    const endDate = ent.expiresAt ?? new Date(now.getTime() + FAR_FUTURE_DAYS * 86_400_000);
    await prisma.subscription.create({
      data: {
        userId: ent.userId,
        planId: studentPlan.id,
        status: 'ACTIVE',
        paymentMethod: 'ADMIN', // origin unknown post-hoc — tagged as a migrated legacy grant
        amountXof: studentPlan.priceXof,
        startDate: ent.createdAt,
        endDate,
        requestedAt: ent.createdAt,
        confirmedAt: ent.createdAt,
      },
    });
    migrated++;
  }

  console.log(
    `Migrated ${migrated}, skipped ${skipped} (already migrated) of ${activeEntitlements.length} active premium_all entitlements.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
