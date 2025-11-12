import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { getSubscriptionStatus } from '@/lib/trial-validation';
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
    
    // Check trial status for tenant routes
    if (req.nextUrl.pathname.match(/^\/[^\/]+\/(dashboard|pos|products|customers|settings|billing)/)) {
      const tenantId = req.nextauth.token?.tenantId as string | undefined;
      
      if (tenantId) {
        try {
          const subscriptionStatus = await getSubscriptionStatus(tenantId);
          
          // If trial has expired, redirect to trial-expired page
          if (subscriptionStatus.status === 'expired') {
            const tenant = req.nextUrl.pathname.split('/')[1];
            return NextResponse.redirect(new URL(`/${tenant}/trial-expired`, req.url));
          }
        } catch (error) {
          console.error('Error checking trial status in middleware:', error);
          // Continue on error to not block access
        }
      }
    }
    
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect /admin routes - require isSuperAdmin
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.isSuperAdmin === true;
        }

        // Protect /api/admin routes - require isSuperAdmin
        if (req.nextUrl.pathname.startsWith('/api/admin')) {
          return token?.isSuperAdmin === true;
        }

        // Protect cron endpoint - always allow (will be protected by secret header in route)
        if (req.nextUrl.pathname.startsWith('/api/cron')) {
          return true;
        }

        // Allow tenant login page without auth
        if (req.nextUrl.pathname.match(/^\/[^\/]+\/login$/)) {
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
