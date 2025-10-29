# Trial Enforcement Implementation Plan

## Overview
Implement a 14-day trial system with immediate hard suspension on expiry, manual payment requirement, and 14-day data retention policy.

---

## Configuration

| Decision | Value |
|----------|-------|
| Trial Length | 14 days |
| Expiry Behavior | Hard suspension (immediate access removal) |
| Free Tier | None (trial + paid only) |
| Auto-Billing | Disabled (manual payment required) |
| Data Retention | 14 days after expiry (then delete) |
| Notification Aggressiveness | Medium (3 notifications: 7d, 3d, 1d before expiry) |

---

## Implementation Phases

### **PHASE 1: Subscription Creation on Signup** ✅ [STEP 1]

**Goal:** Create subscription record when user signs up

**Affected File:** `src/app/api/auth/signup/route.ts`

**Changes:**
1. After creating tenant + user, create subscription record
2. Set trial dates:
   - `startDate`: Current date/time
   - `endDate`: Current date + 14 days
   - `status`: "trial"
   - `amount`: 0
   - `autoRenewal`: false
3. Log this in audit logs

**New Subscription Record:**
```javascript
{
  id: "uuid",
  tenantId: "tenant-uuid",
  planId: "selected-plan-id",
  billingPeriod: "1_month",
  status: "trial",
  startDate: "2025-10-29T08:23:00Z",
  endDate: "2025-11-12T08:23:00Z",  // +14 days
  autoRenewal: false,
  amount: 0.00,
  createdAt: "2025-10-29T08:23:00Z",
  updatedAt: "2025-10-29T08:23:00Z"
}
```

**Database Query:**
```sql
INSERT INTO subscriptions (
  id, tenant_id, plan_id, billing_period, status, 
  start_date, end_date, auto_renewal, amount, created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  'tenant-uuid',
  'plan-id',
  '1_month',
  'trial',
  NOW(),
  NOW() + INTERVAL '14 days',
  false,
  0.00,
  NOW(),
  NOW()
)
```

---

### **PHASE 2: Trial Validation Middleware** ✅ [STEP 2]

**Goal:** Check trial status on every request and block expired trials

**Affected Files:** 
- `src/middleware.ts` (create/update)
- Create: `src/lib/trial-validation.ts`

**What It Does:**
1. Intercept requests to tenant routes (`/[tenant]/*`)
2. Check if tenant's subscription is valid
3. If trial expired → redirect to `/[tenant]/trial-expired`
4. If trial still valid → allow access

**Logic:**
```typescript
// For tenant routes only
if (pathname.startsWith('/(goodsale)/[tenant]')) {
  const session = await getSession()
  if (session?.user?.tenantId) {
    const subscription = await checkSubscription(session.user.tenantId)
    
    if (subscription.status === 'trial' && isPastEndDate(subscription.endDate)) {
      return NextResponse.redirect(new URL(`/${tenant}/trial-expired`, req.url))
    }
  }
}
```

**Performance Consideration:**
- Query subscription status (shouldn't be expensive)
- Cache in session to avoid every-request database hits
- Check on page load, not on every API call

---

### **PHASE 3: Trial Expired Page** ✅ [STEP 3]

**Goal:** Show user that trial has expired and prompt them to upgrade

**New File:** `src/app/(goodsale)/[tenant]/trial-expired/page.tsx`

**Page Content:**
```
┌─────────────────────────────────────────┐
│  ⏰ Your Trial Has Expired               │
│                                          │
│  Your 14-day free trial ended on:       │
│  November 12, 2025                       │
│                                          │
│  Your data is safe and will be kept     │
│  for 14 days. Upgrade now to regain     │
│  access and continue using GoodSale.    │
│                                          │
│  [Upgrade to Business] [View Plans]     │
│                                          │
│  Questions? Contact support@goodsale   │
└─────────────────────────────────────────┘
```

**Features:**
- Show trial end date
- Explain data retention (14 days)
- CTA buttons to upgrade
- Link to plans page
- Support contact info

**Redirect:** After payment → back to dashboard

---

### **PHASE 4: Trial Expiration Notifications** ✅ [STEP 4]

**Goal:** Send email notifications at 7 days, 3 days, and 1 day before expiry

**Affected File:** 
- Create: `src/lib/trial-notifications.ts`
- Create: `src/app/api/cron/trial-notifications/route.ts` (similar to subscription-renewal)

**Email Schedule:**
1. **7 days before expiry:** "Your trial ends in 7 days"
2. **3 days before expiry:** "Your trial ends in 3 days"
3. **1 day before expiry:** "Your trial expires tomorrow"

**Email Content Example (7-day):**
```
Subject: Your GoodSale trial expires in 7 days

Hi John,

Your 14-day free trial is ending on November 12, 2025.

After that date, your account will be suspended and you won't be able to:
- Process sales
- Access inventory
- View reports
- Access customer data

✨ Your data will be kept safe for 14 days.

To keep using GoodSale:
[UPGRADE NOW] 

Need help choosing a plan? [CONTACT SALES]

Best regards,
The GoodSale Team
```

**Cron Job Logic:**
```typescript
// Run daily at 2 AM UTC
// Find subscriptions with:
- status = 'trial'
- endDate is exactly 7 days away OR
- endDate is exactly 3 days away OR  
- endDate is exactly 1 day away

// For each matching subscription:
- Get tenant + user email
- Get notification history to avoid duplicates
- Send appropriate email
- Log in audit
```

---

### **PHASE 5: Trial Expiration & Data Retention** ✅ [STEP 5]

**Goal:** Auto-suspend expired trials and manage data lifecycle

**Affected File:** 
- Create: `src/app/api/cron/trial-expiration/route.ts`

**Cron Job: Trial Expiration Handler**
Runs daily at 3 AM UTC:

**Step 1: Suspend Expired Trials**
```typescript
// Find subscriptions where:
- status = 'trial'
- endDate < NOW()

// For each:
- Update status: 'trial' → 'expired'
- Update suspendedAt: NOW()
- Log: TRIAL_EXPIRED event
- Send email: "Your trial has expired"
```

**Step 2: Archive Data (Day 14)**
```typescript
// Find subscriptions where:
- status = 'expired'
- suspendedAt < (NOW() - 14 days)

// For each:
- Archive all tenant data (create archive)
- Optionally delete data (decision needed)
- Update status: 'expired' → 'archived'
- Log: DATA_ARCHIVED event
```

**Database Updates:**
```sql
-- Suspend expired trials
UPDATE subscriptions
SET status = 'expired', updated_at = NOW()
WHERE status = 'trial' AND end_date < NOW();

-- Archive old data
UPDATE subscriptions
SET status = 'archived', updated_at = NOW()
WHERE status = 'expired' AND updated_at < NOW() - INTERVAL '14 days';
```

**Audit Logs Created:**
```javascript
{
  action: 'TRIAL_EXPIRED',
  entity: 'subscription',
  entityId: 'subscription-id',
  details: {
    tenantId: 'tenant-id',
    endDate: '2025-11-12',
    suspendedAt: NOW()
  }
}
```

---

### **PHASE 6: Trial Status Dashboard Widget** ✅ [STEP 6]

**Goal:** Show users how much trial time remains

**Location:** Tenant dashboard top banner

**Banner Content:**

**Active Trial (8 days remaining):**
```
┌────────────────────────────────────────────────────────────┐
│ ✨ Trial Active: 8 days remaining | [Upgrade Now] [Dismiss] │
└────────────────────────────────────────────────────────────┘
```

**Active Trial (3 days remaining - urgent):**
```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  URGENT: Trial ends in 3 days | [UPGRADE NOW] [Learn More] │
└────────────────────────────────────────────────────────────┘
```

**Calculation:**
```typescript
const daysRemaining = Math.ceil(
  (subscription.endDate - now()) / (1000 * 60 * 60 * 24)
)

if (daysRemaining > 3) {
  return 'info' // Blue banner
} else if (daysRemaining > 0) {
  return 'warning' // Orange banner
} else {
  return 'expired' // Red banner
}
```

---

### **PHASE 7: Upgrade Flow** ✅ [STEP 7]

**Goal:** Enable users to upgrade from trial to paid plan

**Affected Files:**
- Update: `src/app/(goodsale)/[tenant]/billing/page.tsx`
- Create: `src/app/api/subscriptions/upgrade/route.ts`

**Upgrade Endpoint:**
```
POST /api/subscriptions/upgrade

Body:
{
  tenantId: "tenant-id",
  newPlanId: "plan-id",
  billingPeriod: "1_month"  // or "6_months", "12_months", "24_months"
}
```

**What Happens:**
1. Validate new plan exists
2. Calculate pro-rata credit (unused trial days)
3. Create invoice for remaining days
4. Update subscription:
   - `status`: 'trial' → 'active'
   - `planId`: old plan → new plan
   - `endDate`: today + billing period
   - `amount`: new plan price
5. Log: SUBSCRIPTION_UPGRADED
6. Send confirmation email

**Example:**
```
Trial ended: Nov 12, 2025
Today: Nov 5, 2025 (7 days remaining)
Original plan: Starter ($29/month)
New plan: Business ($79/month)

Calculation:
- New plan for 30 days: $79
- Credit for unused trial (7 days): -$18.37
- Amount due: $60.63
```

---

## Database Changes Required

### Subscriptions Table (Already Exists - No Changes Needed)
All fields already present:
- `status` (will use 'trial', 'active', 'expired', 'archived', 'canceled')
- `startDate` / `endDate` (will be set on signup)
- `amount` (will be 0 for trial)
- `autoRenewal` (will be false)

### New Column (Optional - Recommend Adding)
```sql
ALTER TABLE subscriptions ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
-- Tracks when trial was suspended, used for 14-day retention calculation
```

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── signup/ → MODIFIED (create subscription on signup)
│   ├── (goodsale)/
│   │   └── [tenant]/
│   │       ├── trial-expired/ → NEW PAGE
│   │       └── billing/ → UPDATED (add upgrade flow)
│   ├── api/
│   │   ├── auth/
│   │   │   └── signup/ → MODIFIED
│   │   ├── cron/
│   │   │   ├── trial-notifications/ → NEW ROUTE
│   │   │   └── trial-expiration/ → NEW ROUTE
│   │   └── subscriptions/
│   │       └── upgrade/ → NEW ROUTE
│   └── middleware.ts → UPDATED (trial validation)
├── lib/
│   ├── trial-validation.ts → NEW
│   ├── trial-notifications.ts → NEW
│   └── auth.ts → UNCHANGED
└── db/
    └── schema.ts → UNCHANGED (all fields exist)
```

---

## Cron Jobs Required

### 1. Trial Notifications (Daily, 2 AM UTC)
**Endpoint:** POST `/api/cron/trial-notifications`
**Authorization:** Bearer {CRON_SECRET}
**Frequency:** Daily at 2:00 AM UTC
**Action:** Send 7-day, 3-day, 1-day reminder emails

### 2. Trial Expiration (Daily, 3 AM UTC)
**Endpoint:** POST `/api/cron/trial-expiration`
**Authorization:** Bearer {CRON_SECRET}
**Frequency:** Daily at 3:00 AM UTC
**Action:** Suspend expired trials, archive old data

---

## Testing Checklist

- [ ] Signup creates subscription with correct trial dates
- [ ] Trial status shows on dashboard (days remaining)
- [ ] Middleware blocks access after trial expires
- [ ] Trial-expired page displays correctly
- [ ] Notification emails sent at 7, 3, 1 days
- [ ] Trial suspension happens at correct time
- [ ] Data archived after 14 days
- [ ] Upgrade flow works and updates subscription
- [ ] Audit logs created for all events
- [ ] Hard suspension prevents all tenant access (API calls)
- [ ] Reopening browser still shows trial-expired
- [ ] Support can manually extend trial if needed

---

## Future Enhancements

🔜 **Phase 2 Features:**
- [ ] Freemium tier (limited free access)
- [ ] Auto-billing after trial
- [ ] One-click payment integration (Stripe/PayPal)
- [ ] Trial extension (admin override)
- [ ] Soft suspend (read-only access) before hard suspend
- [ ] Graceful degradation (some features work, some locked)
- [ ] Data export before suspension
- [ ] Re-activation after payment

---

## Implementation Order

1. **STEP 1:** Modify signup to create subscription ⏱️ 30 min
2. **STEP 2:** Add trial validation middleware ⏱️ 45 min
3. **STEP 3:** Create trial-expired page ⏱️ 30 min
4. **STEP 4:** Implement trial notifications cron ⏱️ 1 hour
5. **STEP 5:** Implement trial expiration cron ⏱️ 1 hour
6. **STEP 6:** Add dashboard trial widget ⏱️ 30 min
7. **STEP 7:** Create upgrade flow ⏱️ 1.5 hours

**Total Estimated Time:** 5-6 hours

---

## Configuration Needed

Add to `.env.local`:
```
# Trial Configuration
TRIAL_DURATION_DAYS=14
TRIAL_DATA_RETENTION_DAYS=14
TRIAL_NOTIFICATION_DAYS="7,3,1"
CRON_SECRET=your-secret-here
```

---

**Status:** Ready to implement 🚀  
**Created:** October 29, 2025  
**Version:** 1.0
