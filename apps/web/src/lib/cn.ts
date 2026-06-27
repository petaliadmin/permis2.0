/**
 * Minimal className combiner — joins truthy class values with a space.
 * Kept dependency-free so the web app does not require clsx/tailwind-merge.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
