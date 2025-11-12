# Clean Subdomain URLs

This document explains how the clean subdomain URL routing works in the application.

## URL Structure

### Before
- Subdomain: `http://gshop.localhost:9002/gshop/dashboard` ❌
- Path-based: `http://localhost:9002/gshop/dashboard` ✅

### After
- Subdomain: `http://gshop.localhost:9002/dashboard` ✅
- Path-based: `http://localhost:9002/gshop/dashboard` ✅

## How It Works

### 1. Next.js Rewrites (`next.config.js`)
```javascript
// When accessing gshop.localhost:9002/dashboard
// Internally rewrites to /gshop/dashboard (matches [tenant] route)
{
  source: '/:path*',
  has: [{ type: 'host', value: '(?<subdomain>.*)\\.localhost' }],
  destination: '/:subdomain/:path*',
}
```

### 2. Automatic Subdomain Detection
The app automatically detects if you're on a subdomain by checking:
- `*.localhost` (development)
- `*.goodsale.online` (production)

### 3. Smart Redirects
All redirects and navigation automatically use clean URLs when on a subdomain:

**Login redirect:**
```typescript
// On subdomain: redirects to /dashboard
// Path-based: redirects to /gshop/dashboard
if (isSubdomain) {
  router.push('/dashboard');
} else {
  router.push(`/${tenant}/dashboard`);
}
```

## For Developers

### Using the Hook in Components
```typescript
import { useTenantNavigation } from '@/hooks/use-tenant-navigation';

function MyComponent() {
  const { buildPath, isSubdomain, tenant } = useTenantNavigation();
  
  // Automatically generates correct path
  const dashboardPath = buildPath('/dashboard');
  // On subdomain: '/dashboard'
  // Path-based: '/gshop/dashboard'
  
  return <Link href={dashboardPath}>Dashboard</Link>;
}
```

### Using Server-Side Utilities
```typescript
import { getTenantPath } from '@/lib/subdomain';

// In server components or API routes
const path = getTenantPath('gshop', '/dashboard', host);
// Returns: '/dashboard' on subdomain, '/gshop/dashboard' otherwise
```

### Manual Check
```typescript
const isSubdomain = window.location.host.includes('.localhost') || 
                    window.location.host.includes('.goodsale.online');

if (isSubdomain) {
  // Use clean URLs: /dashboard
} else {
  // Use full paths: /gshop/dashboard
}
```

## Testing

### Development
```bash
# Start server
pnpm dev

# Test subdomain (clean URLs)
http://gshop.localhost:9002
http://gshop.localhost:9002/dashboard
http://gshop.localhost:9002/pos

# Test path-based (full paths)
http://localhost:9002/gshop
http://localhost:9002/gshop/dashboard
http://localhost:9002/gshop/pos
```

### Production
```bash
# Subdomain access (clean URLs)
https://gshop.goodsale.online
https://gshop.goodsale.online/dashboard

# Main domain can redirect to subdomain
https://goodsale.online/login
# After login, redirects to: https://gshop.goodsale.online/dashboard
```

## Updated Files

1. **next.config.js** - Added localhost rewrite rule
2. **src/lib/subdomain.ts** - Added `buildTenantUrl()` and `getTenantPath()` helpers
3. **src/hooks/use-tenant-navigation.ts** - Created client-side navigation hook
4. **src/app/page.tsx** - Updated root redirect to use clean URLs
5. **src/app/(goodsale)/[tenant]/page.tsx** - Smart redirect based on subdomain
6. **src/app/(goodsale)/[tenant]/(auth)/login/page.tsx** - Clean URL redirect after login
7. **src/app/(auth)/login/page.tsx** - Redirects to tenant subdomain in production

## Benefits

✅ **Cleaner URLs**: `gshop.localhost:9002/dashboard` instead of `gshop.localhost:9002/gshop/dashboard`
✅ **Professional appearance**: Looks like a separate app per tenant
✅ **Better UX**: Shorter, more intuitive URLs
✅ **Backward compatible**: Path-based routing still works (`/gshop/dashboard`)
✅ **SEO friendly**: Each subdomain appears as distinct site
✅ **Easy to share**: Cleaner URLs are easier to communicate

## Migration Notes

- Existing path-based URLs continue to work
- No database changes required
- All internal routing uses the same `[tenant]` dynamic route
- Subdomain detection happens automatically
- No manual configuration needed per tenant
