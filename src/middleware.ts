import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { extractSubdomain } from '@/lib/subdomain';

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/cron/:path*',
    '/:tenant/:path*', // Protect all tenant routes
  ],
};

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    // Extract subdomain from host header
    const host = req.headers.get('host');
    const subdomain = extractSubdomain(host);
    
    // If subdomain exists, validate tenant exists in database
    if (subdomain) {
      // The Next.js rewrite will handle routing to /:subdomain/:path
      // We just need to validate the tenant exists
      // This will be handled by the page components
    }
    
    // Check trial status for tenant routes via API (avoid DB/Node logic in middleware)
    if (req.nextUrl.pathname.match(/^\/[^\/]+\/(dashboard|pos|products|customers|settings|billing)/)) {
      try {
        const apiUrl = new URL('/api/subscription/status', req.url);
        const res = await fetch(apiUrl.toString(), {
          headers: {
            // Forward cookies so API can read the session token
            cookie: req.headers.get('cookie') || '',
          },
          // Avoid caching user-specific data
          cache: 'no-store',
        });

        if (res.ok) {
          const subscriptionStatus = await res.json();
          if (subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'suspended') {
            const tenant = req.nextUrl.pathname.split('/')[1];
            return NextResponse.redirect(new URL(`/${tenant}/trial-expired`, req.url));
          }
        }
      } catch (error) {
        console.error('Error checking trial status via API in middleware:', error);
        // Continue on error to not block access
      }
    }
    
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Base auth routes (/login, /signup) must NEVER be redirected to admin login
        if (path === '/login' || path === '/signup') {
          return true;
        }

        // Protect /admin routes - require isSuperAdmin
        if (path.startsWith('/admin')) {
          return token?.isSuperAdmin === true;
        }

        // Protect /api/admin routes - require isSuperAdmin
        if (path.startsWith('/api/admin')) {
          return token?.isSuperAdmin === true;
        }

        // Allow all other API routes (e.g. /api/tenants/by-subdomain, /api/subscription/status)
        // so they are never redirected to admin login.
        if (path.startsWith('/api/')) {
          return true;
        }

        // Protect cron endpoint - always allow (will be protected by secret header in route)
        if (path.startsWith('/api/cron')) {
          return true;
        }

        // Allow tenant login page without auth (e.g. /gshop/login)
        if (path.match(/^\/[^\/]+\/login$/)) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);
