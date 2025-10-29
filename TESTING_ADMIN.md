# Admin Authentication & CRUD Testing Guide

This document provides step-by-step instructions to test the super admin authentication and tenant management system.

## Prerequisites

1. Database is set up and running (PostgreSQL)
2. Environment variables are configured (`.env` file with `DATABASE_URL` and `NEXTAUTH_SECRET`)
3. Application is running (`npm run dev`)

## Step 1: Database Setup

Push the latest schema to the database:

```bash
npm run db:push
```

This creates the `super_admins` table and all related tables.

## Step 2: Create Super Admin Account

Run the seed script to create your first super admin:

```bash
npm run db:seed:admin
```

Follow the prompts:

```
Creating Super Admin...

Enter super admin name: Dr Good
Enter super admin email: drgood@goodsale.com
Enter super admin password: SecurePassword123

✓ Super admin created successfully!
  Name: Dr Good
  Email: drgood@goodsale.com

You can now login at: /admin/login
```

## Step 3: Test Login Flow

1. Navigate to `http://localhost:9002/admin/login` (or your configured port)
2. Enter the email and password created in Step 2
3. Click "Sign In"
4. You should be redirected to `/admin/dashboard`
5. The dashboard should display tenant statistics from the database

### Expected Dashboard Stats:
- Total Tenants: Shows count from database
- Platform Revenue: Sums all tenant totalSales
- Total Users: Sums all tenant userCount
- System Status: Shows "Operational"

## Step 4: Test Tenant CRUD Operations

### Test 1: View All Tenants
1. Navigate to `/admin/tenants`
2. You should see a table of all tenants (empty if no tenants exist)
3. Check that loading state appears briefly while fetching

### Test 2: Create a New Tenant
1. Click "Add Tenant" button
2. Fill in the form:
   - Tenant Name: "Test Shop"
   - Subdomain: "testshop"
   - Plan: "Starter"
3. Click "Create Tenant"
4. Verify:
   - Success toast notification appears
   - New tenant appears in the table
   - Dialog closes automatically
   - Audit log entry is created

### Test 3: Verify Audit Logging
Check the audit logs in your database:

```sql
SELECT * FROM audit_logs WHERE action = 'CREATE_TENANT' ORDER BY timestamp DESC LIMIT 1;
```

Expected output:
- `action`: CREATE_TENANT
- `entity`: tenant
- `entityId`: UUID of created tenant
- `details`: Contains { name, subdomain, plan }

### Test 4: Update Tenant Status
1. In the tenants table, click the three-dot menu for a tenant
2. Select "Suspend"
3. Verify:
   - Toast notification: "Tenant Suspended"
   - Tenant status badge changes to "suspended"
   - Audit log entry created with `action: UPDATE_TENANT`
4. Click menu again and select "Unsuspend"
5. Verify status returns to "active"

### Test 5: Delete Tenant
1. Click the three-dot menu for a tenant
2. Select "Delete"
3. Confirm in the alert dialog
4. Verify:
   - Destructive toast notification appears
   - Tenant is removed from the table
   - Audit log entry created with `action: DELETE_TENANT`

## Step 6: Test Authentication Restrictions

### Test 1: Unauthorized Access
1. Log out (if logout link available)
2. Try to access `/admin/dashboard` directly
3. You should be redirected to `/admin/login`

### Test 2: Protected Routes
Try accessing these routes without authentication:
- `/admin/tenants` → redirects to `/admin/login`
- `/admin/plans` → redirects to `/admin/login`
- `/admin/profile` → redirects to `/admin/login`
- `/admin/settings` → redirects to `/admin/login`

### Test 3: Already Authenticated
1. While logged in as super admin, visit `/admin/login`
2. You should be redirected to `/admin/dashboard`

## Step 7: API Testing (Optional)

Test the API endpoints directly using curl or a tool like Postman:

### Get all tenants
```bash
curl -X GET http://localhost:3000/api/admin/tenants
```

Response:
```json
{
  "data": [
    {
      "id": "...",
      "name": "Test Shop",
      "subdomain": "testshop",
      "plan": "starter",
      "status": "active",
      "createdAt": "...",
      "userCount": 0,
      "productCount": 0,
      "totalSales": "0"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Create tenant (requires authentication)
```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Shop",
    "subdomain": "newshop",
    "plan": "Growth"
  }'
```

### Update tenant
```bash
curl -X PATCH http://localhost:3000/api/admin/tenants/{tenant-id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended"
  }'
```

### Delete tenant
```bash
curl -X DELETE http://localhost:3000/api/admin/tenants/{tenant-id}
```

## Troubleshooting

### Login not working
- Check email and password are correct
- Verify super admin exists: `SELECT * FROM super_admins;`
- Check browser console for JavaScript errors
- Verify NEXTAUTH_SECRET is set in environment

### Dashboard shows no data
- Check database connection is working: `npm run db:studio`
- Verify tenants table exists and has data
- Check browser console for fetch errors

### Audit logs not being created
- Verify `audit_logs` table exists in database
- Check API response includes audit logging (no errors in server logs)
- Query logs: `SELECT * FROM audit_logs ORDER BY timestamp DESC;`

### CORS or authentication errors on API calls
- Ensure middleware.ts exists in project root
- Verify NextAuth session is properly configured
- Check NEXTAUTH_SECRET environment variable is set

## Performance Testing

For testing with larger datasets:

```sql
-- Insert test tenants
INSERT INTO tenants (name, subdomain, plan, status, user_count, product_count, total_sales)
SELECT 
  'Test Shop ' || i,
  'testshop' || i,
  CASE WHEN i % 3 = 0 THEN 'starter' WHEN i % 3 = 1 THEN 'growth' ELSE 'enterprise' END,
  CASE WHEN i % 10 = 0 THEN 'suspended' ELSE 'active' END,
  FLOOR(RANDOM() * 100)::int,
  FLOOR(RANDOM() * 500)::int,
  (RANDOM() * 100000)::numeric(12, 2)
FROM generate_series(1, 100) AS t(i);
```

Then test pagination:
- `/api/admin/tenants?page=1&limit=10`
- `/api/admin/tenants?page=2&limit=10`

## Checklist

- [ ] Database migrations applied successfully
- [ ] Super admin account created
- [ ] Can login at `/admin/login`
- [ ] Dashboard displays real data
- [ ] Can create new tenants
- [ ] Can suspend/unsuspend tenants
- [ ] Can delete tenants
- [ ] Audit logs are being created
- [ ] Unauthorized users redirected to login
- [ ] Authenticated users redirected away from login page
- [ ] All API endpoints respond correctly
- [ ] No console errors in browser
- [ ] No server errors in terminal
