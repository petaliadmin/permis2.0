import {
  IconAlertTriangle,
  IconBan,
  IconSquareRotated,
  IconArrowRight,
  IconArrowUp,
  IconTrafficCone,
  IconMapPin,
  IconRoad,
  IconTrafficLights,
  IconUserShield,
  IconRoadSign,
} from '@tabler/icons-react';

/**
 * Category metadata + grouping/ordering rules for the traffic-signs hub.
 * Shared between the server-rendered hub (app/traffic-signs/page.tsx) and
 * the interactive client picker (TrafficSignsClient) so the two never
 * diverge on labels, order, or which categories are shown.
 */

type IconComponent = React.ComponentType<{
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

export interface CategoryMeta {
  label: string;
  icon: IconComponent;
  color: string;
}

export const CAT_META: Record<string, CategoryMeta> = {
  danger: { label: 'Danger', icon: IconAlertTriangle, color: '#EF4444' },
  interdiction: { label: 'Interdiction', icon: IconBan, color: '#DC2626' },
  priorité: { label: 'Priorité', icon: IconSquareRotated, color: '#F59E0B' },
  obligation: { label: 'Obligation', icon: IconArrowRight, color: '#2563EB' },
  indication: { label: 'Indication', icon: IconArrowUp, color: '#0000FD' },
  temporaires: { label: 'Temporaires', icon: IconTrafficCone, color: '#F97316' },
  balises: { label: 'Balises', icon: IconMapPin, color: '#64748B' },
  marquage: { label: 'Marquage sol', icon: IconRoad, color: '#71717A' },
  feux: { label: 'Feux tricolores', icon: IconTrafficLights, color: '#16A34A' },
  agents: { label: 'Agents', icon: IconUserShield, color: '#7C3AED' },
};

export function categoryMeta(cat: string): CategoryMeta {
  return CAT_META[cat] ?? { label: cat, icon: IconRoadSign, color: '#64748B' };
}

// Pedagogical order: dangers → priority rules → prohibitions → obligations,
// then information/complementary signage.
export const CATEGORY_ORDER = ['danger', 'priorité', 'interdiction', 'obligation', 'indication'];

// Categories dropped from the picker (too few signs to justify their own card).
export const HIDDEN_CATEGORIES = ['temporaires', 'balises', 'marquage', 'feux', 'agents'];

export interface MinimalSign {
  name: string;
  category: string;
}

/** Picker-visible categories in pedagogical order, each with its signs.
 *  Drops HIDDEN_CATEGORIES — a UX curation choice ("too few signs for their
 *  own card") that only applies to the interactive picker. */
export function groupByCategory<T extends MinimalSign>(signs: T[]): { category: string; signs: T[] }[] {
  return groupAllByCategory(signs).filter(({ category }) => !HIDDEN_CATEGORIES.includes(category));
}

/** Every category with its signs, pedagogical ones first — no exclusions.
 *  For the full SEO index (TrafficSignsFullIndex): every sign that has a
 *  real, indexable fiche should be linked from the hub, regardless of
 *  whether the picker's curated view gives its category its own card. */
export function groupAllByCategory<T extends MinimalSign>(signs: T[]): { category: string; signs: T[] }[] {
  const grouped: Record<string, T[]> = {};
  for (const s of signs) (grouped[s.category] ??= []).push(s);

  const order = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return order.map((category) => ({ category, signs: grouped[category] ?? [] }));
}
