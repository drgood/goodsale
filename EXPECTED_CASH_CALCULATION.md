# Expected Cash in Drawer - Calculation Guide

## Formula

```
Expected Cash in Drawer = Starting Cash + Cash Sales + Settlement Collections - Cash Returns
```

### Components

| Component | Description | Updated When | Example |
|-----------|-------------|--------------|---------|
| **Starting Cash** | Initial float when shift begins | Shift starts | GH₵500.00 |
| **+ Cash Sales** | All sales paid with cash method | Sale recorded (cash payment) | GH₵1,250.50 |
| **+ Settlement Collections** | Debt payments received in cash | Payment settled with cash method | GH₵450.75 |
| **- Cash Returns** | Refunds given in cash to customers | Return processed with cash refund | GH₵75.00 |

---

## Calculation Details

### Where It's Calculated

**1. Frontend (Display) - `shift-summary.tsx` line 141-146**
```typescript
// Display the calculated value with formula shown
const safeExpectedCash = Number(shift.expectedCash) || 0;

// Formula shown to user:
Formula: {startingCash} + {cashSales} + {cashSettlements} - {cashReturns}
```

**2. Backend (When Shift Changes) - `shift-manager.tsx` lines 76-80**
```typescript
// When a sale is added
updatedShift.expectedCash = updatedShift.startingCash + 
                           updatedShift.cashSales + 
                           updatedShift.cashSettlements - 
                           updatedShift.cashReturns;
```

**3. After Return - `shift-manager.tsx` lines 184-187**
```typescript
// When a cash return is processed
updatedShift.expectedCash = updatedShift.startingCash + 
                           updatedShift.cashSales + 
                           updatedShift.cashSettlements - 
                           updatedShift.cashReturns;
```

---

## When Expected Cash Updates

| Event | Trigger | Where Updated |
|-------|---------|---------------|
| Shift started | Admin enters starting cash | API POST /api/shifts |
| Cash sale recorded | POS records sale with "Cash" payment method | shift-manager.tsx addSale() |
| Cash settlement received | Debt paid with cash method | API POST /api/receivables/payments |
| Cash return issued | Refund given with cash method | API POST /api/returns |
| Any settlement from other pages | Settlement on Sales/Debtors/Customers page | shiftContext.refreshActiveShift() |

---

## Example Walkthrough

### Start of Shift
```
Starting Cash: GH₵500.00
Cash Sales: GH₵0
Settlement Collections: GH₵0
Cash Returns: GH₵0
────────────────────────
Expected Cash: GH₵500.00
```

### After First Sale (Cash)
```
Starting Cash: GH₵500.00
+ Cash Sales: GH₵250.00 (customer pays with cash)
+ Settlement Collections: GH₵0
- Cash Returns: GH₵0
────────────────────────
Expected Cash: GH₵750.00
```

### After Settlement (Cash)
```
Starting Cash: GH₵500.00
+ Cash Sales: GH₵250.00
+ Settlement Collections: GH₵100.00 (customer pays credit balance in cash)
- Cash Returns: GH₵0
────────────────────────
Expected Cash: GH₵850.00
```

### After Cash Return
```
Starting Cash: GH₵500.00
+ Cash Sales: GH₵250.00
+ Settlement Collections: GH₵100.00
- Cash Returns: GH₵25.00 (refund given in cash)
────────────────────────
Expected Cash: GH₵825.00
```

---

## Important Notes

### What's NOT Included

- **Card Sales**: Don't affect expected cash (no cash received)
- **Mobile Money Sales**: Don't affect expected cash (no cash received)  
- **Credit Sales**: Don't affect expected cash (debt, paid later)
- **Card Settlements**: Don't affect expected cash (payment not in cash)
- **Mobile Settlements**: Don't affect expected cash (payment not in cash)
- **Store Credit Returns**: Don't affect expected cash (no cash given out)

### Why Card/Mobile/Credit Don't Affect Cash

These payment methods don't involve physical cash:
- **Card & Mobile**: Money goes to payment processor, not the cash drawer
- **Credit**: No cash received, customer pays later
- **Store Credit Returns**: Customer gets credit toward future purchase, not cash

---

## Closing Shift & Variance

When closing shift, the user counts actual cash in the drawer:

```
Expected Cash: GH₵825.00
Actual Cash Counted: GH₵823.50
─────────────────────────
Variance: -GH₵1.50 (shortfall)
```

Variance can happen due to:
- Rounding differences
- Unreported cash transactions
- Theft or loss
- Honest mistakes in counting

---

## Technical Details

### Data Flow

1. **Database stores as strings** (numeric(10,2) in schema)
   - Example: `"825.50"` stored in DB

2. **API returns parsed numbers**
   - Example: `825.50` returned as number in JSON

3. **Frontend receives and displays**
   - Ensures all numeric fields coerced to Number()
   - Prevents string concatenation bugs
   - Displays with `.toFixed(2)` formatting

### Formula Recalculation Points

The formula is recalculated and saved to DB at:

1. **Adding a sale** (if cash payment)
   - API endpoint: PUT /api/shifts
   - Component: shift-manager.tsx addSale()

2. **Recording settlement** (if cash payment)
   - API endpoint: POST /api/receivables/payments
   - Handled in API, shift context refreshed on frontend

3. **Processing return** (if cash refund)
   - API endpoint: POST /api/returns
   - Component: shift-manager.tsx processReturn()

4. **Shift context refresh**
   - API endpoint: GET /api/shifts/{id}
   - Fetches current calculation from DB

---

## Debugging: If Expected Cash is Wrong

**Check these in order:**

1. **Is the formula correct?**
   - Should be: starting + sales + settlements - returns
   - Not: starting + sales + settlements + returns (common mistake)

2. **Are the components parsed as numbers?**
   - Not strings ("825" instead of 825)
   - `shift-summary.tsx` does: `Number(shift.expectedCash) || 0`

3. **Was context refreshed after settlement?**
   - Each settlement page calls `shiftContext?.refreshActiveShift()`
   - If not called, activeShift stays stale

4. **Is the shift ID correct?**
   - When closing shift, ensures ID matches
   - Wrong ID = wrong shift data

5. **Check database directly**
   - Verify expectedCash value matches calculation
   - Look at shifts table, expectedCash column

---

## Related Fields in Shift

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| cashSales | number | Total cash payment sales | 1250.50 |
| cardSales | number | Total card payment sales | 500.00 |
| mobileSales | number | Total mobile payment sales | 300.00 |
| creditSales | number | Total credit/on-account sales | 450.00 |
| totalSales | number | Sum of all sales (all methods) | 2500.50 |
| cashSettlements | number | Total debt payments via cash | 450.75 |
| cardSettlements | number | Total debt payments via card | 100.00 |
| mobileSettlements | number | Total debt payments via mobile | 50.00 |
| cashReturns | number | Total refunds given in cash | 75.00 |
| expectedCash | number | Calculated: formula above | 825.00 |
| actualCash | number | Counted at end of shift | 823.50 |
| cashDifference | number | Variance: actual - expected | -1.50 |

---

## Code References

- **Display**: `src/components/shift-summary.tsx` line 141
- **Calculation**: `src/components/shift-manager.tsx` lines 76-80, 184-187
- **Database**: `src/db/schema.ts` (shifts table)
- **API Responses**: `src/app/api/shifts/route.ts`, `/api/shifts/[id]/route.ts`
