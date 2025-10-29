# Cash Billing & Flexible Subscription System

## Overview

A complete cash-based billing system with flexible subscription periods (1, 6, 12, or 24 months) has been implemented. This allows you to:

- Record cash payments from face-to-face meetings
- Support annual and multi-year subscriptions with volume discounts
- Track all billing transactions with audit logs
- Generate invoices for each payment
- Manage subscriptions per tenant with flexible billing periods

## Database Schema

### 1. **Subscriptions Table** (`subscriptions`)
Tracks active subscriptions for each tenant.

```sql
- id (UUID, primary key)
- tenantId (UUID, references tenants)
- planId (UUID, references plans)
- billingPeriod (varchar): "1_month", "6_months", "12_months", "24_months"
- status (varchar): "active", "canceled", "expired", "suspended"
- startDate (timestamp)
- endDate (timestamp)
- autoRenewal (boolean, default: false)
- amount (numeric) - total amount for this subscription period
- createdAt, updatedAt (timestamps)
```

### 2. **Billing Ledger Table** (`billing_ledger`)
Records all cash and other payments.

```sql
- id (UUID, primary key)
- tenantId (UUID, references tenants)
- subscriptionId (UUID, references subscriptions)
- amount (numeric)
- paymentMethod (varchar): "cash", "card", "mobile_money", "bank_transfer"
- status (varchar): "completed", "pending", "failed"
- invoiceNumber (varchar, unique)
- notes (text)
- recordedBy (UUID, references superAdmins)
- paidAt (timestamp)
- createdAt (timestamp)
```

### 3. **Plan Pricing Table** (`planPricing`)
Different prices for different billing periods with discount support.

```sql
- id (UUID, primary key)
- planId (UUID, references plans)
- billingPeriod (varchar): "1_month", "6_months", "12_months", "24_months"
- price (numeric) - price for this billing period
- discountPercent (numeric) - e.g., 10 for 10% discount on yearly
- createdAt (timestamp)
```

**Example Pricing:**
- 1 month: GH₵199
- 6 months: GH₵1,050 (10% discount = ~GH₵175/month)
- 12 months: GH₵1,900 (20% discount = ~GH₵158/month)
- 24 months: GH₵3,400 (28% discount = ~GH₵141/month)

## API Endpoints

### 1. **Record Cash Payment**
**POST** `/api/admin/billing`

Request body:
```json
{
  "tenantId": "uuid",
  "planId": "uuid",
  "billingPeriod": "12_months",
  "amount": "1900",
  "paymentMethod": "cash",
  "invoiceNumber": "INV-2024-001",
  "notes": "Payment for Annual Plan",
  "paidAt": "2024-01-15T10:30:00Z"
}
```

Response: `201 Created`
```json
{
  "billing": {
    "id": "uuid",
    "tenantId": "uuid",
    "subscriptionId": "uuid",
    "amount": "1900.00",
    "paymentMethod": "cash",
    "invoiceNumber": "INV-2024-001",
    "status": "completed",
    "paidAt": "2024-01-15T10:30:00Z"
  },
  "subscription": {
    "id": "uuid",
    "tenantId": "uuid",
    "billingPeriod": "12_months",
    "status": "active",
    "startDate": "2024-01-15T10:30:00Z",
    "endDate": "2025-01-15T10:30:00Z",
    "amount": "1900.00"
  }
}
```

### 2. **List All Payments**
**GET** `/api/admin/billing?page=1&limit=20&tenantId=xxx`

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `tenantId`: Optional filter by specific tenant

Response: `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "tenantName": "Shop Name",
      "amount": "1900.00",
      "paymentMethod": "cash",
      "invoiceNumber": "INV-2024-001",
      "status": "completed",
      "paidAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 3. **Manage Plan Pricing**
**GET** `/api/admin/plan-pricing?planId=xxx`

Get all pricing for a plan:
```json
{
  "data": [
    {
      "id": "uuid",
      "planId": "uuid",
      "billingPeriod": "1_month",
      "price": "199.00",
      "discountPercent": "0"
    },
    {
      "id": "uuid",
      "planId": "uuid",
      "billingPeriod": "12_months",
      "price": "1900.00",
      "discountPercent": "20"
    }
  ]
}
```

**POST** `/api/admin/plan-pricing`

Create or update pricing:
```json
{
  "planId": "uuid",
  "billingPeriod": "24_months",
  "price": "3400",
  "discountPercent": "28"
}
```

Response: `201 Created` with created/updated pricing record

## Setup Instructions

### 1. Run Database Migration
```bash
npm run migrate
# or
npm run db:push
```

This creates:
- `subscriptions` table
- `billing_ledger` table
- `planPricing` table

### 2. Set Up Initial Plan Pricing

After creating plans in the admin panel, add pricing for each billing period:

```bash
curl -X POST http://localhost:3000/api/admin/plan-pricing \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN" \
  -d '{
    "planId": "PLAN_UUID",
    "billingPeriod": "1_month",
    "price": "199",
    "discountPercent": "0"
  }'

curl -X POST http://localhost:3000/api/admin/plan-pricing \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN" \
  -d '{
    "planId": "PLAN_UUID",
    "billingPeriod": "12_months",
    "price": "1900",
    "discountPercent": "20"
  }'
```

## Billing Workflow

```
1. Customer Meeting
   ├─ Admin meets tenant face-to-face
   ├─ Agrees on plan and billing period (1, 6, 12, or 24 months)
   └─ Accepts cash payment

2. Record Payment in Admin Panel
   ├─ Select tenant and plan
   ├─ Choose billing period
   ├─ System calculates price based on planPricing
   ├─ Record cash payment with invoice number
   └─ Payment creates subscription record

3. System Creates Subscription
   ├─ Status set to "active"
   ├─ Start date = payment date
   ├─ End date = start date + billing period
   ├─ Tenant gets full access for agreed period
   └─ Payment logged in audit_logs

4. Automatic Expiry (Future)
   ├─ Cron job checks expiring subscriptions daily
   ├─ At expiry date, status changes to "expired"
   ├─ Tenant gets notification to renew
   └─ If autoRenewal=true, new subscription created (if configured)
```

## Admin Billing Management

### Recording a Cash Payment

1. Navigate to Admin → Billing (UI - not yet built)
2. Click "Record Payment"
3. Select tenant
4. Choose plan
5. Select billing period (1/6/12/24 months)
6. System displays: `GH₵1,900 for 12 months (20% discount)`
7. Confirm cash received
8. Generate invoice number (e.g., INV-2024-001)
9. Add optional notes
10. Submit payment

### Viewing Billing History

1. Navigate to Admin → Billing
2. View all payments with:
   - Tenant name
   - Amount paid
   - Billing period
   - Payment method
   - Invoice number
   - Payment date
   - Recording admin

3. Filter by tenant or date range
4. Download reports

## Tenant Billing View (Future)

Tenants should be able to see:
- Current subscription plan
- Billing period and end date
- Amount paid
- Invoice history with download option
- Option to upgrade/downgrade plan
- Renewal reminder (30 days before expiry)

## Revenue Calculations

### Example Annual Breakdown
Assuming 10 tenants on different plans:

```
Starter Plan (GH₵199/month):
- 3 tenants on 1-month = GH₵597/month
- 2 tenants on 12-months = GH₵3,800 (once/year)

Professional Plan (GH₵499/month):
- 2 tenants on 6-months = GH₵2,990 (twice/year)
- 2 tenants on 24-months = GH₵9,580 (once per 2 years)

Premium Plan (GH₵999/month):
- 1 tenant on 12-months = GH₵9,590 (once/year)

Monthly recurring: GH₵597
Annual special: GH₵3,800 + GH₵9,590 = GH₵13,390
```

## Key Features

✅ **Cash Payment Recording**
- No payment gateway required
- Simple form-based entry
- Invoice number generation
- Notes for reference

✅ **Flexible Billing Periods**
- 1 month, 6 months, 12 months, 24 months
- Configurable discounts per period
- Automatic date calculations

✅ **Subscription Management**
- Track subscription status
- Automatic renewal flag
- Subscription expiry dates
- Auto-suspension on expiry

✅ **Audit Logging**
- All payments logged
- Admin who recorded payment tracked
- Payment details stored
- Full transaction history

✅ **Multi-Payment Methods**
- Cash (primary)
- Card (future)
- Mobile Money (future)
- Bank Transfer (future)

## Future Enhancements

### 1. Tenant Billing Portal
- View current subscription
- Download invoices
- See payment history
- Request upgrades/downgrades

### 2. Automatic Expiry Management
- Cron job to check expiry dates daily
- Send renewal reminders 30 days before expiry
- Auto-suspend on expiry
- Auto-renewal with new payment (if enabled)

### 3. Invoice Generation
- PDF invoice generation
- Email invoices to tenants
- Invoice templates customization
- Tax calculation (if applicable)

### 4. Payment Methods Integration
- Stripe for card payments
- Flutterwave for mobile money
- Bank account integration

### 5. Analytics & Reporting
- Revenue by plan
- Revenue by billing period
- Churn rate analysis
- Forecasting

### 6. Discounts & Promotions
- Coupon codes
- First-time customer discount
- Seasonal promotions
- Loyalty discounts

## Testing

### Manual Testing

```bash
# 1. Create a plan pricing
curl -X POST http://localhost:3000/api/admin/plan-pricing \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "planId": "PLAN_ID",
    "billingPeriod": "12_months",
    "price": "1900",
    "discountPercent": "20"
  }'

# 2. Record a payment
curl -X POST http://localhost:3000/api/admin/billing \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "tenantId": "TENANT_ID",
    "planId": "PLAN_ID",
    "billingPeriod": "12_months",
    "amount": "1900",
    "paymentMethod": "cash",
    "invoiceNumber": "INV-001",
    "notes": "Payment collected in person"
  }'

# 3. View billing records
curl http://localhost:3000/api/admin/billing \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 4. Get plan pricing
curl "http://localhost:3000/api/admin/plan-pricing?planId=PLAN_ID" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

## Database Queries

### Check active subscriptions
```sql
SELECT s.*, t.name as tenant_name, p.name as plan_name
FROM subscriptions s
JOIN tenants t ON s.tenant_id = t.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY s.end_date;
```

### Revenue report by billing period
```sql
SELECT 
  s.billing_period,
  COUNT(*) as count,
  SUM(CAST(bl.amount AS FLOAT)) as total_amount
FROM billing_ledger bl
JOIN subscriptions s ON bl.subscription_id = s.id
WHERE bl.status = 'completed'
GROUP BY s.billing_period
ORDER BY s.billing_period;
```

### Get tenant's billing history
```sql
SELECT bl.*, s.billing_period, p.name as plan_name
FROM billing_ledger bl
JOIN subscriptions s ON bl.subscription_id = s.id
JOIN plans p ON s.plan_id = p.id
WHERE bl.tenant_id = 'TENANT_ID'
ORDER BY bl.paid_at DESC;
```

## Files Created/Modified

**Created:**
- `src/app/api/admin/billing/route.ts` - Billing transaction endpoints
- `src/app/api/admin/plan-pricing/route.ts` - Plan pricing management

**Modified:**
- `src/db/schema.ts` - Added subscriptions, billingLedger, planPricing tables

**Still Needed:**
- Admin billing management UI
- Tenant billing portal UI
- Invoice generation
- Renewal automation

## Support

For issues:
1. Check audit logs for payment records
2. Verify plan pricing exists for billing period
3. Check subscription dates
4. Review error messages in server logs
