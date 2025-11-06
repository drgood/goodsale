# Returns Handling: POS vs Sales Page Comparison

## Overview
Returns can be initiated from two locations with DIFFERENT behaviors:
1. **POS Page** - During active shift (restricted)
2. **Sales Page** - From sales history (unrestricted)

---

## Side-by-Side Comparison

### **POS Page Returns** (pos/page.tsx lines 527-632)

**Location:** Point of Sale during shift

**Key Differences:**
```typescript
const returnData = {
  saleId: selectedSaleForReturn.id,
  customerId: selectedSaleForReturn.customerId || null,
  reason: returnReason || 'POS return during shift',
  items: itemsToReturn,
  refundMethod: 'store_credit',  // ← HARDCODED
  shiftId: shiftContext?.activeShift?.id,  // ← SHIFT LINKED
  createdDuringShift: true  // ← AUTO-APPROVAL FLAG
};
```

**Characteristics:**
- ✅ **Always store_credit** - Only refund method allowed
- ✅ **Shift linked** - Includes shiftId for accounting
- ✅ **createdDuringShift: true** - Triggers auto-approval
- ✅ **Auto-approved** - Result has `impact` object with shift updates
- ✅ **Stock increased** - Handled in auto-approval path
- ✅ **Updates shift context** - Calls `shiftContext.updateShift()`

**Result Flow:**
```
POST /api/returns
├─ Status: 'approved' (auto)
├─ Impact object returned
├─ Stock increased
├─ Shift updated
├─ cashReturns updated
└─ expectedCash recalculated
```

---

### **Sales Page Returns** (sales/page.tsx lines 187-243)

**Location:** Sales history (any time)

**Key Differences:**
```typescript
const response = await fetch('/api/returns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    saleId: selectedSale.id,
    customerId: selectedSale.customerId,
    reason: returnReason || null,
    items: returnItems,
    refundMethod  // ← USER SELECTABLE
    // NO shiftId
    // NO createdDuringShift flag
  })
});
```

**Characteristics:**
- ❌ **User chooses refund method** - Could be cash, card, mobile, store_credit
- ❌ **NOT shift linked** - No shiftId sent
- ❌ **No auto-approval flag** - Returns stay pending
- ❌ **NOT auto-approved** - Status stays 'pending'
- ❌ **Stock NOT increased** - Only done in auto-approval path
- ⚠️ **No shift context update** - Only refreshes activeShift

**Result Flow:**
```
POST /api/returns
├─ Status: 'pending' (NOT auto-approved)
├─ NO impact object returned
├─ Stock NOT increased ❌
├─ Shift NOT updated ❌
├─ cashReturns NOT updated ❌
└─ expectedCash NOT recalculated ❌
```

---

## Critical Issues

### 🔴 ISSUE 1: Different Flows Create Inconsistency
| Aspect | POS | Sales |
|--------|-----|-------|
| Auto-Approval | ✅ Yes (store credit only) | ❌ No |
| Stock Increase | ✅ Immediate | ❌ Never |
| Shift Update | ✅ Immediate | ❌ Never |
| Refund Methods | ❌ Only store_credit | ✅ User choice |
| Approval Required | ❌ No | ✅ Yes |

### 🔴 ISSUE 2: Sales Page Returns Never Update Shift
When user processes return from Sales page:
1. Return created with `status: 'pending'`
2. No `shiftId` provided
3. No auto-approval triggers
4. Later when/if approved, approval handler doesn't update shift either
5. **Result:** Shift reconciliation never accounts for this return

### 🔴 ISSUE 3: Missing saleItemId in Both
```typescript
// POS (line 539):
saleItemId: null,  // POS returns don't have sale item IDs

// Sales (line 196):
// No saleItemId at all
```

**Problem:** Duplicate return validation checks for `saleItemId`, but both pages send `null`.
- Validation doesn't work properly
- Can't tell which exact items were returned

### 🔴 ISSUE 4: refundMethod Mismatch
**Sales Page allows:**
- cash
- card  
- mobile
- store_credit

**But Stock Only Increases for:**
- Auto-approved returns (which are store_credit only from POS)

**If Sales page processes cash return:**
- No stock increase
- Shift never updates
- Must manually approve later (but approval handler is broken)

### 🔴 ISSUE 5: Customer Balance Not Updated on Sales Page
**POS Page** (lines 591-608):
```typescript
// Manually refetches customers
if (result.return.refundMethod === 'store_credit') {
  const customersRes = await fetch('/api/customers');
  // Updates selectedCustomer
}
```

**Sales Page** (lines 187-243):
```typescript
// No customer update at all!
// Just refreshes shift
if (shiftContext?.refreshActiveShift) {
  await shiftContext.refreshActiveShift();
}
```

**Issue:** Sales page doesn't update customer balance even though return was created.

---

## Expected Behavior vs Actual

### Scenario 1: POS Store Credit Return ✅ Works
```
User: Returns item for store credit during shift
Flow:
  1. POST /api/returns (refundMethod: store_credit, shiftId: X, createdDuringShift: true)
  2. Auto-approved
  3. Stock increased
  4. Shift updated (cashReturns increased)
  5. expectedCash recalculated
  6. Customer balance updated
Result: ✅ All accounting correct
```

### Scenario 2: Sales Cash Return ❌ Broken
```
User: Returns item for cash refund from Sales page
Flow:
  1. POST /api/returns (refundMethod: cash, NO shiftId, NO createdDuringShift)
  2. Status: pending (NOT approved)
  3. Stock NOT increased
  4. Shift NOT updated
  5. expectedCash NOT recalculated
  6. Customer NOT updated
Later:
  7. Admin approves return via PATCH
  8. Still no stock increase (approval handler broken)
  9. Still no shift update (approval handler broken)
Result: ❌ Inventory wrong, shift wrong, customer wrong
```

---

## Root Causes

1. **Auto-Approval Only Works with store_credit**
   - Line 94 in route.ts: `if (createdDuringShift && finalRefundMethod === 'store_credit')`
   - Restricts auto-approval to store credit only
   - POS enforces this, Sales page allows user to choose

2. **Stock Only Increases in Auto-Approval Path**
   - Lines 136-146 in route.ts inside `if (initialStatus === 'approved')`
   - Pending returns never increase stock
   - Sales page returns are always pending

3. **Approval Handler Doesn't Implement Shift Logic**
   - [id]/route.ts lines 77-111 completely missing shift updates
   - Should mirror the logic from route.ts but doesn't

4. **No saleItemId Tracking**
   - Both pages set `saleItemId: null`
   - Prevents duplicate return detection from working properly

---

## Recommendations

### Fix 1: Unify Return Flow
Choose ONE approach:
- **Option A:** Only allow store_credit returns (remove user choice, always auto-approve)
- **Option B:** Support all refund methods but require approval (no auto-approval)

### Fix 2: Stock Should Always Increase on Approval
Not just for auto-approved, but for ALL approvals:
```typescript
// In approval handler when action === 'refund'
// Add stock increase logic
for (const item of returnRecord.items) {
  if (item.productId) {
    const product = await db.select().from(schema.products)...
    const newStock = currentStock + item.quantity;
    await db.update(schema.products).set({ stock: newStock })...
  }
}
```

### Fix 3: Implement Full Shift Updates in Approval Handler
```typescript
// In approval handler when action === 'refund'
if (returnRecord.saleId && shiftId) {
  // Recalculate expectedCash
  // Update cashReturns
  // Log transaction
}
```

### Fix 4: Add saleItemId to Returns
Track which exact sale items were returned to prevent duplicates:
```typescript
// In both POS and Sales pages
saleItemId: item.saleItemId,  // Not null!
```

### Fix 5: Sales Page Should Also Update Customer
```typescript
// Add after successful return creation
if (result.return.refundMethod === 'store_credit') {
  // Refetch customers
  const customersRes = await fetch('/api/customers');
  // Update state
}
```

---

## Summary

| Aspect | POS | Sales | Should Be |
|--------|-----|-------|-----------|
| **Auto-Approval** | ✅ store_credit | ❌ never | ❌ Never (requires approval) |
| **Stock Increase** | ✅ auto | ❌ never | ✅ Always on approval |
| **Shift Update** | ✅ auto | ❌ never | ✅ Always on approval |
| **Refund Methods** | 1 (store_credit) | 4 (user choice) | ? Clarify policy |
| **Customer Balance** | ✅ Updated | ❌ Not updated | ✅ Always updated |

**Bottom Line:** The two entry points have fundamentally different implementations. POS works well for store credit, but Sales page is broken for cash/card refunds. The approval handler (for later use) is incomplete on both paths.
