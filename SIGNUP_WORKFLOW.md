# New Tenant Signup Workflow - Complete Flow

## Overview
When a new tenant successfully signs up on GoodSale, they go through a multi-step process involving frontend validation, API processing, database operations, authentication, and finally dashboard access.

---

## Step-by-Step Workflow

### **1️⃣ SIGNUP PAGE LOAD** 
**Location:** `src/app/(auth)/signup/page.tsx`

**What Happens:**
- User navigates to `/signup`
- React component loads with signup form
- Form fetches available plans via `/api/plans` endpoint
- Default plan is selected (first plan from database)
- Form displays:
  - Personal Details: Name, Email, Password
  - Shop Details: Shop Name, Subdomain, Plan Selection

**UI Components:**
- Text inputs for name, email, password, shop name, subdomain
- Dropdown select for subscription plans
- "Create Account" button (submits form)
- Link to login page for existing users

---

### **2️⃣ FORM VALIDATION (Client-Side)**
**Location:** `src/app/(auth)/signup/page.tsx` → `handleSignup()` function

**Validations Performed:**
```
✓ All fields are filled
✓ Password is at least 8 characters long
✓ Subdomain is sanitized (lowercase, alphanumeric only)
✓ Email format is valid (HTML5 input type="email")
✓ Plan is selected
```

**If Validation Fails:**
- Error message displays in red banner
- Form remains open for correction
- Submit button re-enables after user makes changes

**If Validation Passes:**
- Proceed to API call
- Loading state activated (button shows "Creating Account...")
- Form inputs disabled while processing

---

### **3️⃣ API SIGNUP CALL**
**Location:** `src/app/api/auth/signup/route.ts` (POST endpoint)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "shopName": "John's Retail Store",
  "subdomain": "johnsstore",
  "planId": "plan-uuid-here"
}
```

---

### **4️⃣ SERVER-SIDE VALIDATION** 
**Location:** `src/app/api/auth/signup/route.ts`

**Validations Performed:**
```
✓ All required fields present
✓ Password is at least 8 characters
✓ Subdomain is unique (no existing tenant with same subdomain)
  → SQL: SELECT * FROM tenants WHERE subdomain = ?
✓ Email is unique (no existing user with same email)
  → SQL: SELECT * FROM users WHERE email = ?
```

**If Validation Fails:**
- Return HTTP 400 with error message
- Example errors:
  - "Subdomain is already taken"
  - "Email is already in use"
  - "All fields are required"

**If Validation Passes:**
- Proceed to database operations

---

### **5️⃣ DATABASE OPERATIONS - TENANT CREATION**
**Location:** `src/app/api/auth/signup/route.ts`

**Step A: Create Tenant Record**
```typescript
INSERT INTO tenants (id, name, subdomain, plan, status, created_at)
VALUES (
  uuid(),
  "John's Retail Store",
  "johnsstore",
  "plan-uuid",
  "active",
  NOW()
)
```

**Tenant Record Structure:**
```javascript
{
  id: "tenant-uuid-xxx",           // Auto-generated UUID
  name: "John's Retail Store",     // Shop name from form
  subdomain: "johnsstore",         // Immutable subdomain (per requirements)
  plan: "plan-uuid",               // Selected plan ID
  status: "active",                // Active by default
  createdAt: 2025-10-29T07:04:59Z,
  userCount: 0,                    // Will increment as users are added
  productCount: 0,                 // Will increment as products are added
  totalSales: 0.00,                // Incremented with sales
  pendingNameChangeId: null        // For future name change requests
}
```

**If Tenant Creation Fails:**
- Return HTTP 500 "Failed to create tenant"
- Client receives error

---

### **6️⃣ DATABASE OPERATIONS - USER CREATION**
**Location:** `src/app/api/auth/signup/route.ts`

**Step B: Hash Password**
```typescript
const hashedPassword = await hash(password, 10) // bcryptjs with 10 salt rounds
```

**Step C: Create User Record**
```typescript
INSERT INTO users (id, tenant_id, name, email, password, role, status, created_at)
VALUES (
  uuid(),
  "tenant-uuid-xxx",
  "John Doe",
  "john@example.com",
  "$2a$10$hashedPasswordHere...",
  "owner",
  "active",
  NOW()
)
```

**User Record Structure:**
```javascript
{
  id: "user-uuid-xxx",
  tenantId: "tenant-uuid-xxx",     // Foreign key to tenant
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",     // Never stored in plain text
  role: "owner",                   // First user is always "owner"
  avatarUrl: null,                 // Can be set later in settings
  status: "active",
  lastLogin: null,                 // Filled on first login
  createdAt: 2025-10-29T07:04:59Z
}
```

**If User Creation Fails:**
- Return HTTP 500 "Failed to create user"
- Tenant exists but user wasn't created (data inconsistency - should rollback)

---

### **7️⃣ AUDIT LOGGING**
**Location:** `src/app/api/auth/signup/route.ts`

**Audit Log Entry Created:**
```typescript
INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, details, timestamp)
VALUES (
  uuid(),
  "user-uuid-xxx",
  "John Doe",
  "TENANT_SIGNUP",
  "tenant",
  "tenant-uuid-xxx",
  {
    "tenantName": "John's Retail Store",
    "subdomain": "johnsstore",
    "email": "john@example.com"
  },
  NOW()
)
```

**Purpose:** Track all signup events for compliance and analytics

**If Audit Fails:**
- Error is caught and logged but doesn't fail signup
- Signup completes successfully even if audit log fails

---

### **8️⃣ API RESPONSE - SUCCESS**
**Location:** `src/app/api/auth/signup/route.ts`

**HTTP 201 Response:**
```json
{
  "id": "tenant-uuid-xxx",
  "name": "John's Retail Store",
  "subdomain": "johnsstore",
  "userId": "user-uuid-xxx"
}
```

---

### **9️⃣ AUTO-LOGIN (NextAuth)**
**Location:** `src/app/(auth)/signup/page.tsx` → After API response

**Process:**
```typescript
await signIn('credentials', {
  email: "john@example.com",
  password: "securePassword123",
  redirect: false  // Don't redirect automatically
})
```

**What Happens in NextAuth:**
1. Calls `/api/auth/callback/credentials`
2. Triggers `CredentialsProvider.authorize()` in `src/lib/auth.ts`
3. Fetches user from database using email
4. Compares provided password with hashed password using bcryptjs
5. If valid, creates JWT token with user data:
   ```javascript
   {
     id: "user-uuid-xxx",
     email: "john@example.com",
     name: "John Doe",
     role: "owner",
     tenantId: "tenant-uuid-xxx",
     avatarUrl: null,
     isSuperAdmin: false
   }
   ```
6. Token stored in session (JWT by default, can use cookies)
7. Session callback enriches token with additional user data

---

### **🔟 TOAST NOTIFICATION & REDIRECT**
**Location:** `src/app/(auth)/signup/page.tsx`

**Toast Message Displayed:**
```
✓ "Account Created!"
  "Welcome to GoodSale! Signing you in now."
```

**Redirect Executed:**
```typescript
router.push(`/${result.subdomain}/dashboard`)
// Redirects to: /johnsstore/dashboard
```

**Note:** Dashboard page doesn't exist yet - this would be the next step

---

### **1️⃣1️⃣ ERROR HANDLING**

**Possible Errors at Each Stage:**

| Stage | Error | Status | Message |
|-------|-------|--------|---------|
| Form Validation | Empty fields | 400 | "All fields are required" |
| Form Validation | Short password | 400 | "Password must be at least 8 characters" |
| API Validation | Duplicate subdomain | 400 | "Subdomain is already taken" |
| API Validation | Duplicate email | 400 | "Email is already in use" |
| DB - Tenant | Insert failure | 500 | "Failed to create tenant" |
| DB - User | Insert failure | 500 | "Failed to create user" |
| Auth | Invalid credentials | 401 | Redirect to `/login` |
| General | Unexpected error | 500 | "Failed to create account" |

**Error Display:**
- Red banner at top of form
- Error persists until user modifies form or closes/reopens page
- Toast notification also displays (variant: 'destructive')

---

## Database State After Successful Signup

### Tenants Table
```sql
INSERT INTO tenants (id, name, subdomain, plan, status, created_at)
SELECT 'tenant-uuid', "John's Retail Store", 'johnsstore', 'plan-uuid', 'active', NOW();
```

### Users Table
```sql
INSERT INTO users (id, tenant_id, name, email, password, role, status, created_at)
SELECT 'user-uuid', 'tenant-uuid', 'John Doe', 'john@example.com', '$2a$10$...', 'owner', 'active', NOW();
```

### Audit Logs Table
```sql
INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, details, timestamp)
SELECT 'log-uuid', 'user-uuid', 'John Doe', 'TENANT_SIGNUP', 'tenant', 'tenant-uuid', {...}, NOW();
```

---

## What DOESN'T Happen Yet

❌ **No subscription created** - User needs to activate in billing  
❌ **No settings initialized** - Defaults are used  
❌ **No default products/categories** - User creates these manually  
❌ **No welcome email** - Could be added in future  
❌ **No onboarding flow** - User lands directly on dashboard  
❌ **No billing ledger** - Created only after first payment  

---

## Security Considerations

✅ **Password Hashing:** bcryptjs with 10 salt rounds  
✅ **Email Validation:** Both client and server-side  
✅ **Subdomain Uniqueness:** Enforced at database level (unique constraint)  
✅ **Email Uniqueness:** Enforced at database level (unique constraint)  
✅ **Immutable Subdomain:** Per business requirements, never changes  
✅ **Session Security:** JWT tokens with NextAuth  
✅ **HTTPS Only:** Should be enforced in production  
✅ **CSRF Protection:** NextAuth handles automatically  

---

## Authentication Flow Details

### JWT Token Structure (via NextAuth)
```javascript
{
  id: "user-uuid",
  email: "john@example.com",
  name: "John Doe",
  role: "owner",
  tenantId: "tenant-uuid",
  avatarUrl: null,
  isSuperAdmin: false,
  iat: 1730194699,    // issued at
  exp: 1730281099,    // expires at (24 hours later)
  jti: "jwt-id"
}
```

### Session Object Available in App
```javascript
session = {
  user: {
    id: "user-uuid",
    email: "john@example.com",
    name: "John Doe",
    role: "owner",
    tenantId: "tenant-uuid",
    avatarUrl: null,
    isSuperAdmin: false
  },
  expires: "2025-10-30T07:04:59.000Z"
}
```

---

## Next Steps After Login

**Typical User Journey:**
1. ✅ Signup page - COMPLETED
2. ✅ Auto-login - COMPLETED
3. → Redirect to `/[tenant]/dashboard` - (Page needs to be created)
4. → Onboarding flow (optional feature)
5. → Create first product
6. → Configure POS settings
7. → Add team members
8. → Process first sale
9. → Access billing/subscription page

---

## Files Involved in Signup Process

| File | Purpose |
|------|---------|
| `src/app/(auth)/signup/page.tsx` | Signup form UI & client-side logic |
| `src/app/api/auth/signup/route.ts` | Tenant & user creation API |
| `src/lib/auth.ts` | NextAuth configuration & JWT handling |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth router |
| `src/db/schema.ts` | Database schema definitions |
| `src/db/index.ts` | Database connection (Drizzle ORM) |

---

## Configuration Files

- `next.config.js` - Next.js configuration
- `middleware.ts` - Route protection & redirects
- `.env.local` - Database URL, NextAuth secret, etc.

---

**Last Updated:** October 29, 2025  
**Version:** 1.0  
**Status:** Complete workflow documented ✅
