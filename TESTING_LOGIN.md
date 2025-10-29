# 🧪 Super Admin Login Testing Guide

Quick guide to test the super admin login and dashboard.

## 📋 Prerequisites

Before testing, ensure you have:
1. ✅ Database setup (`npm run db:push`)
2. ✅ Super admin created or ready to create
3. ✅ Development server ready to run

## 🚀 Quick Start (2 minutes)

### Step 1: Push Database Schema
```bash
npm run db:push
```

### Step 2: Seed Test Data (Recommended)
This creates super admin, plans, and test tenants automatically:

```bash
npm run db:seed:test
```

**What gets created:**
- Super Admin: `admin@goodsale.com` / `SecurePassword123`
- 3 Subscription Plans (Starter, Growth, Enterprise)
- 4 Test Tenants (3 active, 1 suspended)

### Step 3: Start Development Server
```bash
npm run dev
```

Server runs at: `http://localhost:9002`

### Step 4: Access Admin Login
Navigate to: **`http://localhost:9002/admin/login`**

## 🔑 Test Credentials

### Default Super Admin
```
Email:    admin@goodsale.com
Password: SecurePassword123
```

### OR Create Your Own
```bash
npm run db:seed:admin
```

Then follow the prompts to enter custom credentials.

## ✅ Testing Checklist

### Login Flow
- [ ] Navigate to login page: `/admin/login`
- [ ] Enter email: `admin@goodsale.com`
- [ ] Enter password: `SecurePassword123`
- [ ] Click "Sign In"
- [ ] Verify redirect to `/admin/dashboard`

### Dashboard
- [ ] View stat cards (Tenants, Revenue, Users, Status)
- [ ] See "Recently Joined Tenants" table
- [ ] Stats should show data from database

### Tenants Page
- [ ] Navigate to `/admin/tenants`
- [ ] See list of 4 test tenants
- [ ] **Search:** Try searching for "tech" (finds TechStore Ghana)
- [ ] **Filter:** Select "Active" to see 3 active tenants
- [ ] **Filter:** Select "Suspended" to see Quick Mart Kumasi
- [ ] **Create:** Add new tenant with form
- [ ] **Update:** Suspend/Unsuspend a tenant
- [ ] **Delete:** Delete a tenant with confirmation

### Plans Page
- [ ] Navigate to `/admin/plans`
- [ ] See 3 test plans (Starter, Growth, Enterprise)
- [ ] **Edit:** Click edit on a plan
- [ ] **Delete:** Delete a plan

### Profile Page
- [ ] Navigate to `/admin/profile`
- [ ] See current admin info
- [ ] **Edit:** Change name/email
- [ ] **Password:** Change password
  - Use current: `SecurePassword123`
  - Set new: anything 8+ characters

### Logout
- [ ] Click user avatar in top-right
- [ ] Click "Log out"
- [ ] Verify redirect to `/admin/login`

## 🧪 Test Scenarios

### Scenario 1: Fresh Start
```bash
npm run db:push                # Setup database
npm run db:seed:test          # Create test data
npm run dev                   # Start server
# Visit http://localhost:9002/admin/login
```

### Scenario 2: Custom Admin
```bash
npm run db:push              # Setup database
npm run db:seed:admin        # Interactive setup
# Follow prompts for email/password
npm run dev                  # Start server
```

### Scenario 3: Database Reset
```bash
npm run db:drop              # WARNING: Deletes all data
npm run db:push              # Recreate schema
npm run db:seed:test         # Repopulate test data
npm run dev                  # Start server
```

## 📊 Test Data Structure

### Super Admin
```
Name:     Admin User
Email:    admin@goodsale.com
Status:   Active
```

### Plans
1. **Starter** - GH₵99/month - 5 users max
2. **Growth** - GH₵499/month - 25 users max (Recommended)
3. **Enterprise** - Custom - Unlimited users

### Tenants
1. **TechStore Ghana** (Active)
   - Plan: Growth
   - Users: 12, Products: 245
   - Sales: GH₵125,500.50

2. **Fashion Hub Accra** (Active)
   - Plan: Starter
   - Users: 5, Products: 89
   - Sales: GH₵45,200.00

3. **Premium Electronics** (Active)
   - Plan: Enterprise
   - Users: 45, Products: 1,250
   - Sales: GH₵890,750.75

4. **Quick Mart Kumasi** (Suspended)
   - Plan: Starter
   - Users: 3, Products: 45
   - Sales: GH₵12,300.00

## 🐛 Troubleshooting

### Issue: Login fails with "Invalid email or password"
**Solution:** 
- Verify email is exactly: `admin@goodsale.com`
- Verify password is exactly: `SecurePassword123`
- Check database connection is working

### Issue: Dashboard shows empty
**Solution:**
- Run `npm run db:seed:test` to add test data
- Refresh the page
- Check browser console for errors

### Issue: Can't access admin pages
**Solution:**
- Verify you're logged in
- Clear browser cookies: `Ctrl+Shift+Delete`
- Try logging in again

### Issue: Changes not saving
**Solution:**
- Check browser console for API errors
- Verify database connection
- Check network tab in DevTools

## 📝 Notes

- **Test data is persistent** - Changes made during testing are saved to the database
- **Password is hashed** - Never stored in plain text
- **Audit logs** - All actions are logged in database
- **Session duration** - 30 days (NextAuth default)

## 🎯 Success Criteria

✅ You've successfully tested if:
1. ✅ Can login with test credentials
2. ✅ Dashboard displays real data
3. ✅ Can search tenants
4. ✅ Can filter by status
5. ✅ Can create/edit/delete plans
6. ✅ Can edit profile
7. ✅ Can change password
8. ✅ Can logout

---

**Testing Time Estimate: 5-10 minutes**

**Need Help?** Check `ADMIN_SETUP.md` or `TESTING_ADMIN.md` for detailed information.
