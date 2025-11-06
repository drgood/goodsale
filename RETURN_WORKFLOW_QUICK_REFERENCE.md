# Return Workflow - Quick Visual Reference

## 4 Simple Phases

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SETUP     │ --> │   REQUEST   │ --> │   REVIEW    │ --> │ RESOLUTION  │
│             │     │             │     │             │     │             │
│ Configure   │     │ Create      │     │ Approve or  │     │ Process     │
│ policy      │     │ return      │     │ reject      │     │ refund      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
   One-time            Minutes             Hours              Minutes
```

---

## Phase 1: SETUP

**Where:** `/[tenant]/settings/return-policy`

**What to configure:**
```
┌────────────────────────────────────┐
│ 1. Return Window: 30 days          │
│    (How long customers can return)  │
│                                    │
│ 2. Refund Method:                  │
│    □ Original payment              │
│    □ Store credit                  │
│    ☑ Both (customer chooses)       │
│                                    │
│ 3. Restocking Fee: 5%              │
│    (Fee deducted from refund)       │
│                                    │
│ 4. Require Approval: ☑ YES         │
│    (Admin must approve first)       │
│                                    │
│ 5. Allow Partial: ☑ YES            │
│    (Customers can return some items)│
│                                    │
│ 6. Notify Customer: ☑ YES          │
│    (Send status updates)            │
│                                    │
│ [Save Policy]                      │
└────────────────────────────────────┘
```

---

## Phase 2: REQUEST (Return Created)

**Auto-Calculated Amounts:**

```
Item Price:           $100.00
Restocking Fee (5%):  -$5.00
────────────────────────────
Customer Refund:      $95.00

Status: PENDING ⏳
```

**What's Needed:**
```
✓ Sale ID (which sale is this from?)
✓ Items (what's being returned?)
✓ Condition (like_new, good, fair, damaged?)
✓ Reason (why is it being returned?)
```

---

## Phase 3: REVIEW

**Where:** `/[tenant]/returns`

**Step 1: Filter**
```
Status: [All Returns ▼]
  • All Returns
  • Pending Approval  ← Start here
  • Approved
  • Refunded
  • Rejected
```

**Step 2: View Card**
```
┌──────────────────────────────────┐
│ Return from Sale: abc123...      │ ← Click "Details" for full info
│ Status: PENDING ⏳               │
├──────────────────────────────────┤
│ Return: $100    Fee: -$5    Net:  │
│ Items: 1        Reason: Damaged  │
├──────────────────────────────────┤
│ [Details] [Approve] [Reject]     │
└──────────────────────────────────┘
```

**Step 3a: APPROVE**
```
Click [Approve]
    ↓
Modal appears:
[Approval Notes] (optional)
"Damage verified"
    ↓
Click [Confirm]
    ↓
Status: APPROVED ✅
Badge turns BLUE
```

**Step 3b: REJECT** (Alternative)
```
Click [Reject]
    ↓
Modal appears:
[Rejection Reason] (required!)
"Outside 30-day window"
    ↓
Click [Confirm]
    ↓
Status: REJECTED ❌
Badge turns RED
```

---

## Phase 4: RESOLUTION

**Entry Point:** Approved returns show [Process Refund]

**Step 1: Click Button**
```
[Process Refund]
    ↓
Modal shows refund amount: $95.00
```

**Step 2: Select Method**
```
Refund Method: [Select ▼]
  • Cash
  • Card
  • Mobile Money
  • Store Credit ← Adds to customer balance

Choose what works for customer
```

**Step 3: Confirm**
```
Click [Confirm]
    ↓
Status: REFUNDED ✅
Badge turns GREEN
Timestamp recorded
Customer notified
```

---

## Status Badges

```
PENDING ⏳  Yellow    Waiting for admin to review
APPROVED ✅ Blue     Approved, ready for refund
REFUNDED ✅ Green    Refund processed, done
REJECTED ❌ Red      Not accepted
CANCELLED  Gray     Cancelled by customer
```

---

## Timeline Example: Day by Day

```
Nov 1  (Day 1)
└─ Customer buys Laptop ($1,500)

Nov 3  (Day 3)
└─ Laptop arrives damaged

Nov 4  (Day 4)
├─ 11:00 AM - Return created (PENDING)
└─ Customer notified

Nov 5  (Day 5)
├─ 9:00 AM - Admin approves (APPROVED)
├─ Customer notified
├─ 9:15 AM - Refund processed (REFUNDED)
└─ Customer notified

Nov 7  (Day 7)
└─ Customer gets $1,425 refund

Total: 3 days from return request to refund
```

---

## Quick Calculations

### 0% Fee
```
Price: $100  →  Refund: $100
```

### 5% Fee
```
Price: $100  →  Fee: $5  →  Refund: $95
```

### 10% Fee
```
Price: $100  →  Fee: $10  →  Refund: $90
```

### Multiple Items (5% fee)
```
Item 1: $50
Item 2: $60
Item 3: $40
────────── 
Total:  $150
Fee:    -$7.50
────────
Refund: $142.50
```

---

## Refund Methods & What They Mean

```
CASH
├─ Customer gets: Physical cash
├─ Best for: In-store purchases
└─ Next step: Hand them cash

CARD
├─ Customer gets: Refund to their card
├─ Best for: Online purchases
└─ Next step: Process with payment provider

MOBILE MONEY
├─ Customer gets: Mobile transfer
├─ Best for: Digital payments
└─ Next step: Process with provider

STORE CREDIT
├─ Customer gets: Balance on account
├─ Best for: Future purchases
└─ Next step: Automatic (balance updated)
```

---

## Common Scenarios

### Scenario A: Quick Return (5 min total)
```
Customer buys $50 item
│
├─ Return created
├─ Admin approves immediately
├─ Selects "Cash" refund
└─ Customer gets $47.50 (5% fee)
```

### Scenario B: Careful Review (2 hours total)
```
Customer buys $5,000 item
│
├─ Return created
├─ Admin reviews photos
├─ Admin contacts customer
├─ Admin approves with note
├─ Selects "Card" refund
└─ Refund sent to card
```

### Scenario C: Auto-Process (30 sec total)
```
If "Require Approval" is OFF:

Customer buys $30 item
│
├─ Return created
├─ Auto-approved by system
├─ Auto-refund processed
└─ Customer notified
```

### Scenario D: Multiple Items
```
Customer buys 3 items: Shirt, Pants, Shoes
│
├─ Returns only Pants ($60)
├─ (Keeps Shirt and Shoes)
├─ Return created for $60
├─ Approved
├─ Gets $57 (5% fee)
└─ Keeps rest of order
```

---

## What Happens at Each Step

### When Return Created
```
✓ Fees calculated
✓ Refund amount calculated
✓ Status set to PENDING
✓ Customer notified
✓ Stored in database
✓ Shows in Returns list
```

### When Return Approved
```
✓ Status changes to APPROVED
✓ Approval notes saved
✓ Customer notified
✓ Ready for refund processing
✓ Shows in APPROVED filter
```

### When Refund Processed
```
✓ Status changes to REFUNDED
✓ Refund method recorded
✓ Refund timestamp set
✓ If Store Credit: Balance updated
✓ Customer notified
✓ Return complete
```

---

## Buttons You'll Use

```
SETUP PAGE
├─ Save Policy      ← Save changes
├─ Discard Changes  ← Revert to last saved
└─ Policy Summary   ← View current settings

RETURNS LIST PAGE
├─ Details          ← View full information
├─ Approve          ← Approve return
├─ Reject           ← Reject return
└─ Process Refund   ← Start refund
```

---

## Key Numbers to Remember

```
Return Window:     1-365 days
Restocking Fee:    0-100%
Customer Refund:   Calculated automatically

Example: $1,000 item with 5% fee
Refund = $1,000 - (1,000 × 0.05) = $950
```

---

## Troubleshooting Quick Fix

| Problem | Check |
|---------|-------|
| Can't find return | Filter by correct status |
| Wrong refund amount | Check policy fee % |
| Customer balance not updated | Used "Store Credit" method? |
| Can't approve | Is return in PENDING? |
| Fees calculating wrong | Verify policy saved |

---

## Best Practice Checklist

```
SETUP
☐ Set realistic return window (14-60 days)
☐ Choose appropriate fee (0-10% typical)
☐ Enable customer notifications
☐ Test with small items first

PROCESSING
☐ Review details before approving
☐ Add clear approval notes
☐ Use correct refund method
☐ Process within 24 hours
☐ Keep customers informed
```

---

## State Machine (What Leads Where)

```
                    ┌────────────┐
                    │  PENDING   │
                    └─────┬──────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
       APPROVED      REJECTED      CANCELLED
           │              │              │
           │              │              │
           ▼              ▼              ▼
        REFUNDED         END            END
           │
           ▼
          END

Possible Paths:
✓ PENDING → APPROVED → REFUNDED → END
✓ PENDING → REJECTED → END
✓ PENDING → CANCELLED → END
```

---

## API Endpoints (If Using Postman/API)

```
GET    /api/return-policies
       └─ Get current policy

POST   /api/return-policies
       └─ Update policy

GET    /api/returns
       └─ List all returns

POST   /api/returns
       └─ Create return

GET    /api/returns/[id]
       └─ Get return details

PATCH  /api/returns/[id]
       └─ Approve/Reject/Refund
```

---

## Final Summary

```
┌─────────────────────────────────────┐
│ THE RETURN WORKFLOW IN 4 STEPS      │
├─────────────────────────────────────┤
│                                     │
│ 1️⃣  SETUP                           │
│    Go to Settings → Return Policy   │
│    Configure rules (one time)       │
│                                     │
│ 2️⃣  REQUEST                         │
│    Return created from sale         │
│    Fees auto-calculated             │
│    Status: PENDING                  │
│                                     │
│ 3️⃣  REVIEW                          │
│    Go to Returns Management         │
│    Click Approve or Reject          │
│    Status: APPROVED or REJECTED     │
│                                     │
│ 4️⃣  RESOLUTION                      │
│    Click Process Refund             │
│    Choose refund method             │
│    Status: REFUNDED                 │
│                                     │
│ Total time: Usually 24-48 hours     │
│                                     │
└─────────────────────────────────────┘
```

---

**That's it! You now know the complete return workflow.** 🎉
