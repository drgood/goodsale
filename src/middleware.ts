import { withAuth } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/cron/:path*',
  ],
};

export default withAuth(
  function middleware(req) {
    // Token is automatically checked by withAuth
    // If no token, user is redirected to login
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

        return !!token;
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);
