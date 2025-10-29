# Migration from Firebase to PostgreSQL

This document outlines the migration from Firebase (Firestore + Auth) to PostgreSQL with Drizzle ORM and NextAuth.

## Changes Summary

### 1. Database
- **Before**: Firebase Firestore (NoSQL)
- **After**: PostgreSQL with Drizzle ORM (SQL)

### 2. Authentication
- **Before**: Firebase Authentication
- **After**: NextAuth.js with credentials provider

### 3. Dependencies Added
- `pg` - PostgreSQL client
- `drizzle-orm` - Type-safe ORM
- `drizzle-kit` - Database migrations tool
- `next-auth` - Authentication for Next.js
- `@auth/drizzle-adapter` - Drizzle adapter for NextAuth
- `bcryptjs` - Password hashing

### 4. Dependencies Removed
- `firebase` - No longer needed

## Setup Instructions

### 1. Install PostgreSQL
Make sure you have PostgreSQL installed and running on your machine or use a cloud provider like:
- [Neon](https://neon.tech/)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

### 2. Configure Environment Variables
Create a `.env.local` file with the following:

```env
# PostgreSQL Database
DATABASE_URL=postgresql://username:password@localhost:5432/goodsale

# NextAuth
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Google AI (Genkit) Configuration
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Create Database Schema
Run the following commands to create your database schema:

```bash
# Generate migration files
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Seed Initial Data (Optional)
You'll need to create initial tenants and users. You can create a seed script or manually insert data.

Example seed script (create `src/scripts/seed.ts`):
```typescript
import { db, tenants, users } from '@/db';
import { hash } from 'bcryptjs';

async function seed() {
  // Create a tenant
  const [tenant] = await db.insert(tenants).values({
    name: 'Demo Shop',
    subdomain: 'demo',
    plan: 'premium',
  }).returning();

  // Create an admin user
  const hashedPassword = await hash('password123', 10);
  await db.insert(users).values({
    tenantId: tenant.id,
    name: 'Admin User',
    email: 'admin@demo.com',
    password: hashedPassword,
    role: 'Owner',
  });

  console.log('Seed completed!');
}

seed();
```

### 5. Update Application Code

#### Authentication
Replace Firebase Auth with NextAuth:

**Before (Firebase):**
```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
const auth = getAuth();
await signInWithEmailAndPassword(auth, email, password);
```

**After (NextAuth):**
```typescript
import { signIn } from 'next-auth/react';
await signIn('credentials', { email, password });
```

#### Data Fetching
Replace Firestore hooks with API routes + custom hooks:

**Before (Firestore):**
```typescript
import { useCollection } from '@/firebase/firestore/use-collection';
const { data } = useCollection(collection(firestore, 'products'));
```

**After (API Routes):**
```typescript
import { useQueryList } from '@/hooks/use-query';
const { data } = useQueryList('/api/products');
```

### 6. Create API Routes
You'll need to create API routes for data access. Example:

**`src/app/api/products/route.ts`:**
```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, products } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantProducts = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, session.user.tenantId));

  return NextResponse.json(tenantProducts);
}
```

## Migration Checklist

- [x] Install PostgreSQL dependencies
- [x] Create database schema with Drizzle
- [x] Set up database connection
- [x] Configure NextAuth for authentication
- [x] Create data access hooks
- [x] Update environment variables
- [ ] Remove Firebase directory and imports
- [ ] Create API routes for data operations
- [ ] Update all components to use new data layer
- [ ] Create database seed script
- [ ] Test authentication flow
- [ ] Test data operations (CRUD)
- [ ] Update deployment configuration
- [ ] Remove Firebase from package.json

## Database Schema

The PostgreSQL schema includes the following tables:
- `tenants` - Multi-tenant support
- `users` - User accounts with authentication
- `products` - Product inventory
- `categories` - Product categories
- `suppliers` - Supplier information
- `customers` - Customer data
- `sales` - Sales transactions
- `sale_items` - Individual items in sales
- `purchase_orders` - Purchase order management
- `settings` - Tenant-specific settings
- `shifts` - Cash register shift management

## Key Differences

### Data Structure
- **Firebase**: Nested documents and collections
- **PostgreSQL**: Relational tables with foreign keys

### Queries
- **Firebase**: Real-time listeners with `onSnapshot`
- **PostgreSQL**: REST API calls with polling or WebSocket for real-time

### Authentication
- **Firebase**: Built-in authentication providers
- **NextAuth**: Flexible authentication with custom providers

### Offline Support
- **Firebase**: Built-in offline persistence
- **PostgreSQL**: You'll need to implement offline support separately (Dexie.js is already in use for this)

## Drizzle Studio
View and edit your database with Drizzle Studio:
```bash
npm run db:studio
```

This will open a web interface at `https://local.drizzle.studio`

## Additional Resources
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
