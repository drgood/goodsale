# PostgreSQL Migration Notes

## Completed Steps

### 1. ✅ TypeScript Types - Completed
- Types in `src/lib/types.ts` already match PostgreSQL schema
- Using UUID for IDs, proper nullable fields

### 2. ✅ Database Query Layer - Completed  
- `src/lib/queries.ts` contains all query functions using Drizzle ORM
- Functions for: products, sales, customers, categories, suppliers, users, shifts, purchase orders

### 3. ✅ Database Seed Script - Completed
- `src/scripts/seed.ts` has UUID-based seed data
- Ready to populate PostgreSQL database

### 4. ✅ API Routes Created
- `/api/products` - GET, POST
- `/api/products/[id]` - PATCH, DELETE  
- `/api/sales` - GET, POST
- `/api/categories` - GET, POST
- `/api/suppliers` - GET, POST
- `/api/customers` - GET, POST

### 5. ✅ Products Page Updated
- `src/app/(goodsale)/[tenant]/products/page.tsx` - Now uses API calls instead of mock data
- All CRUD operations connected to database
- Fixed to use `categoryName`/`supplierName` properties

### 6. ✅ Sales Page Updated
- `src/app/(goodsale)/[tenant]/sales/page.tsx` - Now uses API calls instead of mock data

### 7. ✅ Type Fixes (Partial)
- Fixed `avatar` → `avatarUrl` across all files
- Updated NextAuth types to use `avatarUrl`
- Fixed `src/lib/auth.ts` to use `avatarUrl`
- Fixed `src/components/product-form.tsx` to use `categoryName`/`supplierName`

## Remaining Work

### 7. Update Remaining Pages (IN PROGRESS)
Pages that still need migration:
- [ ] Dashboard (`src/app/(goodsale)/[tenant]/dashboard/page.tsx`)
- [ ] Customers (`src/app/(goodsale)/[tenant]/customers/page.tsx`)
- [ ] Suppliers (`src/app/(goodsale)/[tenant]/suppliers/page.tsx`)
- [ ] Categories (`src/app/(goodsale)/[tenant]/categories/page.tsx`)
- [ ] POS (`src/app/(goodsale)/[tenant]/pos/page.tsx`)
- [ ] Reports (multiple pages in `src/app/(goodsale)/[tenant]/reports/`)
- [ ] Purchase Orders (`src/app/(goodsale)/[tenant]/purchase-orders/page.tsx`)
- [ ] Team (`src/app/(goodsale)/[tenant]/team/page.tsx`)
- [ ] Settings (`src/app/(goodsale)/[tenant]/settings/page.tsx`)

### 8. Firebase Dependencies

#### Current Status:
- `src/firebase/` directory exists with Firebase configuration
- Firebase package installed in package.json
- **No .tsx files are currently importing from firebase** ✅

#### Recommendations:
1. **Keep for now**: The Firebase setup might be used for:
   - Authentication (if using Firebase Auth instead of NextAuth)
   - Future features (push notifications, cloud functions)
   - Analytics

2. **Remove if**: You're using NextAuth for authentication and don't plan to use Firebase features

3. **Dexie (src/lib/db.ts)**: 
   - This is for **offline caching with IndexedDB** - NOT Firestore
   - Should be **kept** as it provides offline functionality for the PWA
   - Separate from Firebase/Firestore migration

#### To Remove Firebase (Optional):
```bash
# Remove firebase package
npm uninstall firebase

# Delete firebase directory
rm -rf src/firebase
```

### 9. Testing
- [ ] Run `npm run lint` 
- [ ] Run `npm run typecheck`
- [ ] Test all pages end-to-end
- [ ] Test offline functionality (Dexie caching)
- [ ] Test product CRUD operations
- [ ] Test sales CRUD operations

## Database Setup Commands

```bash
# Push schema to database
npm run db:push

# Seed the database (run this after db:push)
npx tsx src/scripts/seed.ts

# Open Drizzle Studio to view data
npm run db:studio
```

## Notes

- The migration uses Drizzle ORM with PostgreSQL
- UUIDs are used for all IDs (not Firestore document IDs)
- Numeric fields are stored as strings in PostgreSQL (e.g., price, costPrice)
- Need to parse them to float on the client side
- Product form still uses category/supplier names - conversion happens in API layer
