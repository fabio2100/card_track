import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/validar', '/no_validado'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and API auth route through unconditionally
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('logged');

  if (cookie?.value === 'logged') {
    return NextResponse.next();
  }

  // Not authenticated → go to /validar, preserving the original destination
  const url = request.nextUrl.clone();
  url.pathname = '/validar';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
