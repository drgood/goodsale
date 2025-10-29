# Preventing "Module not found: Can't resolve 'dns'" Errors

## ✅ Already Configured!

Your app is **properly configured** to prevent `pg` (PostgreSQL) library from being bundled on the client-side.

## What's In Place:

### 1. Next.js Configuration (`next.config.ts`)

```typescript
serverExternalPackages: ['pg', 'drizzle-orm'],
webpack: (config, { isServer }) => {
  if (!isServer) {
    // Prevent client-side bundling of Node.js modules
    config.resolve.fallback = {
      dns: false,       // PostgreSQL driver needs this
      fs: false,        // File system
      net: false,       // Network
      tls: false,       // SSL/TLS
      crypto: false,    // Cryptography
      stream: false,    // Streams
      path: false,      // Path operations
      os: false,        // OS utilities
    };
  }
  return config;
}
```

**What this does:**
- `serverExternalPackages`: Tells Next.js to NOT bundle `pg` and `drizzle-orm` - keep them external
- `webpack.resolve.fallback`: For any client code, replace Node.js modules with `false` (don't include them)

### 2. Code Architecture

Your code is properly structured with **clear separation**:

**✅ Server-Side Only (Can import from `@/db`):**
- `src/app/api/**` - All API routes
- `src/lib/auth.ts` - Authentication logic
- `src/lib/queries.ts` - Database queries
- `src/scripts/seed.ts` - Database seeding

**✅ Client-Side (NEVER imports from `@/db`):**
- `src/app/**/page.tsx` - All page components
- `src/components/**` - UI components
- `src/hooks/**` - React hooks

**Client pages use API routes:**
```typescript
// ✅ CORRECT - Client component fetching from API
'use client';
const response = await fetch('/api/products');

// ❌ WRONG - Would cause dns error
'use client';
import { db } from '@/db'; // DON'T DO THIS!
```

## Why This Matters:

The `pg` library includes Node.js-specific modules:
- `dns` - Domain name resolution
- `net` - TCP/UDP networking
- `tls` - SSL/TLS encryption
- `fs` - File system access

These **don't exist in browsers** and can't be polyfilled. They must ONLY run on the server.

## Verification Checklist:

✅ **next.config.ts has serverExternalPackages**
✅ **webpack fallbacks configured**
✅ **No client components import from @/db**
✅ **All database code is in API routes or server utilities**

## How to Verify It Works:

```bash
# 1. Build the app
pnpm build

# If you see errors about 'dns', 'net', 'tls', etc., something is wrong
# If build succeeds, configuration is correct ✅

# 2. Check bundle analyzer (optional)
# Install: pnpm add -D @next/bundle-analyzer
# Verify pg is not in client bundle
```

## Common Mistakes to Avoid:

### ❌ Don't Do This:
```typescript
// pages/products.tsx
'use client';
import { getProductsByTenant } from '@/lib/queries'; // ❌ BAD

export default function ProductsPage() {
  const products = await getProductsByTenant('tenant-id'); // ❌ Can't use on client
}
```

### ✅ Do This Instead:
```typescript
// pages/products.tsx
'use client';

export default function ProductsPage() {
  useEffect(() => {
    fetch('/api/products') // ✅ GOOD - Use API route
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);
}
```

## What If I Get the Error?

If you somehow still see `Module not found: Can't resolve 'dns'`:

1. **Check for direct imports:**
   ```bash
   # Search for any @/db imports in client files
   Get-ChildItem -Recurse -Filter "*.tsx" | Select-String "from.*@/db"
   ```

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   pnpm dev
   ```

3. **Verify serverExternalPackages:**
   Make sure `next.config.ts` includes:
   ```typescript
   serverExternalPackages: ['pg', 'drizzle-orm']
   ```

4. **Check webpack config:**
   Ensure fallbacks are set for `!isServer`

## Additional Safety: Runtime Checks

You can add a build-time check to catch mistakes:

```typescript
// lib/db.ts
if (typeof window !== 'undefined') {
  throw new Error(
    'Database imports are server-only! ' +
    'Use API routes to access data from client components.'
  );
}

export { db } from '@/db';
```

## Summary:

✅ Your configuration is **correct and production-ready**
✅ No DNS errors will occur
✅ Database code stays on the server
✅ Client uses API routes for data

Keep this architecture and you'll never see the dreaded "Can't resolve 'dns'" error! 🎉
