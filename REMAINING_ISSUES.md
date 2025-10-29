# Remaining Issues & Improvements

## 🔴 Critical Issues (Affect Data Persistence)

### 1. POS Page - Sales Not Saving to Database
**File**: `src/app/(goodsale)/[tenant]/pos/page.tsx`
**Line**: 249-269

**Issue**: When completing a sale, the POS calls `addSale(newSale)` which is a mock function from UserContext. Sales are NOT being saved to the PostgreSQL database.

**Impact**: 
- Sales made through POS are lost on page refresh
- No persistence to database
- Reports won't show POS sales

**Fix Needed**:
```typescript
// Replace mock addSale with API call
const response = await fetch('/api/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newSale)
});
```

### 2. POS Page - Customer Creation Not Persisting
**File**: `src/app/(goodsale)/[tenant]/pos/page.tsx`
**Line**: 368-388

**Issue**: Adding customers in POS creates them locally but doesn't save to database.

**Fix Needed**: Call `/api/customers` POST endpoint

### 3. POS Page - Product Stock Not Updating in Database
**File**: `src/app/(goodsale)/[tenant]/pos/page.tsx`
**Line**: 251-258

**Issue**: Stock is updated locally but not in PostgreSQL database.

**Fix Needed**: Either:
- Let the sales API handle stock updates automatically, OR
- Make separate PUT calls to `/api/products` to update stock

## 🟡 Medium Priority Issues

### 4. UserContext Still Uses Mock Data
**File**: `src/context/user-context.tsx`

**Issue**: Still imports and uses mock data (sales, customers, etc.) and localStorage

**Impact**: 
- Memory leaks (holds mock data in state)
- Confusing data flow
- POS relies on this for sales

**Fix**: Refactor UserContext to only manage session/auth state, not data

### 5. Case Sensitivity Issues Throughout
**Files**: Multiple API routes

**Issue**: Role checks comparing 'owner' vs 'Owner', payment methods 'cash' vs 'Cash'

**Fix**: Normalize all case comparisons with `.toLowerCase()`

**Status**: ✅ Fixed in purchase-orders API, ❌ Needs fixing in other APIs

### 6. Sales API - No Stock Update Logic
**File**: `src/app/api/sales/route.ts`

**Issue**: When creating a sale, product stock isn't decremented

**Fix Needed**: Add stock update logic similar to purchase orders:
```typescript
for (const item of sale.items) {
  await updateProductStock(item.productId, -item.quantity); // negative for decrease
}
```

## 🟢 Low Priority / Nice to Have

### 7. Remaining Report Pages
**Files**: `src/app/(goodsale)/[tenant]/reports/*`

**Status**: Only sales report migrated, others still use mock data

**Impact**: Low - reports are read-only

### 8. Purchase Orders - Add Product on the Fly
**File**: `src/app/(goodsale)/[tenant]/purchase-orders/page.tsx`
**Line**: 291-325

**Issue**: Creates products locally, doesn't call API

**Fix**: Call `/api/products` POST

### 9. Settings Page - No Database Backend
**File**: `src/app/(goodsale)/[tenant]/settings/page.tsx`

**Issue**: Settings aren't saved (tenant name, tax rate, etc.)

**Fix**: Create `/api/settings` endpoint and integrate

## 📋 Testing Checklist

Once critical issues are fixed:

- [ ] Create sale in POS → Verify appears in Sales page
- [ ] Create sale in POS → Verify appears in database
- [ ] Create sale in POS → Verify product stock decreased
- [ ] Create sale on credit → Verify customer balance increased
- [ ] Create purchase order → Receive it → Verify stock increased
- [ ] Add team member → Verify can login
- [ ] Update profile → Verify changes persist

## 🎯 Recommended Fix Order

1. **Fix POS sales API integration** (Critical)
2. **Add stock updates to sales API** (Critical)
3. **Fix POS customer creation** (Medium)
4. **Refactor UserContext** (Medium)
5. **Add case-insensitive checks to all APIs** (Medium)
6. **Migrate remaining pages** (Low priority)

---

**Next Steps**: 
1. Fix POS to save sales via API
2. Test end-to-end: POS → Sale creation → Database → Reports
3. Fix stock management workflow
