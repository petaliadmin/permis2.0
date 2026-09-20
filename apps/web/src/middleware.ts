import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { spaceFromHost, ownerOf, hostForSpace, isPublicOnAnyHost } from '@/lib/space';

// Only routes that are entirely meaningless without an account.
// Everything else is accessible as a guest; individual pages prompt for
// login only when a specific action requires it (saving progress, purchasing…).
const PROTECTED_ROUTES = ['/notifications', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // In dev `request.url` / `nextUrl.host` report the server address, not the
  // incoming Host — the real subdomain is only in the header.
  const host = request.headers.get('host') ?? request.nextUrl.host;
  const proto =
    request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');

  // ── Dev: consolidate on *.lvh.me ──────────────────────────────────────────
  // Browsers won't share a cookie across `*.localhost` subdomains, so the
  // session breaks on `localhost` / `127.0.0.1`. `lvh.me` resolves to
  // 127.0.0.1 and behaves like a real domain. (No-op in prod.)
  if (process.env.NODE_ENV !== 'production') {
    const [hostname, port] = host.split(':');
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
      const sub = hostname.endsWith('.localhost') ? hostname.slice(0, -'.localhost'.length) : 'www';
      const to = `${sub}.lvh.me${port ? `:${port}` : ''}`;
      return NextResponse.redirect(`${proto}://${to}${pathname}${search}`, 307);
    }
  }

  const space = spaceFromHost(host);

  // ── Cross-space normalization ──────────────────────────────────────────────
  // A deep link to a route owned by another space is bounced to the owning
  // host (same path). Convenience only — never a security check. Skipped for
  // PUBLIC_ON_ANY_HOST routes (SEO brief Lot 1.1): those stay on whatever
  // host they were requested on instead of bouncing to learn.*.
  const owner = ownerOf(pathname);
  if (owner && owner !== space && !isPublicOnAnyHost(pathname)) {
    const targetHost = hostForSpace(host, owner);
    if (targetHost !== host) {
      return NextResponse.redirect(`${proto}://${targetHost}${pathname}${search}`, 308);
    }
  }

  const token = request.cookies.get('access_token')?.value;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Deliberately no "already logged in → bounce /auth/* to home" redirect:
  // this cookie's mere presence doesn't mean the session is actually valid
  // (expired JWT, rotated JWT_SECRET, blocked user...) — middleware can't
  // verify that without decoding the token, so trusting presence alone
  // previously dead-ended real users with a stale cookie: every visit to
  // /auth/login or /auth/register bounced straight to "/" with no way back
  // to sign in. Harmless to let a genuinely-logged-in visitor see the auth
  // pages; the pages themselves already redirect on a *successful* login.

  // Expose the current space to Server Components via `headers()`. The
  // *owning* space wins over the host-derived one so PUBLIC_ON_ANY_HOST
  // routes keep their learn-space chrome (bottom tabs, menu) even when
  // served from www.* — only the redirect above is skipped, not the UI.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-permis-space', owner ?? space);
  // Lot 2.4 — lets the root layout know which page is rendering, so it can
  // skip its own WebSite/Organization <script> on pages that build their own
  // single merged @graph (see lib/seo/jsonLd.ts) instead of emitting a
  // second, redundant one.
  requestHeaders.set('x-pathname', pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // SEO brief Lot 1.1 (Option A): www is the one indexable host. learn/
  // school/admin serve real content but must never rank on their own — the
  // header is what actually governs indexing (unlike robots.txt, it also
  // covers URLs Google already has), so it's based on the real request host,
  // not the page-chrome `space` above.
  if (space !== 'www') {
    response.headers.set('X-Robots-Tag', 'noindex');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|manifest.json|sw.js|icon|api).*)'],
};
