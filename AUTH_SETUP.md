# Authentication Setup - NextAuth with PostgreSQL

## ✅ What's Configured

Your app now uses **NextAuth** with **PostgreSQL** for authentication (not mock data anymore).

### Components Updated:

1. **NextAuth API Route** - `src/app/api/auth/[...nextauth]/route.ts`
   - Authenticates against PostgreSQL database
   - Uses bcrypt password hashing
   - Stores user data in JWT tokens
   - Multi-tenant support via `tenantId`

2. **Login Page** - `src/app/(auth)/login/page.tsx`
   - Now uses `signIn()` from NextAuth
   - Real authentication against database
   - Proper error handling

3. **Session Provider** - `src/app/providers.tsx`
   - Wraps app with `SessionProvider`
   - Makes session available throughout app

4. **Auth Configuration** - `src/lib/auth.ts`
   - Centralized NextAuth configuration
   - Used by API routes that need authentication

## 🔐 How It Works

### Login Flow:
```
1. User enters email/password
2. Login page calls signIn('credentials', { email, password })
3. NextAuth validates credentials against PostgreSQL
4. Password checked using bcrypt.compare()
5. JWT token created with user data (id, email, tenantId, role, avatarUrl)
6. Session stored in cookie
7. User redirected to dashboard
```

### Protected Routes:
All API routes check authentication using:
```typescript
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// Use session.user.tenantId to filter data
```

## 📝 Test Login Credentials

From your seed script (`src/scripts/seed.ts`):

### GShop Electronics (tenant: gshop)
- **Owner**: `owner@gshop.com` / `password123`
- **Manager**: `manager@gshop.com` / `password123`
- **Cashier**: `cashier1@gshop.com` / `password123`

### Globex Fashion (tenant: globex)
- **Owner**: `owner@globex.com` / `password123`

## 🔧 Environment Variables Required

Make sure your `.env` file has:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-secret-key-here
```

Generate a secret with:
```bash
openssl rand -base64 32
```

## 🚀 Testing Authentication

```bash
# 1. Make sure database is seeded
pnpm db:push
npx tsx src/scripts/seed.ts

# 2. Start dev server
pnpm dev

# 3. Navigate to login
# http://localhost:9002/login

# 4. Use test credentials
# Email: owner@gshop.com
# Password: password123

# 5. Should redirect to dashboard
# http://localhost:9002/gshop/dashboard
```

## 🔒 Session Data Available

In your components, you can access:
```typescript
import { useSession } from 'next-auth/react';

const { data: session } = useSession();

session?.user.id        // User UUID
session?.user.email     // User email
session?.user.name      // User name
session?.user.role      // Owner | Manager | Cashier
session?.user.tenantId  // Tenant UUID
session?.user.avatarUrl // Avatar URL or null
```

In API routes:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
const tenantId = session.user.tenantId;
```

## ⚠️ Important Notes

1. **Multi-tenancy**: Every user belongs to a tenant. The `tenantId` is used to filter all data.

2. **Password Hashing**: Passwords are hashed with bcryptjs during signup/seed. Never store plain passwords.

3. **JWT Strategy**: Using JWT (not database sessions) for better performance with PostgreSQL.

4. **Tenant Routing**: Currently hardcoded to `/gshop/dashboard`. You may want to:
   - Fetch tenant subdomain from session after login
   - Redirect to correct tenant path dynamically

## 🎯 Next Steps (Optional)

1. **Dynamic Tenant Redirect**
   Update login page to fetch user's tenant and redirect correctly:
   ```typescript
   // After successful login, fetch tenant info
   const res = await fetch('/api/tenant/current');
   const { subdomain } = await res.json();
   router.push(`/${subdomain}/dashboard`);
   ```

2. **Signup Page**
   Update signup to create real users in PostgreSQL

3. **Forgot Password**
   Implement password reset flow

4. **OAuth Providers**
   Add Google/GitHub OAuth if needed:
   ```typescript
   import GoogleProvider from 'next-auth/providers/google';
   ```

5. **Session Refresh**
   Configure session refresh interval if needed

## 🐛 Troubleshooting

**Error: "User not found"**
- Check if database is seeded
- Verify email matches seeded user

**Error: "Invalid password"**
- Passwords in seed script are: `password123`
- Check bcrypt hash in database

**Session not persisting**
- Ensure NEXTAUTH_SECRET is set
- Check cookie settings in browser

**Redirect loop**
- Verify NEXTAUTH_URL matches your app URL
- Check middleware configuration
