# GoodSale - GitHub Direct Deployment Guide (Without Docker)

**Deploy GoodSale directly on your VPS using Node.js, PostgreSQL, PM2, and Nginx**

This guide is for deploying GoodSale from GitHub to your VPS at `/var/www/nextjs/goodsale` without Docker.

---

## 📋 Prerequisites

- **VPS:** Ubuntu 20.04+ with 2GB+ RAM
- **Domain:** goodsale.online configured with DNS A records
- **Code:** Already cloned at `/var/www/nextjs/goodsale`
- **Access:** SSH root or sudo access

---

## 🚀 Deployment Steps

## Step 1: Update System Packages

```bash
ssh root@YOUR_VPS_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

---

## Step 2: Install Node.js 20

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x

# Install pnpm globally
npm install -g pnpm

# Verify pnpm
pnpm --version
```

---

## Step 3: Install PostgreSQL 16

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null

# Install PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

---

## Step 4: Configure PostgreSQL Database

```bash
# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE goodsale;

-- Create user with strong password (CHANGE THIS!)
CREATE USER goodsale WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE goodsale TO goodsale;

-- Connect to goodsale database
\c goodsale

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO goodsale;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO goodsale;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO goodsale;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO goodsale;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO goodsale;

-- Exit
\q
EOF

# Verify database was created
sudo -u postgres psql -c "\l" | grep goodsale
```

### Configure PostgreSQL for Local Connections

```bash
# Allow password authentication for local connections
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Find this line:
```
local   all             all                                     peer
```

Change it to:
```
local   all             all                                     md5
```

Save and restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Step 5: Setup Application Directory

```bash
# Navigate to your application directory
cd /var/www/nextjs/goodsale

# Set proper ownership (replace 'your_user' with your actual username)
sudo chown -R $USER:$USER /var/www/nextjs/goodsale

# Verify the code is there
ls -la

# Pull latest changes from GitHub
git pull origin master
```

---

## Step 6: Configure Environment Variables

```bash
cd /var/www/nextjs/goodsale

# Create .env file from template
cp .env.production .env

# Generate secrets
echo "Generate these secrets and add to .env file:"
echo "NEXTAUTH_SECRET: $(openssl rand -base64 32)"
echo "CRON_SECRET: $(openssl rand -base64 32)"

# Edit .env file
nano .env
```

**Add these values to `.env`:**

```env
# Database Configuration
DATABASE_URL=postgresql://goodsale:YOUR_STRONG_PASSWORD_HERE@localhost:5432/goodsale

# NextAuth Configuration
NEXTAUTH_URL=https://goodsale.online
NEXTAUTH_SECRET=PASTE_GENERATED_SECRET_HERE

# Domain Configuration
NEXT_PUBLIC_BASE_DOMAIN=goodsale.online

# Google AI API Key (if using AI features)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here

# Cron Job Secret (for subscription automation)
CRON_SECRET=PASTE_GENERATED_SECRET_HERE

# Node Environment
NODE_ENV=production
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

**Important:** Replace:
- `YOUR_STRONG_PASSWORD_HERE` with your PostgreSQL password
- `PASTE_GENERATED_SECRET_HERE` with the secrets generated above
- `your_google_ai_api_key_here` with your actual Google AI API key

---

## Step 7: Install Dependencies and Build

```bash
cd /var/www/nextjs/goodsale

# Install dependencies
pnpm install

# This may take 3-5 minutes
# Watch for any errors

# Build the application
pnpm build

# This will take 5-10 minutes
# You should see "Compiled successfully"
```

---

## Step 8: Initialize Database Schema

```bash
cd /var/www/nextjs/goodsale

# Push database schema to PostgreSQL
pnpm db:push

# You should see tables being created

# Verify tables were created
PGPASSWORD=YOUR_DB_PASSWORD psql -U goodsale -d goodsale -c "\dt"

# You should see tables like: users, tenants, subscriptions, etc.
```

---

## Step 9: Seed Super Admin User

```bash
cd /var/www/nextjs/goodsale

# Create super admin account
pnpm db:seed:admin

# You should see: "Super admin created successfully"
```

**Default Super Admin Credentials:**
- Email: `admin@goodsale.com`
- Password: `Admin@123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## Step 10: Install and Configure PM2

```bash
# Install PM2 globally
npm install -g pm2

# Verify PM2 installation
pm2 --version

# Create logs directory
mkdir -p /var/www/nextjs/goodsale/logs

# Start the application with PM2
cd /var/www/nextjs/goodsale
pm2 start ecosystem.config.js

# Check status
pm2 status

# Should show "goodsale" with status "online"

# View logs
pm2 logs goodsale --lines 50

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# This will output a command - RUN THAT COMMAND
# It will look like: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_user --hp /home/your_user
```

**Verify Application is Running:**

```bash
# Test if app is responding
curl http://localhost:3000

# You should see HTML output
```

---

## Step 11: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Copy nginx configuration
sudo cp /var/www/nextjs/goodsale/nginx.conf /etc/nginx/sites-available/goodsale

# Review and update if needed (domain should already be correct)
sudo nano /etc/nginx/sites-available/goodsale

# Enable the site
sudo ln -s /etc/nginx/sites-available/goodsale /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Should output: "configuration file /etc/nginx/nginx.conf test is successful"

# Enable and start nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## Step 12: Setup SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate for your domain
sudo certbot --nginx -d goodsale.online -d www.goodsale.online

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to Terms of Service (Y)
# 3. Share email with EFF (optional)
# 4. Certbot will automatically configure nginx

# Verify certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run

# Should show "Congratulations, all simulated renewals succeeded"
```

**Auto-renewal is configured automatically by certbot.**

---

## Step 13: Configure Firewall

```bash
# Install UFW if not already installed
sudo apt install -y ufw

# IMPORTANT: Allow SSH first (don't lock yourself out!)
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Type 'y' to confirm

# Check firewall status
sudo ufw status

# Should show rules for ports 22, 80, and 443
```

---

## Step 14: Verify Deployment

### Test Application Locally

```bash
# Test Node.js app directly
curl http://localhost:3000

# Should return HTML

# Test nginx proxy
curl http://localhost

# Should return HTML

# Check PM2 status
pm2 status

# Should show "goodsale" as "online"

# Check PM2 logs
pm2 logs goodsale --lines 20
```

### Test Domain Access

**From your local computer:**

1. Open browser and go to: `https://goodsale.online`
2. You should see the GoodSale application
3. Check that SSL is working (green padlock in browser)
4. Try `http://goodsale.online` - should redirect to HTTPS
5. Try `https://www.goodsale.online` - should redirect to non-www

### Test Admin Login

1. Go to: `https://goodsale.online/admin/login`
2. Login with:
   - Email: `admin@goodsale.com`
   - Password: `Admin@123`
3. **Immediately change your password!**

---

## Step 15: Setup Automated Backups

### Create Backup Script

```bash
# Create backup directory
mkdir -p /var/www/nextjs/goodsale/backups

# Create backup script
cat > /var/www/nextjs/goodsale/backup.sh << 'EOF'
#!/bin/bash

# Configuration
BACKUP_DIR="/var/www/nextjs/goodsale/backups"
DB_NAME="goodsale"
DB_USER="goodsale"
DB_PASSWORD="YOUR_DB_PASSWORD_HERE"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/goodsale_backup_$DATE.sql"

# Create backup
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Delete backups older than 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

# Update DB_PASSWORD in the script
nano /var/www/nextjs/goodsale/backup.sh
# Replace YOUR_DB_PASSWORD_HERE with your actual password

# Make script executable
chmod +x /var/www/nextjs/goodsale/backup.sh

# Test backup script
/var/www/nextjs/goodsale/backup.sh

# Verify backup was created
ls -lh /var/www/nextjs/goodsale/backups/
```

### Schedule Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line to run backup daily at 3 AM:
0 3 * * * /var/www/nextjs/goodsale/backup.sh >> /var/www/nextjs/goodsale/logs/backup.log 2>&1

# Save and exit
```

---

## Step 16: Setup Cron Job for Subscription Management

### Option A: External Cron Service (Recommended)

1. Go to [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com)
2. Create a free account
3. Add new cron job:
   - **Title:** GoodSale Subscription Renewal
   - **URL:** `https://goodsale.online/api/cron/subscription-renewal`
   - **Schedule:** Daily at 02:00 AM
   - **Method:** POST
   - **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`
     (Use the CRON_SECRET from your .env file)

### Option B: Server Crontab

```bash
# Get your CRON_SECRET
cd /var/www/nextjs/goodsale
grep CRON_SECRET .env

# Edit crontab
crontab -e

# Add this line (replace YOUR_CRON_SECRET with actual value):
0 2 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://goodsale.online/api/cron/subscription-renewal >> /var/www/nextjs/goodsale/logs/cron.log 2>&1

# Save and exit
```

---

## 📊 Verification Checklist

Run through this checklist to ensure everything is working:

- [ ] PostgreSQL is running: `sudo systemctl status postgresql`
- [ ] Database exists: `sudo -u postgres psql -l | grep goodsale`
- [ ] Application is built: `ls -la /var/www/nextjs/goodsale/.next`
- [ ] PM2 is running app: `pm2 status`
- [ ] App responds locally: `curl http://localhost:3000`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Nginx config is valid: `sudo nginx -t`
- [ ] Domain loads: Open `https://goodsale.online` in browser
- [ ] SSL is valid: Check for green padlock
- [ ] HTTP redirects to HTTPS
- [ ] www redirects to non-www
- [ ] Admin login works
- [ ] Firewall is enabled: `sudo ufw status`
- [ ] Backups are scheduled: `crontab -l`
- [ ] PM2 starts on boot: `pm2 startup` was run

---

## 🔄 Maintenance & Operations

### Update Application

```bash
cd /var/www/nextjs/goodsale

# Pull latest code from GitHub
git pull origin master

# Install any new dependencies
pnpm install

# Rebuild application
pnpm build

# Run any new migrations
pnpm db:push

# Restart PM2
pm2 restart goodsale

# Check logs for errors
pm2 logs goodsale --lines 50
```

### View Logs

```bash
# PM2 Application logs
pm2 logs goodsale

# PM2 logs (last 100 lines)
pm2 logs goodsale --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Restart Services

```bash
# Restart application
pm2 restart goodsale

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL (rarely needed)
sudo systemctl restart postgresql

# Restart all
pm2 restart goodsale && sudo systemctl restart nginx
```

### Check Service Status

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### Manual Backup

```bash
# Run backup script manually
/var/www/nextjs/goodsale/backup.sh

# Or create a one-time backup
cd /var/www/nextjs/goodsale
PGPASSWORD=YOUR_DB_PASSWORD pg_dump -U goodsale goodsale > backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
# Stop the application
pm2 stop goodsale

# Restore database (replace backup_file.sql.gz with your backup)
cd /var/www/nextjs/goodsale/backups
gunzip -c backup_file.sql.gz | PGPASSWORD=YOUR_DB_PASSWORD psql -U goodsale -d goodsale

# Start application
pm2 start goodsale

# Check logs
pm2 logs goodsale
```

---

## 🔧 Troubleshooting

### Issue: Application won't start with PM2

```bash
# Check PM2 logs
pm2 logs goodsale

# Common issues:
# 1. Missing .env file
cat /var/www/nextjs/goodsale/.env

# 2. Wrong DATABASE_URL
grep DATABASE_URL /var/www/nextjs/goodsale/.env

# 3. Port 3000 in use
sudo lsof -i :3000

# 4. Build failed
cd /var/www/nextjs/goodsale
pnpm build
```

### Issue: Database connection refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
PGPASSWORD=YOUR_DB_PASSWORD psql -U goodsale -d goodsale -c "SELECT version();"

# Check pg_hba.conf allows connections
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Issue: 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check if app is responding on port 3000
curl http://localhost:3000

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart app
pm2 restart goodsale

# Restart nginx
sudo systemctl restart nginx
```

### Issue: SSL Certificate Problems

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check nginx SSL configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Issue: Out of Memory

```bash
# Check memory usage
free -h

# Add swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Restart application
pm2 restart goodsale
```

### Issue: Port 3000 Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID

# Or stop PM2 first
pm2 stop all
pm2 start goodsale
```

---

## 🔒 Security Best Practices

### Secure PostgreSQL

```bash
# Change postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'new_strong_password';"

# Restrict PostgreSQL to local connections only
sudo nano /etc/postgresql/16/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Secure Environment Variables

```bash
# Ensure .env is not readable by others
chmod 600 /var/www/nextjs/goodsale/.env

# Verify permissions
ls -la /var/www/nextjs/goodsale/.env
# Should show: -rw------- (only owner can read/write)
```

### Regular Updates

```bash
# Update system packages weekly
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/nextjs/goodsale
pnpm update

# Rebuild and restart
pnpm build
pm2 restart goodsale
```

---

## 📈 Performance Optimization

### Enable Nginx Caching (Optional)

```bash
sudo nano /etc/nginx/sites-available/goodsale
```

Add before `server` blocks:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx/goodsale levels=1:2 keys_zone=goodsale_cache:10m max_size=1g inactive=60m use_temp_path=off;
```

Then in the main `location /` block, add:

```nginx
proxy_cache goodsale_cache;
proxy_cache_valid 200 5m;
proxy_cache_bypass $http_upgrade;
```

Create cache directory:

```bash
sudo mkdir -p /var/cache/nginx/goodsale
sudo chown -R www-data:www-data /var/cache/nginx
sudo nginx -t
sudo systemctl restart nginx
```

### PM2 Cluster Mode

Edit `ecosystem.config.js`:

```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster',
```

Then restart:

```bash
pm2 delete goodsale
pm2 start ecosystem.config.js
pm2 save
```

---

## 📞 Quick Commands Reference

```bash
# Application
pm2 start goodsale          # Start app
pm2 stop goodsale           # Stop app
pm2 restart goodsale        # Restart app
pm2 logs goodsale           # View logs
pm2 status                  # Check status

# Nginx
sudo systemctl restart nginx    # Restart
sudo nginx -t                   # Test config
sudo systemctl status nginx     # Check status

# PostgreSQL
sudo systemctl restart postgresql   # Restart
sudo -u postgres psql -d goodsale  # Connect to DB

# Updates
cd /var/www/nextjs/goodsale
git pull                    # Pull latest code
pnpm install               # Install dependencies
pnpm build                 # Build app
pm2 restart goodsale       # Restart

# Backups
/var/www/nextjs/goodsale/backup.sh  # Manual backup

# SSL
sudo certbot renew         # Renew certificates
sudo certbot certificates  # List certificates
```

---

## 🎉 Success!

Your GoodSale application should now be live at **https://goodsale.online**

### Next Steps:

1. **Login to admin panel:** https://goodsale.online/admin/login
2. **Change default password** immediately
3. **Create your first business plan**
4. **Setup monitoring** (optional - UptimeRobot, etc.)
5. **Configure email notifications** (optional)

---

## 📚 Related Documentation

- **Nginx Tests:** [NGINX_TEST_COVERAGE.md](./NGINX_TEST_COVERAGE.md)
- **Cron Setup:** [CRON_SETUP.md](./CRON_SETUP.md)
- **Admin Setup:** [ADMIN_SETUP.md](./ADMIN_SETUP.md)
- **General Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-13  
**Deployment Method:** Direct GitHub + PM2 (No Docker)  
**Tested On:** Ubuntu 22.04 LTS, Node.js 20.x, PostgreSQL 16
