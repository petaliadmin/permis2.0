import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { spaceFromHost, ownerOf, hostForSpace } from '@/lib/space';

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
  // host (same path). Convenience only — never a security check.
  const owner = ownerOf(pathname);
  if (owner && owner !== space) {
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

  // Expose the current space to Server Components via `headers()`.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-permis-space', space);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|manifest.json|sw.js|icon|api).*)'],
};
