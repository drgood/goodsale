# 🚀 Quick Start - Super Admin Panel

Get the admin panel up and running in 5 minutes!

## Prerequisites

- Node.js installed
- PostgreSQL database running
- `.env` file configured with:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/goodsale
  NEXTAUTH_URL=http://localhost:9002
  NEXTAUTH_SECRET=your-random-secret-key
  ```

## Quick Setup

### Step 1: Apply Database Migrations (1 min)
```bash
npm run db:push
```

### Step 2: Create Admin Account (1 min)
```bash
npm run db:seed:admin
```

When prompted, enter:
- Name: `Admin`
- Email: `admin@goodsale.com`
- Password: `Password123`

### Step 3: Start Development Server (1 min)
```bash
npm run dev
```

Application starts at `http://localhost:9002`

### Step 4: Login (1 min)
1. Go to `http://localhost:9002/admin/login`
2. Enter email: `admin@goodsale.com`
3. Enter password: `Password123`
4. Click "Sign In"

### Step 5: Try It Out (1 min)
- Dashboard: See platform statistics
- Tenants: Create, update, suspend, or delete tenants

## 🎉 You're Done!

Your super admin panel is now live!

## Key URLs

- **Login**: `http://localhost:9002/admin/login`
- **Dashboard**: `http://localhost:9002/admin/dashboard`
- **Tenants**: `http://localhost:9002/admin/tenants`
- **Plans**: `http://localhost:9002/admin/plans`
- **Profile**: `http://localhost:9002/admin/profile`
- **Settings**: `http://localhost:9002/admin/settings`

## Common Tasks

### Create a New Tenant
1. Go to Tenants
2. Click "Add Tenant"
3. Fill in name, subdomain, and plan
4. Click "Create Tenant"

### Suspend/Unsuspend a Tenant
1. Go to Tenants
2. Click menu (⋮) on a tenant
3. Select "Suspend" or "Unsuspend"

### Delete a Tenant
1. Go to Tenants
2. Click menu (⋮) on a tenant
3. Select "Delete"
4. Confirm deletion

## Troubleshooting

**Can't login?**
- Make sure the super admin was created: `npm run db:seed:admin`
- Check `.env` has NEXTAUTH_SECRET

**Database not connecting?**
- Verify DATABASE_URL in `.env`
- Make sure PostgreSQL is running
- Check database credentials

**Still having issues?**
- See `TESTING_ADMIN.md` for detailed troubleshooting
- Check `ADMIN_SETUP.md` for setup details

## Next Steps

- Read `TESTING_ADMIN.md` for comprehensive testing guide
- Check `MIGRATION_SUMMARY.md` for technical details
- Review `ADMIN_SETUP.md` for advanced configuration

---

**Ready to go?** ✅ Start with `npm run dev`
