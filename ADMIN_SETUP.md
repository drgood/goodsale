# Super Admin Setup Guide

This guide walks you through setting up the super admin authentication system for the GoodSale platform.

## Overview

The super admin panel is a separate, database-backed authentication system that allows super admins to manage all tenants on the platform. Super admins are distinct from regular tenant users and have access to:

- Tenant management (create, view, suspend, delete)
- Platform-wide dashboard and analytics
- Plan management
- Settings and profile management

## Database Migration

First, you need to run the database migration to create the `super_admins` table:

```bash
npm run db:push
```

This will apply all pending migrations to your PostgreSQL database, including the new `super_admins` table.

## Creating a Super Admin Account

Once the database is set up, create your first super admin account:

```bash
npm run db:seed:admin
```

This script will prompt you to enter:
- Super admin name
- Email address
- Password

Example:
```
Creating Super Admin...

Enter super admin name: John Admin
Enter super admin email: admin@goodsale.com
Enter super admin password: ••••••••

✓ Super admin created successfully!
  Name: John Admin
  Email: admin@goodsale.com

You can now login at: /admin/login
```

## Login Flow

1. Navigate to `/admin/login`
2. Enter your email and password
3. On successful authentication, you'll be redirected to `/admin/dashboard`
4. The session is stored as JWT and includes the `isSuperAdmin` flag

## Routes

### Protected Routes
- `/admin/dashboard` - Main dashboard with platform overview
- `/admin/tenants` - Tenant management
- `/admin/plans` - Plan management
- `/admin/profile` - Super admin profile
- `/admin/settings` - Platform settings

### Public Routes
- `/admin/login` - Login page

## Middleware Protection

The `middleware.ts` file in the project root automatically:
- Redirects unauthenticated users to `/admin/login`
- Prevents non-super-admins from accessing admin routes
- Redirects authenticated super admins away from the login page

## Session Structure

When a super admin is logged in, the session contains:

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: 'super_admin';
    isSuperAdmin: true;
    tenantId?: undefined;  // Super admins don't have a tenant
  }
}
```

## Updating Admin Pages to Use Database

The admin pages currently use mock data from `@/lib/data`. To migrate to the database:

1. Update components to fetch from API endpoints
2. Create API routes for:
   - `GET /api/admin/tenants`
   - `POST /api/admin/tenants`
   - `PATCH /api/admin/tenants/:id`
   - `DELETE /api/admin/tenants/:id`

Example of updating a page:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status]);

  useEffect(() => {
    const fetchTenants = async () => {
      const response = await fetch('/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${session?.user.id}`,
        },
      });
      const data = await response.json();
      setTenants(data);
    };

    if (session?.user.isSuperAdmin) {
      fetchTenants();
    }
  }, [session]);

  // ... rest of component
}
```

## Security Notes

- Passwords are hashed using bcryptjs with 10 salt rounds
- Sessions use JWT strategy
- All super admin operations should be logged in the `audit_logs` table
- Consider implementing rate limiting on the login endpoint
- Always validate that `isSuperAdmin` flag is true before allowing admin operations

## Troubleshooting

### "Invalid email or password" on login
- Verify the email and password are correct
- Check that the super admin account exists: `SELECT * FROM super_admins WHERE email = 'your@email.com';`

### Stuck on login page after entering credentials
- Check browser console for errors
- Verify NextAuth is properly configured
- Check that the `NEXTAUTH_SECRET` environment variable is set

### Cannot access admin dashboard
- Verify middleware.ts is in the project root
- Check that you're authenticated with `isSuperAdmin: true`
- Clear browser cookies and login again
