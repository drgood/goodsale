# Return Policy System - Quick Start Guide

## 🎯 What's Been Built

A complete **return management system** with:
- Database tables for storing policies and returns
- REST APIs for creating/managing returns
- Automatic fee calculations
- Approval workflow
- Refund processing with customer balance updates

## 🚀 Quick Start

### 1. Set Your Tenant's Return Policy

```bash
curl -X POST http://localhost:9002/api/return-policies \
  -H "Content-Type: application/json" \
  -d '{
    "returnWindowDays": 30,
    "refundMethod": "both",
    "restockingFeePercent": 10,
    "requiresApproval": true,
    "allowPartialReturns": true,
    "notifyCustomer": true
  }'
```

**Configuration Options:**
- `returnWindowDays`: Number of days customers can return items (e.g., 30)
- `refundMethod`: "original" (refund to original payment), "store_credit" (credit), "both" (choice)
- `restockingFeePercent`: Fee applied to returns (e.g., 10 = 10%)
- `requiresApproval`: If true, admin must approve returns before refunding
- `allowPartialReturns`: If false, customers must return entire order
- `notifyCustomer`: If true, send notifications to customers

### 2. Create a Return Request

```bash
curl -X POST http://localhost:9002/api/returns \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "your-sale-id",
    "customerId": "customer-id",
    "reason": "Product arrived damaged",
    "items": [
      {
        "saleItemId": "sale-item-id",
        "productId": "product-id",
        "productName": "Laptop",
        "quantity": 1,
        "unitPrice": 1500.00,
        "condition": "damaged"
      }
    ]
  }'
```

**Item Conditions:**
- "like_new" - Unopened, unused
- "good" - Minimal wear
- "fair" - Some wear/marks
- "damaged" - Significant damage

### 3. Approve the Return

```bash
curl -X PATCH http://localhost:9002/api/returns/return-id \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "approvalReason": "Damage verified"
  }'
```

### 4. Process the Refund

```bash
curl -X PATCH http://localhost:9002/api/returns/return-id \
  -H "Content-Type: application/json" \
  -d '{
    "action": "refund",
    "refundMethod": "cash"
  }'
```

**Refund Methods:**
- "cash" - Physical cash payment
- "card" - Back to original card
- "mobile" - Mobile money transfer
- "store_credit" - Store credit/voucher

## 📊 API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/return-policies` | GET | Fetch current policy |
| `/api/return-policies` | POST | Create/update policy |
| `/api/returns` | GET | List all returns |
| `/api/returns` | POST | Create new return |
| `/api/returns/[id]` | GET | View return details |
| `/api/returns/[id]` | PATCH | Update return (approve/reject/refund) |

## 🔄 Return Status Flow

```
PENDING (Created)
    ↓
    ├─→ APPROVED (Admin approves)
    │       ↓
    │   REFUNDED (Refund processed)
    │
    └─→ REJECTED (Admin rejects)
    
    └─→ CANCELLED (Canceled by user)
```

## 💰 How Refunds Work

When you process a refund:

1. **Calculate totals:**
   - Total return value = sum of (quantity × price) for all items
   - Restocking fee = total × restockingFeePercent / 100
   - **Refund amount = total - restocking fee**

2. **Process refund:**
   - Mark return as "refunded"
   - Record refund method and timestamp
   - Update customer's account balance (if credit)

3. **Example:**
   - Sale value: $100
   - Return items: All items worth $100
   - Policy: 10% restocking fee
   - Fee: $10
   - **Customer receives: $90**

## 🛠️ Integration Points

### With Sales
- Returns are linked to specific sales
- Can only return items from existing sales
- Sale items are referenced in returns

### With Customers
- Customer balance updated on refund
- Can view all their returns
- Notifications sent when enabled

### With Products
- Product information preserved in return
- Can track return reasons by product
- Stock can be updated when item received

## 📝 Database Tables

### return_policies
Stores your store's return rules (one per tenant)

### returns
Tracks each return request with all details

### return_items
Lists individual items in each return

## 🔐 Security Features

✅ **Multi-tenant isolation** - Each tenant's data is separate  
✅ **Authorization checks** - Only authenticated users can access  
✅ **Validation** - All inputs validated before processing  
✅ **Foreign keys** - Database enforces data integrity  

## 📋 Testing Your Setup

### 1. Verify Policy is Created
```bash
curl http://localhost:9002/api/return-policies
```

Should return your policy settings.

### 2. Create a Test Return
Use the "Create a Return Request" example above.

### 3. Verify Return Was Created
```bash
curl http://localhost:9002/api/returns
```

Should show your test return in pending status.

### 4. Complete the Workflow
- Approve it
- Process refund
- Verify customer balance updated

## 🎨 Next Steps: UI Development

When you're ready to add the user interface:

1. **Settings Page** - Let admins configure policies
   - Path: `/[tenant]/settings/return-policy`
   - Uses POST /api/return-policies

2. **Returns Dashboard** - List and manage returns
   - Path: `/[tenant]/returns`
   - Uses GET /api/returns

3. **Return Details** - View and approve individual returns
   - Path: `/[tenant]/returns/[id]`
   - Uses GET and PATCH /api/returns/[id]

## ❓ Common Scenarios

### Scenario 1: Damaged Item
```
1. Customer requests return (reason: "damaged")
2. Admin reviews and approves
3. Customer is refunded (if policy allows)
4. Balance updated for future transactions
```

### Scenario 2: 30-Day Return Window
```
1. Customer has 30 days to request return
2. After 30 days, returns should be rejected
3. Admin sees return window in data
```

### Scenario 3: Multiple Items
```
1. Sale had 3 items
2. Customer returns 2 items (partial return)
3. Refund calculated for 2 items only
4. Balance updated accordingly
```

## 📞 API Error Responses

**401 Unauthorized** - Not logged in or session expired  
**400 Bad Request** - Missing required fields or invalid data  
**404 Not Found** - Return doesn't exist  
**500 Server Error** - Database or server issue

## 📚 Full Documentation

See `RETURN_POLICY_IMPLEMENTATION.md` for:
- Complete database schema
- All API parameters and responses
- Query function reference
- Integration with other systems
- Validation rules

## 🚀 Deployment Checklist

- ✅ Database tables created
- ✅ API endpoints tested
- ✅ Code passes linting
- ✅ TypeScript compiles
- ✅ Ready for production

## 🐛 Troubleshooting

**Return not created?**
- Verify sale exists
- Check tenantId is correct
- Include at least one item

**Can't approve return?**
- Verify return status is "pending"
- Check user is authenticated
- Confirm return belongs to your tenant

**Customer balance not updating?**
- Process refund (not just approve)
- Verify customer exists
- Check customer ID is correct

## 💡 Tips

1. **Test the full workflow** - Create → Approve → Refund
2. **Use Postman** - Easier to test APIs with collections
3. **Check database** - Verify data is being saved
4. **Monitor logs** - Look for error messages
5. **Start simple** - Test with one item returns first

## 📈 Ready for Production?

Yes! The system is:
- ✅ Fully functional
- ✅ Tested and validated
- ✅ Secure and authorized
- ✅ Database migrated
- ✅ Error handling included
- ✅ Performance optimized

Next step: Build the UI or start accepting returns!
