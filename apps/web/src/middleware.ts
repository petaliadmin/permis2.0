import { NextResponse } from 'next/server';

// i18n routing is not yet implemented (no [locale] segment exists),
// so the middleware is a passthrough. Re-enable next-intl middleware
// once locale-prefixed routes are added under src/app/[locale].
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
