import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/jwt';

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const { pathname } = request.nextUrl;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && session.role === 'USER') {
    return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
  }

  return NextResponse.next();
}
