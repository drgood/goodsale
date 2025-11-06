# Credit Sales Impact on Expected Cash in Drawer

## Short Answer

**Credit sales DO NOT affect Expected Cash in Drawer.**

When a customer makes a purchase on credit:
- `creditSales` field is updated (tracking only)
- `expectedCash` is NOT changed
- Customer owes money, but no cash was received

---

## Why Credit Sales Don't Affect Expected Cash

### The Formula (Unchanged)

```
Expected Cash = Starting Cash + Cash Sales + Settlement Collections - Cash Returns
```

**Notice**: `creditSales` is NOT in this formula.

### The Logic

**Credit sales are debt, not cash:**

1. **Customer buys GH₵100 worth of goods on credit**
   - No cash received today
   - Customer's balance increases by GH₵100
   - Expected Cash STAYS THE SAME

2. **Later, customer pays GH₵50 in cash**
   - Now you receive GH₵50 cash
   - This is a "Settlement Collection" (settlement with Cash method)
   - NOW Expected Cash increases by GH₵50

---

## Code Evidence

### Where Credit Sales Are Processed

**File**: `src/components/shift-manager.tsx` lines 65-80

```typescript
const addSale = async (sale: Sale) => {
    if (!activeShift) return;

    const updatedShift = { ...activeShift };
    updatedShift.totalSales += sale.totalAmount;  // ← Add to total
    
    switch(sale.paymentMethod) {
        case 'Cash': updatedShift.cashSales += sale.totalAmount; break;
        case 'Card': updatedShift.cardSales += sale.totalAmount; break;
        case 'Mobile': updatedShift.mobileSales += sale.totalAmount; break;
        case 'On Credit': updatedShift.creditSales += sale.totalAmount; break;  // ← Update creditSales
    }
    
    // Update expectedCash with full formula: starting + sales + settlements - returns
    updatedShift.expectedCash = updatedShift.startingCash + 
                               updatedShift.cashSales +              // ← Only CASH sales
                               updatedShift.cashSettlements - 
                               updatedShift.cashReturns;
    // ← creditSales is NOT used in expectedCash calculation!
}
```

### What Gets Updated When Credit Sale Recorded

| Field | Updated | Value |
|-------|---------|-------|
| `creditSales` | ✅ YES | Increased by sale amount |
| `totalSales` | ✅ YES | Increased by sale amount |
| `expectedCash` | ❌ NO | Stays the same |
| `cashSales` | ❌ NO | Not touched |

---

## Detailed Example

### Scenario: Shift Activity

**Start of shift:**
```
Starting Cash: GH₵500
Cash Sales: GH₵0
Credit Sales: GH₵0
Settlement Collections: GH₵0
─────────────────────
Expected Cash: GH₵500
```

**Transaction 1: Customer buys GH₵100 on credit**
```
Starting Cash: GH₵500
Cash Sales: GH₵0
Credit Sales: GH₵100        ← Updated
Settlement Collections: GH₵0
─────────────────────
Expected Cash: GH₵500       ← NO CHANGE ← This is correct!
```

**Why?** The customer owes money but you haven't received cash yet.

**Transaction 2: Another customer buys GH₵200 in cash**
```
Starting Cash: GH₵500
Cash Sales: GH₵200          ← Updated
Credit Sales: GH₵100
Settlement Collections: GH₵0
─────────────────────
Expected Cash: GH₵700       ← Increased by 200
```

**Why?** You received GH₵200 cash today.

**Transaction 3: First customer pays their GH₵100 debt in cash**
```
Starting Cash: GH₵500
Cash Sales: GH₵200
Credit Sales: GH₵100        ← Unchanged (still tracking the sale)
Settlement Collections: GH₵100  ← Updated
─────────────────────
Expected Cash: GH₵800       ← Increased by 100
```

**Why?** Now you received the GH₵100 cash from settlement.

---

## Key Insight: Two Separate Concepts

### Credit Sale (Point of Sale)
- **When**: Customer buys on credit
- **What happens**: Debt is created, customer's balance increases
- **Cash impact**: NONE
- **Fields updated**: `creditSales`, `totalSales`

### Settlement (Payment Later)
- **When**: Customer pays their debt
- **What happens**: Debt is reduced, cash is received
- **Cash impact**: INCREASES Expected Cash (if paid in cash)
- **Fields updated**: `cashSettlements` (or `cardSettlements` / `mobileSettlements`)

---

## Why This Design Makes Sense

### From Accounting Perspective

```
Credit Sale = Revenue recorded, but payment pending
Settlement = Payment finally received in cash

Expected Cash in Drawer = What you should have in physical cash
```

**Example: GH₵1000 in credit sales**
- Your business is UP GH₵1000 in revenue ✓
- But your drawer is UP GH₵0 in cash ✓

This is the distinction between **revenue** and **cash**.

---

## Where Credit Sales Matter

| Where | Purpose | Note |
|-------|---------|------|
| **Total Sales** | Revenue tracking | Includes all sales methods |
| **Debtors List** | Who owes money | Shows all credit customers |
| **P&L Reports** | Profit calculation | Recognizes revenue when sold |
| **Expected Cash** | Cash reconciliation | Does NOT include credit |

---

## Common Mistake to Avoid

❌ **WRONG**:
```
Expected Cash = Starting + Cash Sales + Card Sales + Mobile Sales + Credit Sales - Returns
```

**This would be wrong because:**
- Credit sales haven't given you cash yet
- You'd over-estimate cash in drawer
- Reconciliation would be way off

✅ **CORRECT**:
```
Expected Cash = Starting + Cash Sales + Settlement Collections - Cash Returns
```

---

## Visual Flow

```
Credit Sale Made
    ↓
creditSales counter ↑ (tracking only)
expectedCash ← UNCHANGED (no cash received)
    ↓
Customer pays debt in cash later
    ↓
Settlement recorded
    ↓
cashSettlements counter ↑
expectedCash ↑ (now cash received)
```

---

## Summary Table

| Scenario | Affects Expected Cash | Why |
|----------|----------------------|-----|
| Cash sale of GH₵50 | ✅ YES (+50) | Cash received immediately |
| Card sale of GH₵50 | ❌ NO | Payment to processor, not drawer |
| Mobile sale of GH₵50 | ❌ NO | Payment to processor, not drawer |
| **Credit sale of GH₵50** | **❌ NO** | **Debt only, no cash received** |
| Settlement of GH₵50 (cash) | ✅ YES (+50) | Cash received now |
| Settlement of GH₵50 (card) | ❌ NO | Payment to processor, not drawer |
| Cash return of GH₵50 | ✅ YES (-50) | Cash paid out to customer |
| Store credit return of GH₵50 | ❌ NO | Customer gets credit, no cash out |

---

## Code References

- **Credit sale tracking**: `src/components/shift-manager.tsx` line 74
- **Expected Cash formula**: `src/components/shift-manager.tsx` lines 77-80
- **Database schema**: `src/db/schema.ts` (creditSales field)
- **Display**: `src/components/shift-summary.tsx` (shows creditSales separately from expectedCash)

---

## Related Concepts

- **totalSales**: Sum of ALL sales (cash, card, mobile, credit) - for revenue reporting
- **expectedCash**: Only CASH-impacting sales - for drawer reconciliation
- **Settlement Collections**: Debt payments received - these increase expectedCash when paid in cash
- **Debtors Balance**: Total amount owed by all customers - separate from expected cash
