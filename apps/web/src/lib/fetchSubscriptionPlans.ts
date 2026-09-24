import type { SubscriptionPlan } from '@permis2.0/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Server-side fetch of the active subscription plan catalog (élève /
 * auto-école / top auto-école) — used by /tarifs and the homepage pricing
 * section. Real prices only: an empty array on any failure, never a guessed
 * fallback figure.
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const res = await fetch(`${API_URL}/subscriptions/plans`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const plans = await res.json();
    return Array.isArray(plans) ? plans : [];
  } catch {
    return [];
  }
}

export const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export function planByType(
  plans: SubscriptionPlan[],
  type: SubscriptionPlan['type']
): SubscriptionPlan | null {
  return (
    plans
      .filter((p) => p.type === type && p.active)
      .sort((a, b) => a.ordre - b.ordre)[0] ?? null
  );
}
