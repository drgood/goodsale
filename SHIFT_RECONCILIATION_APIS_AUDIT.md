# Shift Reconciliation - Complete APIs & Hooks Audit

**Status**: Multiple independent implementations found  
**Issue**: No unified/centralized shift reconciliation logic

---

## Summary: THREE Different Entry Points for Shift Reconciliation

| Name | Location | Purpose | Handles | Issues |
|------|----------|---------|---------|--------|
| **Shifts API** | `/api/shifts/route.ts` | Core shift operations | POST create, PUT update, GET list | ✅ Accepts any expectedCash value without validation |
| **Shifts [ID] API** | `/api/shifts/[id]/route.ts` | Fetch specific shift | GET by ID only | ✅ Read-only, no write logic |
| **Settlements API** | `/api/receivables/payments/route.ts` | Record debt payments | Updates shift.cashSettlements, expectedCash | ✅ Updates shift but only for Cash method |
| **Returns API** | `/api/returns/route.ts` | Process returns | Recalculates expectedCash | ⚠️ Only for store credit (not cash returns) |
| **Shift Context** | `src/components/shift-manager.tsx` | Frontend state mgmt | addSale, processReturn, startShift, closeShift | ⚠️ Updates expectedCash but frontend only |
| **Settlement Hook** | `src/hooks/use-settle-payment.ts` | Settlement UI logic | Calls API only, no shift update | ❌ No direct shift refresh |

---

## Detailed Analysis

### 1. PRIMARY API: `/api/shifts/route.ts`

**Location**: `src/app/api/shifts/route.ts`

**Three Methods**:

#### GET - Fetch All Shifts
```typescript
export async function GET(request: Request) {
  const shifts = await getShiftsByTenant(session.user.tenantId);
  return NextResponse.json(shifts);  // ← Direct from DB, no calculation
}
```
- **Issues**: Just returns DB values, no recalculation

#### POST - Create New Shift
```typescript
export async function POST(request: Request) {
  const result = await db.insert(schema.shifts).values({
    startingCash: body.startingCash.toString(),
    expectedCash: body.startingCash.toString(),  // ← Sets initial expectedCash = startingCash
    // ... other fields initialize to 0
  });
  return NextResponse.json(result);
}
```
- **Issues**: 
  - Only initializes expectedCash to startingCash
  - Later updates are NOT recalculated

#### PUT - Update Shift
```typescript
export async function PUT(request: Request) {
  // Accepts ANY field update
  if (updateData.expectedCash !== undefined) {
    dataToUpdate.expectedCash = updateData.expectedCash.toString();  // ← Just stores whatever is sent
  }
  // ...
  return NextResponse.json(result);
}
```
- **CRITICAL ISSUE**: 
  - No validation of expectedCash
  - Accepts ANY value without checking formula
  - No recalculation of formula
  - **This is the main issue!**

---

### 2. SECONDARY API: `/api/shifts/[id]/route.ts`

**Location**: `src/app/api/shifts/[id]/route.ts` (CREATED DURING FIX #1)

**Only Method**: GET by ID

```typescript
export async function GET(request: NextRequest, { params }: ...) {
  const shift = await getShiftById(shiftId);  // ← Fetches from DB
  return NextResponse.json(shift);  // ← No calculation
}
```

- **Purpose**: Refresh single shift for shift context
- **Issues**: 
  - Read-only endpoint
  - No write/update capability
  - Only used by refreshActiveShift()

---

### 3. SETTLEMENTS API: `/api/receivables/payments/route.ts`

**Location**: `src/app/api/receivables/payments/route.ts`

**Only Method**: POST - Record Payment

```typescript
export async function POST(request: Request) {
  // Within database transaction:
  
  if (method === 'Cash') {
    await tx.update(schema.shifts)
      .set({
        cashSettlements: (currentCashSettlements + totalApplied).toString(),
        expectedCash: (currentExpectedCash + totalApplied).toString(),  // ← Updates for cash only
      })
      .where(eq(schema.shifts.id, collectorShift.id));
  } else if (method === 'Card') {
    // Only updates cardSettlements, NOT expectedCash
    await tx.update(schema.shifts)
      .set({
        cardSettlements: (currentCardSettlements + totalApplied).toString(),
      });
  } else if (method === 'Mobile') {
    // Only updates mobileSettlements, NOT expectedCash
    await tx.update(schema.shifts)
      .set({
        mobileSettlements: (currentMobileSettlements + totalApplied).toString(),
      });
  }
}
```

- **Issues**:
  - ✅ Only updates expectedCash for Cash settlements (correct)
  - ✅ Uses transaction for atomicity (good)
  - ❌ Fetches currentExpectedCash without recalculating formula
  - ❌ Just adds amount directly: `currentExpectedCash + totalApplied`
  - ❌ What if currentExpectedCash in DB is already WRONG?

---

### 4. RETURNS API: `/api/returns/route.ts`

**Location**: `src/app/api/returns/route.ts`

**Only Method**: POST - Create Return

```typescript
export async function POST(request: Request) {
  // When auto-approving store credit return:
  
  const newExpectedCash = shiftBefore.startingCash + 
                         shiftBefore.cashSales + 
                         shiftBefore.cashSettlements - 
                         newCashReturns;  // ← RECALCULATES! ✅
  
  const shiftAfter = await updateShift(shiftId, {
    expectedCash: newExpectedCash,
    cashReturns: newCashReturns
  });
}
```

- **Issues**:
  - ✅ Recalculates expectedCash using correct formula
  - ✅ Only for store credit (no cash impact anyway)
  - ❌ What about cash returns? Not implemented yet
  - ❌ Audit logging not wrapped in transaction

---

### 5. SHIFT CONTEXT: `shift-manager.tsx`

**Location**: `src/components/shift-manager.tsx`

**Key Methods**:

#### addSale()
```typescript
const addSale = async (sale: Sale) => {
  const updatedShift = { ...activeShift };
  updatedShift.totalSales += sale.totalAmount;
  
  switch(sale.paymentMethod) {
    case 'Cash': updatedShift.cashSales += sale.totalAmount; break;
    // ... other methods
  }
  
  // Recalculate expectedCash
  updatedShift.expectedCash = updatedShift.startingCash + 
                             updatedShift.cashSales + 
                             updatedShift.cashSettlements - 
                             updatedShift.cashReturns;  // ← CORRECT FORMULA ✅
  
  // Send to API
  await fetch('/api/shifts', {
    method: 'PUT',
    body: JSON.stringify({ expectedCash: updatedShift.expectedCash, ... })
  });
};
```

- **Issues**:
  - ✅ Formula is correct
  - ❌ **This might not be called from POS!** (Need to verify)
  - ❌ Frontend-only, not reliable for data integrity

#### processReturn()
```typescript
const processReturn = async (returnAmount: number, refundMethod: string) => {
  if (refundMethod === 'cash') {
    updatedShift.cashReturns = (updatedShift.cashReturns || 0) + returnAmount;
    
    updatedShift.expectedCash = updatedShift.startingCash + 
                               updatedShift.cashSales + 
                               updatedShift.cashSettlements - 
                               updatedShift.cashReturns;  // ← CORRECT ✅
  }
};
```

---

### 6. SETTLEMENT HOOK: `use-settle-payment.ts`

**Location**: `src/hooks/use-settle-payment.ts`

**Only Method**: settlePayment()

```typescript
const settlePayment = async (params: {...}) => {
  const response = await fetch('/api/receivables/payments', {
    method: 'POST',
    body: JSON.stringify({ customerId, amount, method, ... })
  });
  
  // Calls onSuccess callback:
  options?.onSuccess?.(data);  // ← Modified in Priority 1 Fix #5
};
```

- **Issues**:
  - ✅ Now calls onSuccess which refreshes shift (after our fix)
  - ❌ No direct shift update logic
  - ❌ Depends on page implementation

---

## Where expectedCash is Updated

### Database Updates (Most Important)

| Location | Trigger | Update Method | Formula Check | Issues |
|----------|---------|---------------|---------------|--------|
| `/api/shifts` POST | New shift | `expectedCash = startingCash` | ✅ Correct | Initial value only |
| `/api/shifts` PUT | Any sale added | From `shift-manager.tsx` | ✅ Correct | **Frontend-dependent** |
| `/api/receivables/payments` POST | Settlement recorded | `expectedCash += amount` | ⚠️ Partial | Only for Cash method, adds without recalculating base |
| `/api/returns` POST | Return processed | Full recalculation | ✅ Correct | Only for store credit |

---

## The Core Problem: NO CENTRALIZED VALIDATION

```
When a sale is recorded:
  ├─ Does it call shift-manager.addSale()? 
  │  └─ That WOULD update expectedCash correctly
  └─ Or does it just insert to DB?
     └─ Then expectedCash is NEVER updated! ❌

When settlement is recorded:
  ├─ `/api/receivables/payments` updates expectedCash
  │  └─ But assumes currentExpectedCash is correct ❌
  └─ No validation that formula was followed

When return is processed:
  ├─ `/api/returns` recalculates correctly ✅
  └─ But only for store credit

Result: Multiple independent implementations → inconsistent data
```

---

## Discovery: You Were Right About Multiple Implementations!

### Timeline:
1. **Original**: Only `/api/shifts/route.ts` existed
   - POST/PUT/GET all in one file
   - No special shift refresh logic

2. **During Priority 1 Fix**: Created `/api/shifts/[id]/route.ts`
   - New endpoint for single shift refresh
   - Simpler than fetching all shifts

3. **Not Modified**: Original `/api/shifts/route.ts`
   - Still has PUT method that accepts ANY expectedCash value
   - No recalculation logic
   - **This is the vulnerability**

### The Two Versions:

**OLD API** (`/api/shifts`):
```typescript
PUT: Accepts expectedCash without validation
    - Line 100: dataToUpdate.expectedCash = updateData.expectedCash.toString()
    - No formula check
    - Any value accepted ❌
```

**NEW API** (`/api/shifts/[id]`):
```typescript
GET: Fetches single shift by ID
     - Read-only
     - No write capability
     - Used by refreshActiveShift() ✅
```

---

## The Real Issue

**NOT** that there are too many implementations.

**Rather**: `expectedCash` can be updated in **unvalidated ways**:

```
Scenario 1: Sale Created
  ┌─ POS calls /api/sales
  ├─ /api/sales calls createSale() (queries.ts)
  ├─ Sale inserted to DB
  └─ expectedCash NEVER updated ❌

Scenario 2: Settlement Recorded (Cash)
  ┌─ Page calls settlePayment hook
  ├─ Hook calls /api/receivables/payments
  ├─ API updates shift.cashSettlements
  ├─ API also updates expectedCash: currentValue + amount
  └─ BUG: currentValue might be wrong! ❌

Scenario 3: Settlement Recorded (Card)
  ┌─ Page calls settlePayment hook
  ├─ Hook calls /api/receivables/payments
  ├─ API updates shift.cardSettlements
  └─ expectedCash NOT updated (correct) ✅

Scenario 4: Return Processed
  ┌─ API calls /api/returns
  ├─ For store credit: full recalculation ✅
  └─ For cash: not implemented yet
```

---

## Files That Update Shift.expectedCash

```
1. src/app/api/shifts/route.ts (POST + PUT)
   ├─ Line 52: POST initializes expectedCash = startingCash
   ├─ Line 100: PUT accepts ANY expectedCash value
   └─ Issue: No validation

2. src/app/api/receivables/payments/route.ts (POST)
   ├─ Line 142: expectedCash += totalApplied (for Cash method only)
   └─ Issue: Assumes currentExpectedCash is correct

3. src/app/api/returns/route.ts (POST)
   ├─ Lines 124-127: Recalculates full formula
   └─ OK: Recalculates correctly

4. src/components/shift-manager.tsx
   ├─ Lines 77-80: addSale() recalculates
   ├─ Lines 184-187: processReturn() recalculates
   └─ Issue: Frontend-dependent, may not be called
```

---

## Files That READ Shift.expectedCash (Without Recalculating)

```
1. src/lib/queries.ts - getShiftsByTenant()
   └─ Line 404: Just parseFloat(s.expectedCash || '0')
   
2. src/components/shift-summary.tsx
   └─ Line 43: Just displays safeExpectedCash = Number(shift.expectedCash)
   
3. src/app/api/shifts/[id]/route.ts - GET
   └─ Just returns from queries.getShiftById()
```

---

## Recommendation

### Option A: Fix at Source (Best)
Every place that should update expectedCash:
1. Always recalculate using full formula
2. Never add/subtract directly to currentValue
3. Validate shift has all required fields

**Locations to fix**:
- `/api/receivables/payments` (line 142)
- `/api/shifts` PUT method (add validation)

### Option B: Fix at Read (Quick)
In `shift-summary.tsx`:
```typescript
// Instead of trusting DB:
const safeExpectedCash = Number(shift.expectedCash) || 0;

// Recalculate to verify:
const calculatedExpectedCash = safeStartingCash + safeCashSales + safeCashSettlements - safeCashReturns;

// Use calculated, log if different
if (Math.abs(safeExpectedCash - calculatedExpectedCash) > 0.01) {
  console.warn('Expected cash mismatch!', { stored: safeExpectedCash, calculated: calculatedExpectedCash });
}
```

### Option C: Both (Most Robust)
- Fix all write points to recalculate
- Add display-time validation
- Add database trigger to prevent invalid updates

---

## Impact of Not Fixing

- ✅ Display shows wrong expectedCash
- ✅ Can't reconcile shift properly
- ✅ Variance calculation is wrong
- ✅ Cascading errors in reports
- **Critical for business operations**

---

## Code References

```
API Endpoints:
- GET /api/shifts → src/app/api/shifts/route.ts:11
- POST /api/shifts → src/app/api/shifts/route.ts:30
- PUT /api/shifts → src/app/api/shifts/route.ts:81
- GET /api/shifts/[id] → src/app/api/shifts/[id]/route.ts:8
- POST /api/receivables/payments → src/app/api/receivables/payments/route.ts:12
- POST /api/returns → src/app/api/returns/route.ts:27

Hooks:
- useSettlePayment() → src/hooks/use-settle-payment.ts:34
- useShiftContext() → src/components/shift-manager.tsx:395

Context:
- ShiftProvider → src/components/shift-manager.tsx:28
- ShiftManager → src/components/shift-manager.tsx:232
```
