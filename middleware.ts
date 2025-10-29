import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session token
  const token = await getToken({ req: request });

  // Public routes that don't need authentication
  const publicRoutes = ['/admin/login'];

  // Admin routes that require super admin authentication
  const adminRoutes = ['/admin/dashboard', '/admin/tenants', '/admin/plans', '/admin/profile', '/admin/settings'];

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute) {
    // If not authenticated or not a super admin, redirect to login
    if (!token || !token.isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // If trying to access login and already authenticated as super admin, redirect to dashboard
  if (pathname === '/admin/login' && token?.isSuperAdmin) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
