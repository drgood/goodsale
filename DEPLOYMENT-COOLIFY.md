# GoodSale Deployment with Coolify

This guide walks you through deploying GoodSale on your Contabo VPS using Coolify.

## Prerequisites

✅ Contabo VPS with Coolify installed  
✅ Domain name (optional, but recommended)  
✅ Git repository (GitHub, GitLab, or Bitbucket)

---

## Step-by-Step Deployment

### Step 1: Push Your Code to Git Repository

From your local machine (Windows):

```powershell
# Initialize git if not already done
cd "C:\Users\sungs\Work Station\Web\GoodSale"
git init

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/goodsale.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - GoodSale app ready for deployment"

# Push to repository
git push -u origin main
```

**Note**: Make sure `.env` and `.env.local` are in `.gitignore` (they should be by default)

---

### Step 2: Access Coolify Dashboard

1. Open your browser and go to your Coolify URL:
   ```
   https://your-vps-ip:8000
   # OR
   https://coolify.yourdomain.com
   ```

2. Log in with your Coolify credentials

---

### Step 3: Create a New Project

1. Click **"+ New Project"** in Coolify dashboard
2. Give it a name: `GoodSale`
3. Add description: "Multi-tenant POS SaaS System"
4. Click **"Create"**

---

### Step 4: Add PostgreSQL Database

1. In your project, click **"+ New Resource"**
2. Select **"Database"**
3. Choose **"PostgreSQL 16"**
4. Configure database:
   - **Name**: `goodsale-db`
   - **Database Name**: `goodsale`
   - **Database User**: `goodsale`
   - **Database Password**: Generate a strong password or use your own
   - **Port**: `5432` (default)
5. Click **"Create Database"**
6. Wait for the database to be created and started

**IMPORTANT**: Copy the database connection string. It will look like:
```
postgresql://goodsale:your_password@goodsale-db:5432/goodsale
```

---

### Step 5: Create the Application

1. In your project, click **"+ New Resource"**
2. Select **"Application"**
3. Choose **"Public Repository"** or **"Private Repository"** (if your repo is private)

#### Configure Source

4. **Repository URL**: `https://github.com/yourusername/goodsale`
5. **Branch**: `main` (or your default branch)
6. **Build Pack**: Select **"Dockerfile"** (Coolify will detect your Dockerfile)

#### Configure Build

7. **Build Directory**: Leave as root `/`
8. **Dockerfile Location**: `./Dockerfile`

#### Configure Deployment

9. **Application Name**: `goodsale-app`
10. **Port Mapping**: 
    - Internal Port: `3000`
    - External Port: `80` (or leave default)
11. **Domain**: Add your domain (e.g., `goodsale.yourdomain.com`)
    - Or use Coolify's generated domain
    - For multi-tenant subdomains, also add a wildcard domain (e.g., `*.goodsale.online`). Wildcard TLS requires configuring a DNS-01 provider in Coolify (ACME). If not set up yet, start with a single host and add wildcard later.

---

### Step 6: Configure Environment Variables

In the **Environment Variables** section, add these variables:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=postgresql://goodsale:your_password@goodsale-db:5432/goodsale
NEXTAUTH_URL=https://goodsale.yourdomain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXT_PUBLIC_BASE_DOMAIN=goodsale.online
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

**To generate NEXTAUTH_SECRET**:
On your local machine or VPS terminal:
```bash
openssl rand -base64 32
```

**Important Notes**:
- Replace `your_password` with the database password from Step 4
- Replace `goodsale.yourdomain.com` with your actual domain
- If using Coolify's generated domain, use that URL for `NEXTAUTH_URL`

---

### Step 7: Configure Build Settings

Do not run migrations in the container (the production image is slim and doesn't include pnpm/dev tools). Plan to run them via GitHub Actions or from your local machine as described below.

---

### Step 8: Deploy the Application

1. Click **"Deploy"** button
2. Coolify will:
   - Clone your repository
   - Build the Docker image using your Dockerfile
   - Start the container with environment variables
   - Set up SSL certificate (if domain is configured)

3. Monitor the deployment logs in real-time
4. Wait for deployment to complete (usually 3-10 minutes)

---

### Step 9: Run Database Migrations & Seed Admin

After successful deployment:

#### Option A — GitHub Actions (recommended)
- Add a repository secret named `DATABASE_URL` pointing at your Coolify Postgres (publicly reachable or via secure access).
- Trigger the workflow: Actions -> "Run DB Migrations".

#### Option B — From your local machine
- Bash/zsh:
  ```bash
  export DATABASE_URL="postgresql://<user>:<password>@<public_db_host_or_tunnel>:5432/goodsale"
  pnpm db:migrate
  pnpm db:seed:admin   # optional
  unset DATABASE_URL
  ```
- PowerShell:
  ```powershell
  $env:DATABASE_URL = "postgresql://<user>:<password>@<public_db_host_or_tunnel>:5432/goodsale"
  pnpm db:migrate
  pnpm db:seed:admin   # optional
  Remove-Item Env:DATABASE_URL
  ```

Note: If your database is not publicly reachable, create a secure SSH tunnel or temporary access rule and point `DATABASE_URL` to the forwarded port.

---

### Step 10: Configure Domain & SSL (If Using Custom Domain)

1. **Point your domain to your VPS**:
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Add an A record:
     ```
     Type: A
     Name: goodsale (or @)
     Value: your-vps-ip-address
     TTL: 3600
     ```

2. **In Coolify**:
   - Go to your application settings
   - Under **"Domains"**, add: `goodsale.yourdomain.com`
   - Enable **"Generate SSL Certificate"** (Let's Encrypt)
   - Click **"Save"**

3. Wait 2-5 minutes for DNS propagation and SSL certificate generation

---

### Step 11: Verify Deployment

1. **Check Application**:
   ```
   https://goodsale.yourdomain.com
   ```

2. **Login to Admin Panel**:
   ```
   https://goodsale.yourdomain.com/admin/login
   ```
   Use credentials from `pnpm db:seed:admin`

3. **Check Health**:
   - Test creating a tenant
   - Test logging in as tenant user
   - Test POS functionality

---

## Updating Your Application

When you push new code to your repository:

### Automatic Deployment (Recommended)

1. **Enable Webhooks** in Coolify:
   - Go to your application settings
   - Enable **"Automatic Deployment"**
   - Copy the webhook URL
   - Add it to your GitHub/GitLab repository webhooks

Now every `git push` will automatically deploy!

### Manual Deployment

1. Go to Coolify dashboard
2. Select your `goodsale-app`
3. Click **"Redeploy"**
4. Select **"Force Rebuild"** if you changed dependencies

---

## Monitoring & Logs

### View Application Logs

1. In Coolify, go to your application
2. Click **"Logs"** tab
3. View real-time logs

### Check Application Status

1. Click **"Overview"** tab
2. View:
   - Container status
   - Memory usage
   - CPU usage
   - Restart count

---

## Backup Strategy

### Database Backup

#### Option A: Coolify Built-in Backup

1. Go to your PostgreSQL database in Coolify
2. Enable **"Backup"** feature
3. Configure backup schedule (daily, weekly, etc.)

#### Option B: Manual Backup

SSH into VPS and run:
```bash
# Find database container
docker ps | grep goodsale-db

# Backup
docker exec <db-container-id> pg_dump -U goodsale goodsale > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Copy backup to container
docker cp backup_20250112.sql <db-container-id>:/backup.sql

# Restore
docker exec -it <db-container-id> psql -U goodsale goodsale < /backup.sql
```

---

## Troubleshooting

### Build Failed

**Check build logs**:
1. In Coolify, click on your application
2. Go to **"Deployments"** tab
3. Click on the failed deployment
4. Review error logs

**Common issues**:
- Missing environment variables
- Dockerfile syntax errors
- Dependencies not installing (check package.json)
- Out of disk space on VPS

### Application Not Starting

**Check container logs**:
1. Go to **"Logs"** tab in Coolify
2. Look for errors like:
   - Database connection failed
   - Port already in use
   - Missing environment variables

**Fix**:
- Verify `DATABASE_URL` is correct
- Ensure database is running
- Check all environment variables are set

### Database Connection Failed

1. Check database container is running:
   ```bash
   docker ps | grep goodsale-db
   ```

2. Verify database credentials in environment variables

3. Test database connection:
   ```bash
   docker exec -it <db-container-id> psql -U goodsale goodsale
   ```

### SSL Certificate Issues

1. Ensure DNS is properly configured
2. Wait 5-10 minutes for DNS propagation
3. In Coolify, click **"Regenerate Certificate"**

### Out of Memory

If application crashes due to memory:

1. In Coolify, go to application settings
2. Under **"Resources"**, increase memory limit:
   - Default: 512MB
   - Recommended: 1GB or more

---

## Scaling (Future)

When your application grows:

1. **Vertical Scaling**: Upgrade VPS plan on Contabo
2. **Horizontal Scaling**: 
   - Add multiple application instances in Coolify
   - Use Coolify's built-in load balancer
3. **Database Scaling**: 
   - Move to managed PostgreSQL (e.g., Supabase, Neon)
   - Update `DATABASE_URL` in environment variables

---

## Security Checklist

✅ Strong passwords for database and admin  
✅ NEXTAUTH_SECRET properly generated  
✅ SSL/HTTPS enabled  
✅ Environment variables not committed to git  
✅ Regular backups enabled  
✅ Firewall configured on VPS (Coolify handles this)  
✅ Keep Coolify updated  

---

## Coolify Commands Reference

```bash
# SSH to VPS
ssh root@your-vps-ip

# View all containers
docker ps

# View application logs
docker logs -f <container-name>

# Execute command in container
docker exec -it <container-name> sh

# Restart application
docker restart <container-name>

# View Coolify logs
docker logs -f coolify
```

---

## Support & Resources

- **Coolify Docs**: https://coolify.io/docs
- **Coolify Discord**: https://coollabs.io/discord
- **Your App**: https://goodsale.yourdomain.com

---

## Quick Reference: Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Application URL | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Session secret key | Generated with openssl |
| `GOOGLE_GENAI_API_KEY` | Google AI API key | Your API key |

---

## Success! 🎉

Your GoodSale application is now deployed and running on Coolify!

**Next Steps**:
1. Access admin panel and change default password
2. Create your first tenant
3. Configure your POS settings
4. Start making sales!
