# GoodSale VPS Deployment Guide
## Complete Step-by-Step Production Deployment

This comprehensive guide will walk you through deploying GoodSale on your VPS from scratch to a live production environment.

---

## 📋 Prerequisites

### What You Need
- **VPS Server** with Ubuntu 20.04+ (minimum 2GB RAM, 2 CPU cores recommended)
- **Domain Name**: goodsale.online (with DNS A records pointing to your VPS IP)
- **Root or Sudo Access** to your VPS
- **SSH Access** to your VPS

### Domain DNS Setup
Before starting, ensure these DNS records are configured:

```
Type    Name    Value           TTL
A       @       YOUR_VPS_IP     300
A       www     YOUR_VPS_IP     300
A       *       YOUR_VPS_IP     300  (for tenant subdomains)
```

Wait 5-15 minutes for DNS propagation before proceeding.

---

## 🚀 Deployment Options

Choose one of these deployment methods:

1. **Docker Deployment** (Recommended) - Containerized, portable, easy updates
2. **PM2 Deployment** - Direct Node.js deployment, better performance

---

# Option 1: Docker Deployment (Recommended)

## Step 1: Initial Server Setup

### 1.1 Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
# or
ssh your_username@YOUR_VPS_IP
```

### 1.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Create Application User (Optional but Recommended)

```bash
sudo adduser goodsale
sudo usermod -aG sudo goodsale
sudo su - goodsale
```

## Step 2: Install Docker

### 2.1 Install Docker Engine

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
```

### 2.2 Install Docker Compose

```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin -y

# Verify installation
docker compose version
```

## Step 3: Setup Application Directory

### 3.1 Create Application Directory

```bash
sudo mkdir -p /opt/goodsale
sudo chown $USER:$USER /opt/goodsale
cd /opt/goodsale
```

### 3.2 Upload Your Code

**Option A: Using Git (Recommended)**

```bash
cd /opt/goodsale
git clone https://github.com/YOUR_USERNAME/goodsale.git .

# If private repo, you'll need to authenticate
# Use SSH keys or personal access token
```

**Option B: Using SCP from Your Local Machine**

```bash
# From your local machine (PowerShell/CMD)
scp -r "C:\Users\sungs\Work Station\Web\GoodSale\*" your_username@YOUR_VPS_IP:/opt/goodsale/
```

**Option C: Using rsync (More Efficient)**

```bash
# From your local machine (if you have rsync)
rsync -avz --exclude 'node_modules' --exclude '.next' \
  "C:\Users\sungs\Work Station\Web\GoodSale/" \
  your_username@YOUR_VPS_IP:/opt/goodsale/
```

## Step 4: Configure Environment Variables

### 4.1 Create Production Environment File

```bash
cd /opt/goodsale
cp .env.production .env
nano .env
```

### 4.2 Fill in Required Values

```env
# Database Password (Generate a strong password)
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD_HERE

# NextAuth Configuration
NEXTAUTH_URL=https://goodsale.online
NEXTAUTH_SECRET=GENERATE_THIS_WITH_OPENSSL

# Domain Configuration
NEXT_PUBLIC_BASE_DOMAIN=goodsale.online

# Google AI API Key
GOOGLE_GENAI_API_KEY=your_google_ai_api_key

# Cron Job Secret (for subscription automation)
CRON_SECRET=GENERATE_THIS_WITH_OPENSSL
```

### 4.3 Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32

# Copy these values into your .env file
```

**Save and exit** (Ctrl+X, then Y, then Enter)

## Step 5: Build and Start Services

### 5.1 Start Docker Containers

```bash
cd /opt/goodsale

# Build and start all services
docker compose up -d

# This will:
# 1. Build the Next.js application
# 2. Start PostgreSQL database
# 3. Start the application server
```

### 5.2 Monitor Build Progress

```bash
# Watch the logs during initial build
docker compose logs -f app

# Press Ctrl+C to exit logs (services keep running)
```

### 5.3 Verify Services are Running

```bash
# Check container status
docker compose ps

# You should see:
# goodsale-db    running (healthy)
# goodsale-app   running (healthy)
```

## Step 6: Initialize Database

### 6.1 Run Database Schema

```bash
# Connect to the app container and run migrations
docker compose exec app sh -c "npx drizzle-kit push"
```

### 6.2 Seed Super Admin User

```bash
# Create the initial super admin account
docker compose exec app sh -c "npx tsx scripts/seed-super-admin.ts"
```

**Default Super Admin Credentials:**
- Email: `admin@goodsale.com`
- Password: `Admin@123`

⚠️ **Change this password immediately after first login!**

## Step 7: Install and Configure Nginx

### 7.1 Install Nginx

```bash
sudo apt-get install nginx -y
```

### 7.2 Copy Nginx Configuration

```bash
# Copy your nginx.conf to sites-available
sudo cp /opt/goodsale/nginx.conf /etc/nginx/sites-available/goodsale

# The file is already configured for goodsale.online
# Verify the domain matches your setup
sudo nano /etc/nginx/sites-available/goodsale
```

### 7.3 Enable Site

```bash
# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/goodsale /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Should output: "configuration file /etc/nginx/nginx.conf test is successful"
```

### 7.4 Start Nginx

```bash
sudo systemctl enable nginx
sudo systemctl restart nginx
```

## Step 8: Setup SSL Certificate with Let's Encrypt

### 8.1 Install Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx -y
```

### 8.2 Obtain SSL Certificate

```bash
# Get certificate for both apex and www domains
sudo certbot --nginx -d goodsale.online -d www.goodsale.online

# Follow the prompts:
# - Enter your email address
# - Agree to Terms of Service
# - Choose whether to share email with EFF
# - Certbot will automatically configure SSL in nginx
```

### 8.3 Test Auto-Renewal

```bash
# Test the renewal process (dry-run)
sudo certbot renew --dry-run

# If successful, auto-renewal is configured
```

## Step 9: Configure Firewall (UFW)

### 9.1 Setup Firewall Rules

```bash
# Install UFW if not already installed
sudo apt-get install ufw -y

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Verify Deployment

### 10.1 Test Application Access

```bash
# Test from VPS
curl http://localhost:3000

# Test nginx proxy
curl http://localhost

# Test domain (from your local machine)
# Open browser and go to: https://goodsale.online
```

### 10.2 Check SSL Configuration

```bash
# Test SSL certificate
openssl s_client -connect goodsale.online:443 -servername goodsale.online
```

### 10.3 Verify All Tests Pass

```bash
cd /opt/goodsale

# Run the nginx configuration tests
docker compose exec app npm test -- nginx-config.test.ts
```

## Step 11: Setup Cron Jobs for Subscription Management

### 11.1 Choose Cron Service

**Option A: External Cron Service (Recommended)**

1. Go to [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com)
2. Create a free account
3. Add new cron job:
   - **Title**: GoodSale Subscription Renewal
   - **URL**: `https://goodsale.online/api/cron/subscription-renewal`
   - **Schedule**: Daily at 02:00 AM (or your preferred time)
   - **Method**: POST
   - **Headers**: Add header `Authorization: Bearer YOUR_CRON_SECRET`
     (Use the CRON_SECRET from your .env file)

**Option B: Linux Crontab (Alternative)**

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://goodsale.online/api/cron/subscription-renewal
```

## Step 12: Setup Backup Strategy

### 12.1 Database Backup Script

```bash
# Create backup directory
mkdir -p /opt/goodsale/backups

# Create backup script
nano /opt/goodsale/backup.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/opt/goodsale/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/goodsale_backup_$DATE.sql"

# Create backup
docker compose exec -T postgres pg_dump -U goodsale goodsale > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Delete backups older than 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make it executable:

```bash
chmod +x /opt/goodsale/backup.sh
```

### 12.2 Schedule Automatic Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /opt/goodsale/backup.sh >> /opt/goodsale/logs/backup.log 2>&1
```

---

## 📊 Monitoring & Maintenance

### View Application Logs

```bash
# Real-time logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Database logs
docker compose logs postgres
```

### Check Service Status

```bash
# Check containers
docker compose ps

# Check nginx
sudo systemctl status nginx

# Check disk space
df -h

# Check memory usage
free -h
```

### Restart Services

```bash
# Restart application
docker compose restart app

# Restart all services
docker compose restart

# Restart nginx
sudo systemctl restart nginx
```

### Update Application

```bash
cd /opt/goodsale

# Pull latest code
git pull

# Rebuild and restart
docker compose build
docker compose up -d

# Check logs for any issues
docker compose logs -f app
```

---

## 🔧 Troubleshooting

### Issue: Application Not Accessible

```bash
# Check if containers are running
docker compose ps

# Check application logs
docker compose logs app

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Test nginx configuration
sudo nginx -t
```

### Issue: Database Connection Errors

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test database connection
docker compose exec postgres psql -U goodsale -d goodsale -c "\dt"
```

### Issue: SSL Certificate Problems

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check nginx SSL configuration
sudo nginx -t

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: Out of Memory

```bash
# Check memory usage
free -h

# Check which containers are using most memory
docker stats

# Restart application to free memory
docker compose restart app
```

### Issue: Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Check what's using port 80
sudo lsof -i :80

# Kill process if needed
sudo kill -9 PID
```

---

## 🔒 Security Checklist

- [x] Strong database password set
- [x] NEXTAUTH_SECRET generated with `openssl rand -base64 32`
- [x] SSL certificate installed (HTTPS enabled)
- [x] Firewall configured (UFW)
- [x] Database not exposed to internet (only accessible via Docker network)
- [x] Environment variables not committed to git
- [x] Regular backups scheduled
- [ ] Changed default super admin password
- [ ] Setup monitoring (optional: UptimeRobot, Datadog, etc.)
- [ ] Configure log rotation
- [ ] Review and update security headers in nginx

---

## 📈 Performance Optimization (Optional)

### Enable Redis Caching (Future Enhancement)

```bash
# Add Redis to docker-compose.yml
# Configure Next.js to use Redis for caching
```

### Enable Nginx Caching

Add to nginx configuration:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;
    # ... rest of proxy configuration
}
```

### Monitor with PM2 (Alternative to Docker logs)

```bash
# Install PM2 globally if not using Docker
npm install -g pm2

# Setup PM2 monitoring
pm2 install pm2-logrotate
```

---

# Option 2: PM2 Deployment (Alternative)

If you prefer to run directly on the server without Docker:

## Step 1: Install Node.js

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
```

## Step 2: Install pnpm

```bash
npm install -g pnpm
pnpm --version
```

## Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE goodsale;
CREATE USER goodsale WITH PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE goodsale TO goodsale;
\c goodsale
GRANT ALL ON SCHEMA public TO goodsale;
EOF
```

## Step 4: Setup Application

```bash
# Create directory
sudo mkdir -p /opt/goodsale
sudo chown $USER:$USER /opt/goodsale

# Upload code (same as Docker method)
cd /opt/goodsale

# Install dependencies
pnpm install

# Create .env file
cp .env.production .env
nano .env
```

Update DATABASE_URL in .env:

```env
DATABASE_URL=postgresql://goodsale:YOUR_STRONG_PASSWORD@localhost:5432/goodsale
NEXTAUTH_URL=https://goodsale.online
NEXTAUTH_SECRET=GENERATE_WITH_OPENSSL
NEXT_PUBLIC_BASE_DOMAIN=goodsale.online
GOOGLE_GENAI_API_KEY=your_key
CRON_SECRET=GENERATE_WITH_OPENSSL
```

## Step 5: Build and Start Application

```bash
# Build application
pnpm build

# Run database migrations
pnpm db:push

# Seed super admin
pnpm db:seed:admin

# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

## Step 6: Complete Nginx and SSL Setup

Follow Steps 7-12 from the Docker deployment section above.

---

## 🎯 Post-Deployment Tasks

### 1. First Login and Setup

1. Go to `https://goodsale.online/admin/login`
2. Login with:
   - Email: `admin@goodsale.com`
   - Password: `Admin@123`
3. **Immediately change your password** in Admin → Profile
4. Setup your first tenant plan
5. Create your first tenant

### 2. Test All Functionality

- [ ] Super admin login
- [ ] Create a test tenant
- [ ] Tenant login
- [ ] POS system
- [ ] Product management
- [ ] Customer management
- [ ] Reports and dashboard
- [ ] Subscription management

### 3. Configure Email Notifications (Optional)

Update `src/lib/trial-notifications.ts` to integrate with your email service:
- SendGrid
- AWS SES
- Resend
- Mailgun

### 4. Setup Monitoring (Recommended)

- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: Website analytics

---

## 📞 Support & Resources

### Useful Commands Cheat Sheet

```bash
# Docker
docker compose ps                    # List containers
docker compose logs -f app          # View logs
docker compose restart app          # Restart app
docker compose down                 # Stop all services
docker compose up -d                # Start all services

# Nginx
sudo systemctl status nginx         # Check nginx status
sudo systemctl restart nginx        # Restart nginx
sudo nginx -t                       # Test configuration
sudo tail -f /var/log/nginx/error.log  # View error logs

# SSL
sudo certbot renew                  # Renew certificates
sudo certbot certificates           # List certificates

# Database
docker compose exec postgres psql -U goodsale  # Connect to database
docker compose exec postgres pg_dump -U goodsale goodsale > backup.sql  # Backup

# Firewall
sudo ufw status                     # Check firewall
sudo ufw allow PORT                 # Allow port
```

### Quick Health Check

```bash
# Run this to verify everything is working
cd /opt/goodsale
docker compose ps && \
curl -I http://localhost:3000 && \
sudo systemctl status nginx && \
sudo certbot certificates
```

---

## 🎉 Congratulations!

Your GoodSale application should now be live at **https://goodsale.online**

**Next Steps:**
1. Change the default admin password
2. Create your first business plan
3. Onboard your first tenant
4. Setup monitoring and alerts
5. Configure regular backups

For issues or questions, check the troubleshooting section or review application logs.

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-13  
**Tested On**: Ubuntu 22.04 LTS, Docker 24.x, Node.js 20.x
