# Return Policy Workflow - Complete Step-by-Step Guide

## Overview

The return workflow consists of 4 main phases:
1. **Setup** - Configure return policy
2. **Request** - Customer requests return
3. **Review** - Admin approves or rejects
4. **Resolution** - Process refund or close request

---

## Phase 1: Initial Setup - Configure Return Policy

### Location
`/[tenant]/settings/return-policy`

### Step-by-Step Setup

#### Step 1: Navigate to Return Policy Settings
1. Log in to GoodSale as admin
2. Go to **Settings** menu
3. Click **Return Policy**
4. You'll see the configuration form

#### Step 2: Set Return Window
```
Field: "Days to Accept Returns"
Example: Set to 30

This means customers have 30 days from purchase 
to request a return.
```

**Timeline Example:**
- Purchase date: Nov 1
- Return window: 30 days
- Last day to return: Dec 1
- After Dec 1: Returns cannot be accepted

#### Step 3: Choose Refund Method
```
Options:
A) "Refund to Original Payment Method"
   - Refund goes back to how they paid
   - Best for: Card/cash purchases

B) "Store Credit Only"
   - Customer gets store credit
   - Best for: Controlling cash flow

C) "Let Customer Choose (Credit or Original)"
   - Customer decides
   - Best for: Customer satisfaction
```

**Example Configuration:**
```
Refund Method: "Both" (let customer choose)
```

#### Step 4: Set Restocking Fee (Optional)
```
Field: "Restocking Fee (%)"
Example: 10

This charges 10% fee on all returns.
Used to cover handling costs.
```

**Fee Calculation Example:**
```
Item price: $100
Restocking fee: 10%
Fee amount: $10
Customer refund: $90
```

#### Step 5: Configure Workflow Settings

**A) Require Admin Approval**
```
Toggle: ON (recommended for expensive items)
Toggle: OFF (for automatic refunds)

If ON: Every return must be approved before refund
If OFF: Refunds process automatically
```

**B) Allow Partial Returns**
```
Toggle: ON (recommended)
Toggle: OFF (all-or-nothing)

If ON: Customer can return 2 items from order of 5
If OFF: Customer must return entire order
```

**C) Notify Customer**
```
Toggle: ON (recommended)
Toggle: OFF

If ON: Customer gets notifications when 
       return is approved/rejected
If OFF: No notifications sent
```

#### Step 6: Save Policy
```
Review all settings in "Policy Summary" section
Click "Save Policy" button
Toast notification: "Return Policy Saved"
```

### Example Configurations

**Configuration A: Strict (High Control)**
```
Return Window: 14 days
Refund Method: Store Credit Only
Restocking Fee: 15%
Require Approval: ON
Allow Partial: OFF
Notify Customer: ON
```

**Configuration B: Customer Friendly**
```
Return Window: 60 days
Refund Method: Both (customer chooses)
Restocking Fee: 0%
Require Approval: OFF
Allow Partial: ON
Notify Customer: ON
```

**Configuration C: Balanced**
```
Return Window: 30 days
Refund Method: Original payment method
Restocking Fee: 5%
Require Approval: ON
Allow Partial: ON
Notify Customer: ON
```

---

## Phase 2: Customer Requests Return

### How Returns are Created

Returns are created when:
1. Customer (or staff) initiates a return from a past sale
2. They specify which items to return
3. They provide a reason
4. System automatically calculates fees

### Creating a Return (API/Backend)

**Via API Endpoint:**
```
POST /api/returns

Request Body:
{
  "saleId": "sale-uuid-here",
  "customerId": "customer-uuid-here",
  "reason": "Product is damaged",
  "items": [
    {
      "saleItemId": "item-uuid",
      "productId": "product-uuid",
      "productName": "Laptop",
      "quantity": 1,
      "unitPrice": 1500.00,
      "condition": "damaged"
    }
  ]
}

Response:
{
  "id": "return-uuid",
  "status": "pending",
  "totalReturnAmount": 1500.00,
  "restockingFeeAmount": 75.00,  // 5% of 1500
  "refundAmount": 1425.00,       // 1500 - 75
  "createdAt": "2025-11-05T10:00:00Z"
}
```

### Item Condition Options

When creating a return, specify item condition:

```
Conditions:
- "like_new"   → Unopened, unused, perfect
- "good"       → Minimal wear, works perfectly
- "fair"       → Some wear marks, fully functional
- "damaged"    → Not working or significant damage
```

**Why Condition Matters:**
- Helps staff evaluate return legitimacy
- May affect restocking fee amount (future enhancement)
- Documented for quality control

### Return Reason Examples

**Valid Reasons:**
```
✅ "Product arrived damaged"
✅ "Wrong color received"
✅ "Item not as described"
✅ "Changed my mind"
✅ "Found better alternative"
✅ "Quality not as expected"
✅ "Defective after 3 days use"
```

### Return Request Status: PENDING

```
Initial State:
├─ Status: PENDING
├─ Awaiting: Admin approval (if policy requires)
├─ Customer: Notified of return request
└─ Timeline: Within policy's return window
```

**What's calculated automatically:**
```
Total Return Amount: Sum of all items being returned
                    = qty × unit_price for each item

Restocking Fee: totalReturnAmount × policy.feePercent
               = 1500 × 0.05 = 75

Refund Amount: totalReturnAmount - restockingFeeAmount
             = 1500 - 75 = 1425
```

---

## Phase 3: Admin Review - Approve or Reject

### Location
`/[tenant]/returns`

### Step 1: Access Returns Management
```
1. Go to main menu
2. Click "Returns Management"
3. See list of all returns
```

### Step 2: Filter Returns by Status
```
Filter Options at top:
- "All Returns"          → All returns in system
- "Pending Approval"     → Need decision
- "Approved"             → Approved, awaiting refund
- "Refunded"             → Refund processed
- "Rejected"             → Rejected returns
- "Cancelled"            → Cancelled by customer
```

**For this workflow:** Select "Pending Approval"

### Step 3: Review Return Details

Each return card shows:
```
┌─────────────────────────────────────┐
│ Return from Sale: abc12345...       │
│ Status: PENDING                     │
├─────────────────────────────────────┤
│ Return Amount:    $1,500.00         │
│ Restocking Fee:   -$75.00           │
│ Refund Amount:    $1,425.00         │
│ Items:            1                 │
├─────────────────────────────────────┤
│ Reason: Product arrived damaged     │
├─────────────────────────────────────┤
│ [Details] [Approve] [Reject]        │
└─────────────────────────────────────┘
```

### Step 4: View Full Details
```
Click "Details" button
Modal opens showing:
- Return ID
- Returned Items (with condition)
- Customer name
- Return reason
- Amounts breakdown
```

**Full Details Modal:**
```
Return Details
├─ Status: PENDING
├─ Date: 11/05/2025
├─ Return Amount: $1,500.00
├─ Refund Amount: $1,425.00
│
├─ Returned Items:
│  └─ Laptop
│     Qty: 1 @ $1,500.00
│     Condition: damaged
│     Return Amount: $1,500.00
│
├─ Return Reason:
│  "Product arrived damaged"
│
└─ [Details Modal Close]
```

### Step 5a: APPROVE the Return

**Click "Approve" button**

Modal appears:
```
┌──────────────────────────────────┐
│ Approve Return                   │
│                                  │
│ Label: "Approval Notes"          │
│ Text Field: [Optional notes...] │
│                                  │
│ [Cancel] [Confirm]               │
└──────────────────────────────────┘
```

**Add Optional Notes:**
```
Examples:
"Damage confirmed via photos"
"Processing expedited return"
"Confirmed with customer"
"Verified defective on receipt"
```

**Click "Confirm"**

**Result:**
```
✅ Toast: "Return approved"

Database Update:
├─ status: "approved"
├─ approvedBy: "admin-user-id"
├─ approvalReason: "[Your notes]"
└─ updatedAt: NOW()

UI Update:
└─ Status badge changes to blue "APPROVED"
```

### Step 5b: REJECT the Return (Alternative)

**Click "Reject" button**

Modal appears:
```
┌──────────────────────────────────┐
│ Reject Return                    │
│                                  │
│ Label: "Rejection Reason"        │
│ Text Field: [Why rejecting...]  │
│                                  │
│ [Cancel] [Confirm]               │
└──────────────────────────────────┘
```

**Add Rejection Reason (Required):**
```
Examples:
"Outside 30-day return window"
"Item not in returnable condition"
"No receipt or proof of purchase"
"Customer already received refund"
"Item not eligible for return"
```

**Click "Confirm"**

**Result:**
```
✅ Toast: "Return rejected"

Database Update:
├─ status: "rejected"
├─ approvedBy: "admin-user-id"
├─ rejectionReason: "[Your reason]"
└─ updatedAt: NOW()

UI Update:
├─ Status badge changes to red "REJECTED"
└─ Rejection reason displays on card
```

### Step 5c: Skip Approval (If Policy Allows)

**If your policy has:**
```
Require Approval: OFF
```

Then returns go directly to refund processing without approval step.

---

## Phase 4: Process Refund

### Entry Point: After Approval

Returns with status "APPROVED" show:
```
[Details] [Process Refund]
```

### Step 1: Click "Process Refund" Button

Modal appears:
```
┌────────────────────────────────────┐
│ Process Refund                     │
│                                    │
│ Refund Method:                     │
│ ┌──────────────────────────────┐  │
│ │ Select refund method...      │  │
│ │ ├─ Cash                      │  │
│ │ ├─ Card                      │  │
│ │ ├─ Mobile Money              │  │
│ │ └─ Store Credit              │  │
│ └──────────────────────────────┘  │
│                                    │
│ Refund Amount: $1,425.00           │
│                                    │
│ [Cancel] [Confirm]                 │
└────────────────────────────────────┘
```

### Step 2: Select Refund Method

Choose how customer will receive refund:

**Option A: Cash**
```
Customer will receive: Physical cash
Use for: POS purchases, walk-ins
Next step: Manually give customer cash
```

**Option B: Card**
```
Customer will receive: Refund to their card
Use for: Credit card purchases
Next step: Submit refund to payment processor
```

**Option C: Mobile Money**
```
Customer will receive: Mobile money transfer
Use for: Digital payment systems
Next step: Process transfer through provider
```

**Option D: Store Credit**
```
Customer will receive: Store credit balance
Use for: Future purchases
Next step: Balance added to customer account
```

### Step 3: Confirm Refund

**Click "Confirm"**

**System performs:**
```
1. Update return status to "refunded"
2. Record refund method chosen
3. Set refundedAt timestamp
4. If Store Credit: Add to customer balance
5. Update database
6. Show confirmation
```

**Result:**
```
✅ Toast: "Return refunded"

Database Update:
├─ status: "refunded"
├─ refundMethod: "cash" (or chosen method)
├─ refundedAt: NOW()
└─ updatedAt: NOW()

Customer Impact:
├─ If Store Credit: Balance increased by $1,425
├─ If Other: Manual action required
└─ Notification sent (if enabled)

UI Update:
├─ Status badge changes to green "REFUNDED"
└─ Refund details visible in details modal
```

---

## Complete Return Workflow Timeline

### Day 1: Customer Makes Purchase
```
10:00 AM - Customer buys Laptop for $1,500
│
└─ Sale created in system
   └─ Status: Paid
```

### Day 3: Laptop Arrives Damaged
```
3:00 PM - Customer receives damaged laptop
│
└─ Notifies store of damage
```

### Day 4: Return Request Created
```
11:00 AM - Staff creates return request
│
├─ Sale ID: [Original sale reference]
├─ Items: 1x Laptop, condition: damaged
├─ Reason: "Product arrived damaged"
│
└─ Return created
   ├─ Status: PENDING
   ├─ Total Return: $1,500.00
   ├─ Restocking Fee: $75.00 (5%)
   └─ Refund Amount: $1,425.00

Notifications:
└─ Customer notified of return request
```

### Day 5: Admin Reviews Return
```
9:00 AM - Admin accesses Returns Management
│
├─ Filters to "Pending Approval"
├─ Sees return from yesterday
│
├─ Clicks "Details"
│  └─ Verifies information
│
├─ Clicks "Approve"
│  ├─ Adds note: "Damage confirmed"
│  └─ Confirms
│
└─ Return status: APPROVED

Notifications:
└─ Customer notified of approval
```

### Day 5: Process Refund
```
9:15 AM - Admin processes refund
│
├─ Clicks "Process Refund"
├─ Selects: "Cash"
├─ Amount shown: $1,425.00
├─ Confirms
│
└─ Return status: REFUNDED

Customer Impact:
├─ Return closed
├─ Refund approved
└─ Notification sent

Next Steps:
└─ Staff prepares $1,425 cash payment
   └─ Customer receives cash when picking up/returning item
```

---

## Status Flow Diagram

```
┌──────────┐
│ PENDING  │
│          │
│ Awaiting │
│ approval │
└────┬─────┘
     │
     ├─────────────────┬──────────────────┐
     │                 │                  │
     ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  APPROVED   │   │  REJECTED   │   │ CANCELLED   │
│             │   │             │   │             │
│ Ready for   │   │ Return not  │   │ Customer    │
│ refund      │   │ accepted    │   │ cancelled   │
└──────┬──────┘   └─────────────┘   └─────────────┘
       │
       │ Process Refund
       │
       ▼
┌─────────────┐
│  REFUNDED   │
│             │
│ Refund      │
│ processed   │
└─────────────┘
```

---

## Key Calculations Reference

### Scenario: $100 Purchase

#### Scenario 1: 0% Fee
```
Original price: $100.00
Restocking fee: 0%
Fee amount: $0.00
Customer refund: $100.00
```

#### Scenario 2: 5% Fee
```
Original price: $100.00
Restocking fee: 5%
Fee amount: $5.00
Customer refund: $95.00
```

#### Scenario 3: 15% Fee
```
Original price: $100.00
Restocking fee: 15%
Fee amount: $15.00
Customer refund: $85.00
```

#### Scenario 4: Multiple Items

```
Item 1: 2x Shirts @ $25 = $50
Item 2: 1x Pants @ $60 = $60
Item 3: 1x Shoes @ $40 = $40
─────────────────────────────
Total: $150.00

Restocking fee: 10%
Fee amount: $150 × 0.10 = $15.00
Customer refund: $150 - $15 = $135.00
```

---

## Common Workflows

### Workflow A: Quick Approval & Cash Refund

```
1. Policy Setup: Require Approval ON, Fee 5%
2. Return Created: $100 item
3. Review: Approve immediately (1 minute)
4. Refund: Select Cash (1 minute)
5. Done: Give customer $95 cash
Total Time: ~5 minutes
```

### Workflow B: Careful Review & Investigation

```
1. Policy Setup: Require Approval ON, Fee 15%
2. Return Created: $5,000 item
3. Review: Get photos from customer (1 hour)
4. Review: Verify damage (30 minutes)
5. Approve: Add detailed notes
6. Refund: Select Card (1 minute)
7. Done: Refund to original payment method
Total Time: ~2 hours
```

### Workflow C: Automatic Refund (No Approval)

```
1. Policy Setup: Require Approval OFF, Fee 0%
2. Return Created: $50 item
3. Auto-Approved: System auto-approves
4. Auto-Refund: System auto-processes refund
5. Done: Customer notified automatically
Total Time: ~30 seconds
```

### Workflow D: Partial Return (Multiple Items)

```
1. Original Order: 3x Items = $300 total
2. Customer Returns: 1x Item = $100 value
3. Policy: Allow Partial Returns = ON
4. Return Created: $100 item
5. Rest of order: Customer keeps
6. Approve & Refund: $100 (minus fee if applicable)
Total: Customer keeps $200 worth, gets refund
```

---

## Troubleshooting Common Issues

### Issue 1: Can't Find Return in List

**Check:**
```
✓ Correct tenant selected
✓ Return was actually created
✓ Using correct status filter
✓ Browser cache cleared
```

**Solution:**
```
1. Go to /api/returns
2. Verify returns exist
3. Clear browser cache
4. Try different status filter
```

### Issue 2: Refund Amount Not Showing Correctly

**Verify:**
```
✓ Policy fee percentage correct
✓ Item price correct
✓ Math: (Price × Fee%) = Fee Amount
✓ Refund = Price - Fee
```

**Example:**
```
$100 item with 5% fee
Fee: $100 × 0.05 = $5
Refund: $100 - $5 = $95

If showing $100, fee might be 0%
If showing $90, fee might be 10%
```

### Issue 3: Customer Balance Not Updating

**Ensure:**
```
✓ Using "Store Credit" as refund method
✓ Return status is "REFUNDED"
✓ Customer has customer ID in database
✓ Refund was actually processed (not just approved)
```

**To Verify:**
```
Check customer balance:
- Balance before: $50
- Process $100 refund
- Balance after: Should be $150
```

### Issue 4: Can't Approve Return

**Check:**
```
✓ Return exists and is in PENDING status
✓ You have admin privileges
✓ Tenant matches your session
✓ Network connection working
✓ No validation errors
```

---

## Best Practices

### For Return Policy Setup

```
✅ DO:
- Set reasonable return window (14-60 days)
- Consider your business model
- Test with small fee first
- Enable notifications
- Keep records of changes

❌ DON'T:
- Set unrealistic fees (>20%)
- Require approval for all items (friction)
- Disable all customer notifications
- Change policy mid-month without notice
```

### For Processing Returns

```
✅ DO:
- Review details before approving
- Add clear approval/rejection notes
- Process refunds promptly
- Use appropriate refund method
- Keep customers informed

❌ DON'T:
- Approve without reviewing
- Leave blank rejection reasons
- Leave approved returns unprocessed
- Use wrong refund method
- Keep customers in the dark
```

### For Customer Service

```
✅ DO:
- Make return process easy
- Provide clear reasons
- Document condition carefully
- Process within 24-48 hours
- Communicate status

❌ DON'T:
- Make returns difficult
- Leave returns stuck in "pending"
- Argue about conditions
- Take weeks to process
- Ignore customer inquiries
```

---

## Example: Complete Real-World Scenario

### The Scenario
Company sells electronics. Customer bought gaming laptop for $2,000 on Nov 1.

### Day 1: Purchase
```
Customer: Buys laptop online
System: Creates sale, sets status to "Paid"
```

### Day 3: Issue Discovered
```
Customer: Receives laptop, keyboard not working
Customer: Contacts support
Staff: Takes return request
```

### Day 3: Return Created (2:00 PM)
```
API Call: POST /api/returns
{
  "saleId": "sale-12345",
  "customerId": "cust-67890",
  "reason": "Keyboard not functioning, possibly defective",
  "items": [{
    "saleItemId": "item-999",
    "productId": "prod-laptop",
    "productName": "Gaming Laptop RTX 4090",
    "quantity": 1,
    "unitPrice": 2000,
    "condition": "damaged"
  }]
}

Response:
{
  "id": "ret-abc123",
  "status": "pending",
  "totalReturnAmount": 2000,
  "restockingFeeAmount": 100,  // 5% fee
  "refundAmount": 1900,
  "createdAt": "2025-11-03T14:00:00Z"
}

Result:
✅ Return created in PENDING status
✅ Customer notified of return request
```

### Day 4: Admin Reviews (10:00 AM)
```
Admin: Goes to /[tenant]/returns
Admin: Sees return, clicks Details
Admin: Verifies:
  - Original sale date: Nov 1 ✓
  - Within 30-day window: Nov 1-Dec 1 ✓
  - Item cost: $2,000 ✓
  - Condition: damaged (keyboard) ✓
  - Reason: valid (defective) ✓

Admin: Clicks "Approve"
Admin: Adds note: "Verified defective keyboard, customer took photos"
Admin: Clicks "Confirm"

Result:
✅ Return status: APPROVED
✅ Customer notified
```

### Day 4: Process Refund (10:05 AM)
```
Admin: Clicks "Process Refund"
Admin: Modal shows:
  - Refund Amount: $1,900.00
  - Method options appear

Admin: Selects "Card"
  (Reason: Customer paid with credit card)

Admin: Clicks "Confirm"

System:
✓ Updates return status to REFUNDED
✓ Records refund method: card
✓ Sets refundedAt timestamp
✓ Marks return as complete

Result:
✅ Return status: REFUNDED
✅ Refund of $1,900 scheduled for card
✅ Customer notified of refund
```

### Day 7: Customer Receives Refund
```
Customer: $1,900 refund appears in bank account
Customer: Gets pickup/return label in email
Customer: Ships laptop back to warehouse

Business: Receives laptop
Business: Laptop refurbished or scrapped
Business: Cycle complete
```

### Financial Summary
```
Original sale price:        $2,000.00
Restocking fee (5%):       -$100.00
────────────────────────────────────
Customer refund:           $1,900.00
Business keeps:            $100.00
```

---

## API Integration Reference

### Creating Return via API

```bash
curl -X POST http://localhost:9002/api/returns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "saleId": "sale-uuid",
    "customerId": "customer-uuid",
    "reason": "Item defective",
    "items": [
      {
        "saleItemId": "item-uuid",
        "productId": "product-uuid",
        "productName": "Product Name",
        "quantity": 1,
        "unitPrice": 100.00,
        "condition": "damaged"
      }
    ]
  }'
```

### Approving Return

```bash
curl -X PATCH http://localhost:9002/api/returns/[return-id] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "action": "approve",
    "approvalReason": "Verified defective"
  }'
```

### Rejecting Return

```bash
curl -X PATCH http://localhost:9002/api/returns/[return-id] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "action": "reject",
    "rejectionReason": "Outside return window"
  }'
```

### Processing Refund

```bash
curl -X PATCH http://localhost:9002/api/returns/[return-id] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "action": "refund",
    "refundMethod": "cash"
  }'
```

---

## Summary

The return workflow is organized in 4 phases:

| Phase | Action | Owner | Duration |
|-------|--------|-------|----------|
| **Setup** | Configure policy | Admin | One-time |
| **Request** | Create return | Staff/System | Minutes |
| **Review** | Approve/Reject | Admin | Hours |
| **Resolution** | Process refund | Admin/System | Minutes |

**Total typical timeline:** 24-48 hours from request to refund

**Key principle:** All fees are calculated automatically, customer balances update automatically, and workflows follow the configured policy.
