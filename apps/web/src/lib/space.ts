/**
 * Subdomain "spaces". One Next.js app is served on four hosts:
 *   - permis2.com / www.permis2.com  → `www`   (marketing + auto-école directory)
 *   - learn.permis2.com              → `learn` (student learning app)
 *   - school.permis2.com             → `school` (auto-école management)
 *   - admin.permis2.com              → `admin` (platform administration)
 *
 * Spaces are *themed entry points*, not a security boundary: they pick the
 * default home + menu, and deep links to another space's routes get redirected
 * to the owning host — but real access stays enforced by the API guards
 * (platform Role, per-school SchoolMemberRole). The auth cookie is already
 * `Domain=.permis2.com` (apps/api/src/auth/auth.controller.ts) so the session
 * is shared across all four; the admin space additionally requires
 * `role === 'ADMIN'`, enforced by `/admin`'s own guard + the API.
 *
 * Local dev uses `*.localhost` (learn.localhost:3000, school.localhost:3000,
 * admin.localhost:3000), which every modern browser resolves to 127.0.0.1
 * automatically.
 */

export type Space = 'www' | 'learn' | 'school' | 'admin';

const SUBDOMAIN_PREFIXES: Record<string, Space> = {
  'learn.': 'learn',
  'school.': 'school',
  'admin.': 'admin',
  'www.': 'www',
};

/** Route prefixes each space owns. Anything not listed is "neutral" (loads on
 *  any host): `/`, `/auth/*`, `/onboarding`. */
const OWNED_PREFIXES: Record<Space, string[]> = {
  www: ['/ecoles', '/pack-ecole', '/assistance'],
  learn: [
    '/traffic-signs',
    '/cours',
    '/quizz',
    '/tests',
    '/exam',
    '/boutique',
    '/mes-auto-ecoles',
    '/notifications',
    '/profil',
  ],
  school: ['/mon-ecole', '/auto-ecole'],
  admin: ['/admin'],
};

export function spaceFromHost(host?: string | null): Space {
  const hostname = (host ?? '').split(':')[0].toLowerCase();
  for (const [prefix, space] of Object.entries(SUBDOMAIN_PREFIXES)) {
    if (hostname.startsWith(prefix)) return space;
  }
  return 'www';
}

/** The space that owns a pathname, or `null` for neutral routes. */
export function ownerOf(pathname: string): Space | null {
  for (const space of ['learn', 'school', 'admin', 'www'] as const) {
    for (const prefix of OWNED_PREFIXES[space]) {
      if (pathname === prefix || pathname.startsWith(prefix + '/')) return space;
    }
  }
  return null;
}

/**
 * Given the current Host header, return the Host for `target` — keeping the
 * base domain and port. Every space gets its own labelled subdomain
 * (`www.` / `learn.` / `school.`), including locally: the front hosts are
 * `www.localhost:3000`, `learn.localhost:3000`, `school.localhost:3000`
 * (bare `localhost:3000` also resolves as the `www` space, it just isn't the
 * redirect target). A single labelled host avoids relative-redirect loops when
 * Next's dev server origin happens to equal the bare base.
 */
export function hostForSpace(currentHost: string, target: Space): string {
  const [hostname, port] = currentHost.split(':');
  const lower = hostname.toLowerCase();

  let base = lower;
  for (const prefix of Object.keys(SUBDOMAIN_PREFIXES)) {
    if (lower.startsWith(prefix)) {
      base = lower.slice(prefix.length);
      break;
    }
  }

  const outHost = `${target}.${base}`;
  return port ? `${outHost}:${port}` : outHost;
}

/** The space a profile type lands in by default. */
export function spaceForProfile(profileType?: string | null): Space {
  return profileType === 'AUTO_ECOLE' ? 'school' : 'learn';
}

/** Client-only: full-page navigate to `path` on `target` space (crosses origin). */
export function gotoSpace(target: Space, path = '/'): void {
  window.location.href = `${window.location.protocol}//${hostForSpace(window.location.host, target)}${path}`;
}
