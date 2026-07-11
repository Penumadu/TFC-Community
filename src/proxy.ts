
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  
  // Protected routes — redirect unauthenticated users to login
  const protectedPaths = ['/directory', '/venues', '/childcare', '/profile', '/admin'];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sw.js (service worker), icons
     * - ~offline (PWA offline page)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|icons|~offline).*)',
  ],
}
