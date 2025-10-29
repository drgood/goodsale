# Login Troubleshooting Guide

## ✅ Authentication System Status

Your authentication system has been **verified and is working correctly**:

- ✅ Database connection working
- ✅ 4 users seeded successfully
- ✅ Password hashing correct (bcrypt)
- ✅ Password verification working
- ✅ Environment variables configured
- ✅ NextAuth properly configured

## 🔐 Test Credentials

Use these credentials from your seed script:

### GShop Electronics
- **Owner**: `owner@gshop.com` / `password123`
- **Manager**: `manager@gshop.com` / `password123`
- **Cashier**: `cashier1@gshop.com` / `password123`

### Globex Fashion
- **Owner**: `owner@globex.com` / `password123`

## 🐛 Common Issues & Solutions

### Issue 1: "User not found" or "Invalid password"

**Possible causes:**
1. Database wasn't seeded
2. Typo in email or password
3. Using wrong credentials

**Solution:**
```bash
# Re-seed the database
pnpm db:push
npx tsx src/scripts/seed.ts

# Test auth
npx tsx test-auth.ts
```

### Issue 2: Redirect loop or "Session not found"

**Possible causes:**
1. NEXTAUTH_SECRET not set
2. NEXTAUTH_URL doesn't match your dev server
3. Cookies blocked

**Solution:**
```bash
# Check .env file
cat .env

# Should contain:
DATABASE_URL=your_postgres_connection
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your_secret_here

# Generate new secret if needed:
openssl rand -base64 32
```

### Issue 3: "Cannot read properties of undefined"

**Possible causes:**
1. Session not available in component
2. Missing SessionProvider
3. Server/client mismatch

**Solution:**
- Make sure `src/app/providers.tsx` wraps app with `<SessionProvider>`
- Already fixed in your app ✅

### Issue 4: Tenant/Subdomain Error

**Current issue:** Login redirects to hardcoded `/gshop/dashboard`

**Solution (already in place):**
The login page redirects to:
```typescript
router.push('/gshop/dashboard'); // Hardcoded for testing
```

To make it dynamic, you can:
1. Fetch tenant info after login
2. Use the tenantId from session to look up subdomain
3. Redirect to correct tenant path

## 🔍 Debugging Steps

### Step 1: Check Browser Console

Open DevTools (F12) and look for:
- Network errors (401, 500)
- Console errors
- Failed API calls to `/api/auth/callback/credentials`

### Step 2: Check Dev Server Logs

Look in your terminal where `pnpm dev` is running for:
- "User not found" warnings
- "Invalid password" warnings
- Database connection errors

### Step 3: Test Manual API Call

```bash
# Test the auth endpoint directly
curl -X POST http://localhost:9002/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@gshop.com","password":"password123"}'
```

### Step 4: Verify Database

```bash
# Run the auth test script
npx tsx test-auth.ts

# Should show:
# ✅ Found 4 users in database
# ✅ Password "password123" valid: YES
```

## 🛠️ Manual Testing

### Test 1: Login Flow
1. Navigate to `http://localhost:9002/login`
2. Enter: `owner@gshop.com` / `password123`
3. Click "Log In"
4. Should redirect to `/gshop/dashboard`
5. Check if session is set in browser cookies

### Test 2: Check Session
After logging in, open browser console and run:
```javascript
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

Should show:
```json
{
  "user": {
    "id": "...",
    "name": "Dr Good",
    "email": "owner@gshop.com",
    "role": "Owner",
    "tenantId": "...",
    "avatarUrl": "..."
  },
  "expires": "..."
}
```

### Test 3: Protected API Route
```javascript
fetch('/api/products').then(r => r.json()).then(console.log)
```

If not logged in: `{ "error": "Unauthorized" }`
If logged in: Array of products

## 📝 What Was Fixed

1. **Removed duplicate `authOptions`**
   - Was defined in both `src/lib/auth.ts` and API route
   - Now centralized in `src/lib/auth.ts`

2. **Fixed sign-in page path**
   - Was set to `/auth/login`
   - Changed to `/login` (correct path)

3. **Added SessionProvider**
   - Wraps entire app in `src/app/providers.tsx`

4. **Removed database imports from data.ts**
   - Prevented client-side bundling issues

## 🎯 Next Steps

If you're still seeing errors:

1. **Share the exact error message** you're seeing:
   - Browser console error?
   - Network tab error?
   - Dev server log error?

2. **Clear cache and restart**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

3. **Check browser cookies**:
   - Open DevTools → Application → Cookies
   - Look for `next-auth.session-token`
   - If missing, session isn't being created

4. **Test in incognito**:
   - Sometimes cached cookies cause issues

## 📊 Expected Login Flow

```
1. User enters credentials on /login page
   ↓
2. Form submits to signIn('credentials', { email, password })
   ↓
3. NextAuth calls /api/auth/callback/credentials
   ↓
4. Your authorize function in authOptions:
   - Queries PostgreSQL for user
   - Compares password with bcrypt
   - Returns user object or null
   ↓
5. If successful:
   - JWT token created with user data
   - Cookie set (next-auth.session-token)
   - Redirects to /gshop/dashboard
   ↓
6. If failed:
   - Toast notification shown
   - User stays on login page
```

## ✅ Summary

Your authentication is **correctly configured and working**. The most common issues are:

1. **Typos** in email/password
2. **Database not seeded** (run: `npx tsx src/scripts/seed.ts`)
3. **Browser cache** (try incognito mode)
4. **Environment variables** (check `.env` file)

Run `npx tsx test-auth.ts` anytime to verify your setup! 🎉
