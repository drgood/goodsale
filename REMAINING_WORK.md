# Remaining Work for PostgreSQL Migration

## Current Status: ~75% Complete ✅

### What's Done:
1. ✅ Database schema and query layer
2. ✅ Seed script ready
3. ✅ API routes created (products, sales, categories, suppliers, customers)
4. ✅ Products page fully migrated
5. ✅ Sales page fully migrated
6. ✅ Fixed most `avatar` → `avatarUrl` type issues

### Remaining TypeScript Errors: 24 errors

Run `pnpm typecheck` to see all errors. Main categories:

#### 1. Image `src` Null Handling (13 errors)
**Files affected:**
- `src/app/(admin)/admin/tenants/[tenantId]/page.tsx:70`
- `src/app/(goodsale)/[tenant]/customers/page.tsx:263, 370`
- `src/app/(goodsale)/[tenant]/dashboard/page.tsx:179, 270, 298`
- `src/app/(goodsale)/[tenant]/pos/page.tsx:417, 468, 531`
- `src/app/(goodsale)/[tenant]/reports/customers/page.tsx:106`
- `src/app/(goodsale)/[tenant]/reports/debtors/page.tsx:89`
- `src/app/(goodsale)/[tenant]/reports/inventory/page.tsx:104`
- `src/app/(goodsale)/[tenant]/reports/products/page.tsx:100`
- `src/app/(goodsale)/[tenant]/team/page.tsx:215`

**Fix:** Add null coalescence
```tsx
// Before
<Image src={product.imageUrl} />

// After
<Image src={product.imageUrl || '/placeholder.png'} />
```

#### 2. Input `defaultValue` Null Handling (2 errors)
**Files:**
- `src/app/(goodsale)/[tenant]/customers/page.tsx:321, 325`

**Fix:**
```tsx
// Before
<Input defaultValue={customer.email} />

// After  
<Input defaultValue={customer.email || ''} />
```

#### 3. `avatarUrl` Type Mismatch (3 errors)
**Files:**
- `src/app/api/auth/[...nextauth]/route.ts:16`
- `src/components/header.tsx:79`
- `src/components/tenant-sidebar.tsx:149`

**Issue:** Database returns `string | null`, NextAuth expects `string | undefined`

**Fix Option 1:** Convert null to undefined in auth
```ts
avatarUrl: user.avatarUrl || undefined
```

**Fix Option 2:** Update NextAuth types to accept null
```ts
// src/types/next-auth.d.ts
avatarUrl?: string | null;
```

#### 4. Missing `tenantId` (2 errors)
**Files:**
- `src/app/(goodsale)/[tenant]/categories/page.tsx:56`
- `src/app/(goodsale)/[tenant]/suppliers/page.tsx:56`

**Fix:** Add tenantId when creating mock/local data
```ts
const newCategory = { id: 'c1', name: 'Electronics', tenantId: tenant.id, productCount: 0 }
```

#### 5. Product Field Names (4 errors)
**Files:**
- `src/app/(goodsale)/[tenant]/purchase-orders/page.tsx:56, 240`
- `src/app/(goodsale)/[tenant]/reports/inventory/page.tsx:109`

**Fix:** Use `categoryId`/`supplierId` instead of `category`/`supplier`
```ts
// Before
product.category

// After
product.categoryName || product.categoryId
```

## Pages Still Using Mock Data

These pages need to be migrated to use API calls (similar to products/sales pages):

### High Priority:
- [x] **Dashboard** - `src/app/(goodsale)/[tenant]/dashboard/page.tsx` ✅
- [ ] **POS** - `src/app/(goodsale)/[tenant]/pos/page.tsx`
- [ ] **Customers** - `src/app/(goodsale)/[tenant]/customers/page.tsx`

### Medium Priority:
- [ ] **Categories** - `src/app/(goodsale)/[tenant]/categories/page.tsx`
- [ ] **Suppliers** - `src/app/(goodsale)/[tenant]/suppliers/page.tsx`
- [ ] **Team** - `src/app/(goodsale)/[tenant]/team/page.tsx`
- [ ] **Purchase Orders** - `src/app/(goodsale)/[tenant]/purchase-orders/page.tsx`

### Reports:
- [ ] `src/app/(goodsale)/[tenant]/reports/sales/page.tsx`
- [ ] `src/app/(goodsale)/[tenant]/reports/products/page.tsx`
- [ ] `src/app/(goodsale)/[tenant]/reports/inventory/page.tsx`
- [ ] `src/app/(goodsale)/[tenant]/reports/customers/page.tsx`
- [ ] `src/app/(goodsale)/[tenant]/reports/debtors/page.tsx`
- [ ] `src/app/(goodsale)/[tenant]/reports/shifts/page.tsx`

### Admin Pages:
- [ ] `src/app/(admin)/admin/tenants/[tenantId]/page.tsx`

## Quick Fix Script

To fix most Image/Input null issues quickly, run:

```powershell
# Fix Image src null issues
Get-ChildItem -Path "C:\Users\sungs\Work Station\Web\GoodSale\src\app" -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content -LiteralPath $_.FullName -Raw
    if ($content -match 'src=\{[^}]*\.imageUrl\}' -or $content -match 'src=\{[^}]*\.avatarUrl\}') {
        $updated = $content -replace 'src=\{([^}]*\.(imageUrl|avatarUrl))\}', 'src={$1 || ''/placeholder.png''}'
        $updated | Set-Content -LiteralPath $_.FullName -NoNewline
        Write-Host "Fixed: $($_.Name)"
    }
}

# Fix Input defaultValue null issues  
Get-ChildItem -Path "C:\Users\sungs\Work Station\Web\GoodSale\src\app" -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content -LiteralPath $_.FullName -Raw
    if ($content -match 'defaultValue=\{[^}]*\.(email|phone)\}') {
        $updated = $content -replace 'defaultValue=\{([^}]*\.(email|phone))\}', 'defaultValue={$1 || ''''}'
        $updated | Set-Content -LiteralPath $_.FullName -NoNewline
        Write-Host "Fixed: $($_.Name)"
    }
}
```

## Testing Checklist

After fixing type errors:

```bash
# 1. Type check passes
pnpm typecheck

# 2. Lint passes
pnpm lint

# 3. Start dev server
pnpm dev

# 4. Test migrated features:
- [ ] Login works
- [ ] Products page: add, edit, delete products
- [ ] Sales page: view sales history
- [ ] Categories/Suppliers load from API
- [ ] Images display correctly with fallbacks

# 5. Database connection works:
- [ ] Check logs for database queries
- [ ] Verify data persists after refresh
```

## Next Steps

1. **Fix remaining TypeScript errors** (24 errors - ~1-2 hours)
   - Run the PowerShell scripts above for quick fixes
   - Manually fix remaining issues

2. **Migrate remaining pages** (High priority first)
   - Follow same pattern as products/sales pages
   - Fetch from API on mount with `useEffect`
   - Add loading states

3. **Test thoroughly**
   - Manual testing of all migrated features
   - Check database persistence
   - Verify offline functionality (Dexie) still works

4. **Optional: Remove Firebase**
   - Only if you're not using Firebase Auth or other Firebase services
   - Keep Dexie for offline caching (it's separate!)

## Need Help?

The migration pattern for pages is:
1. Create/verify API route exists
2. Replace mock data imports with state
3. Add `useEffect` to fetch from API
4. Add loading state
5. Update CRUD operations to call API

See `src/app/(goodsale)/[tenant]/products/page.tsx` as reference!
