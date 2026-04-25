import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const publicRoutes = ['/login'];
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for auth (simplified, real check in component)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|public|api).*)'],
};
