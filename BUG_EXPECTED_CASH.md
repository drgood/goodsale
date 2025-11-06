# BUG: Expected Cash in Drawer Calculation is Wrong

## Problem

**Expected Cash is being calculated using TOTAL SALES instead of CASH SALES only.**

### Evidence from Your Screenshot:
```
Starting Cash:              +GH₵160.00
Cash Sales Today:           +GH₵1868.39
Settlement Collections:     +GH₵0.00
Cash Returned:              -GH₵0.00
─────────────────────────────────────
Expected Cash in Drawer:    GH₵160.00
```

**The math is WRONG:**
- Formula should be: 160 + 1868.39 + 0 - 0 = **GH₵2028.39**
- But it shows: **GH₵160.00**

This means `expectedCash` in the database is NOT being updated correctly when sales are recorded.

---

## Root Cause Analysis

### Where Expected Cash is Calculated

**File**: `src/components/shift-manager.tsx` lines 76-80

```typescript
const addSale = async (sale: Sale) => {
    // ... sale added to appropriate field (cashSales, cardSales, etc)
    
    // Update expectedCash with full formula: starting + sales + settlements - returns
    updatedShift.expectedCash = updatedShift.startingCash + 
                               updatedShift.cashSales +              // ← ONLY cashSales
                               updatedShift.cashSettlements - 
                               updatedShift.cashReturns;
    
    // Then send to API to update DB
    await fetch('/api/shifts', {
        method: 'PUT',
        body: JSON.stringify({
            expectedCash: updatedShift.expectedCash,
            // ...
        })
    });
}
```

**This code looks CORRECT** - it's using only `cashSales`.

BUT something else is updating expectedCash incorrectly...

---

## Hypothesis: Sales API Endpoint

When a sale is created via `/api/sales`, maybe **that endpoint** is:
1. Adding to `totalSales` ✓ (correct)
2. Adding to whichever sales type (cashSales/cardSales/credit Sales) ✓ (correct)
3. But ALSO incorrectly updating `expectedCash` to include all sales? ✗ (WRONG)

---

## Investigation Needed

### Check These Files:

1. **`/api/sales/route.ts`** - When a sale is created, what happens to expectedCash?
   - Does it update expectedCash?
   - If yes, is it using totalSales or cashSales?

2. **`/api/shifts/route.ts` PUT method** - Line 100
   - When expectedCash is passed in, does it just accept it?
   - Or does it recalculate?

3. **POS Page Sale Creation** - Where is `addSale` being called?
   - Does it call shift-manager's `addSale()`?
   - Or does it hit `/api/sales` directly?

---

## What Your Data Shows

### Current State (From Screenshot):
- `startingCash`: 160.00
- `cashSales`: 1868.39
- `creditSales`: ??? (unknown, not shown)
- `totalSales`: 1868.39 (shown in quick ref card)
- `expectedCash`: 160.00 (WRONG)

### What expectedCash Should Be:
```
= 160.00 + 1868.39 + 0 - 0
= 2028.39
```

### What It Actually Is:
```
160.00
```

### Possible Explanations:

1. **expectedCash is never being updated** when sales are added
   - Most likely cause
   - addSale() might not be called
   - API might not trigger calculation

2. **expectedCash is being recalculated using wrong formula**
   - Being set to just startingCash
   - All sales (including credit) are added elsewhere, not here

3. **expectedCash in DB is stale from before sales**
   - Still holding initial value
   - Never recalculated

---

## Immediate Tests

### Test 1: Create a Fresh Shift
1. Start a new shift with GH₵100 float
2. Record a GH₵50 CASH sale
3. Check Expected Cash in Drawer
4. Should be: 100 + 50 = **GH₵150**
5. Actually shows: **???**

### Test 2: Create Credit Sale
1. Record a GH₵50 credit sale
2. Check Expected Cash
3. Should be: **unchanged** (no cash involved)
4. Actually shows: **???**

### Test 3: Create Card Sale
1. Record a GH₵50 card sale
2. Check Expected Cash  
3. Should be: **unchanged** (goes to processor, not drawer)
4. Actually shows: **???**

---

## Possible Fix Locations

### Option A: Fix shift-manager.tsx
Ensure `addSale()` is being called for every sale.

### Option B: Fix /api/sales endpoint
Ensure when a sale is created, expectedCash is NOT modified there.

### Option C: Fix /api/shifts PUT
Ensure expectedCash can only be updated via specific routes that recalculate correctly.

### Option D: Recalculate on Display
In `shift-summary.tsx`, recalculate expectedCash instead of trusting DB value:
```typescript
const calculatedExpectedCash = safeStartingCash + safeCashSales + safeCashSettlements - safeCashReturns;
// Compare with stored expectedCash to detect if DB is wrong
```

---

## Impact

- **Cash Reconciliation**: Completely wrong, can't close shift properly
- **Expected vs Actual**: Variance will always be wrong
- **Shift Reports**: Unreliable data
- **Trust**: Users can't trust the system's math

---

## Next Steps

1. Find where `/api/sales` creates sales
2. Check if it's calling shift-manager's `addSale()` or updating DB directly
3. Check if the API endpoint is modifying expectedCash
4. Trace POS page code to see sale creation flow
5. Add logging to see when expectedCash changes
6. Implement fix based on findings

---

## Code to Search

```bash
# Find all places expectedCash is written to
grep -r "expectedCash.*=" src/

# Find where sales API updates shifts
grep -r "/api/sales" src/

# Find where shift-manager's addSale is called
grep -r "addSale" src/
```
