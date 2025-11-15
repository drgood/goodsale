import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';

export const config = {
  matcher: [
    // Admin protected
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/cron/:path*',

    // Tenant protected routes (path-based)
    '/:tenant/dashboard/:path*',
    '/:tenant/products/:path*',
    '/:tenant/customers/:path*',
    '/:tenant/settings/:path*',
    '/:tenant/billing/:path*',
    '/:tenant/pos/:path*',
  ],
};

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    // Keep middleware light; auth is enforced via callbacks below.
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Always allow global login & signup
        if (path === '/login' || path === '/signup') return true;

        // Tenant login pages (/:tenant/login)
        if (/^\/[^\/]+\/login$/.test(path)) return true;

        // Allow API routes except admin API
        if (path.startsWith('/api/') && !path.startsWith('/api/admin')) {
          return true;
        }

        // Admin pages require superAdmin
        if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
          return token?.isSuperAdmin === true;
        }

        // All tenant protected routes require ANY logged-in user
        return !!token;
      },
    },

    // Default login page for missing auth on protected routes
    pages: {
      signIn: '/admin/login',
    },
  }
);
