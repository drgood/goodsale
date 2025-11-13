# GoodSale - Quick Start Deployment

**Complete deployment in under 1 hour!**

This is the fastest path to get GoodSale running on your VPS. For detailed explanations, see `VPS_DEPLOYMENT_GUIDE.md`.

---

## ⚡ Prerequisites (5 minutes)

- VPS with Ubuntu 20.04+ (2GB RAM minimum)
- Domain: goodsale.online pointing to VPS IP
- SSH access to VPS

### DNS Setup
Set these A records in your domain registrar:
```
@     → YOUR_VPS_IP
www   → YOUR_VPS_IP
*     → YOUR_VPS_IP
```

---

## 🚀 Installation (Copy & Paste These Commands)

### Step 1: Connect and Update (2 minutes)

```bash
ssh root@YOUR_VPS_IP

# Update system
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Docker (3 minutes)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### Step 3: Setup Application (5 minutes)

```bash
# Create directory
sudo mkdir -p /opt/goodsale
sudo chown $USER:$USER /opt/goodsale
cd /opt/goodsale
```

**Upload your code** (choose one method):

**Method A: Git**
```bash
git clone YOUR_REPO_URL .
```

**Method B: From local machine (run on Windows)**
```powershell
scp -r "C:\Users\sungs\Work Station\Web\GoodSale\*" user@YOUR_VPS_IP:/opt/goodsale/
```

### Step 4: Configure Environment (3 minutes)

```bash
cd /opt/goodsale
cp .env.production .env

# Generate secrets first
echo "NEXTAUTH_SECRET: $(openssl rand -base64 32)"
echo "CRON_SECRET: $(openssl rand -base64 32)"

# Now edit .env
nano .env
```

**Fill in these values:**
```env
DB_PASSWORD=MAKE_A_STRONG_PASSWORD
NEXTAUTH_URL=https://goodsale.online
NEXTAUTH_SECRET=PASTE_FROM_ABOVE
NEXT_PUBLIC_BASE_DOMAIN=goodsale.online
GOOGLE_GENAI_API_KEY=your_api_key_here
CRON_SECRET=PASTE_FROM_ABOVE
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 5: Start Application (5-10 minutes)

```bash
# Start all services (this will build the app - takes 5-10 min)
docker compose up -d

# Watch build progress
docker compose logs -f app
# Press Ctrl+C when you see "Ready in..."
```

### Step 6: Initialize Database (2 minutes)

```bash
# Run database migrations
docker compose exec app sh -c "npx drizzle-kit push"

# Create super admin account
docker compose exec app sh -c "npx tsx scripts/seed-super-admin.ts"
```

**Admin Login:**
- Email: `admin@goodsale.com`
- Password: `Admin@123`
- ⚠️ **Change this immediately after first login!**

### Step 7: Install Nginx (3 minutes)

```bash
# Install nginx
sudo apt-get install nginx -y

# Copy configuration
sudo cp /opt/goodsale/nginx.conf /etc/nginx/sites-available/goodsale

# Enable site
sudo ln -s /etc/nginx/sites-available/goodsale /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and start
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL (5 minutes)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate (follow prompts)
sudo certbot --nginx -d goodsale.online -d www.goodsale.online

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Configure Firewall (2 minutes)

```bash
# Setup firewall
sudo apt-get install ufw -y
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Step 10: Verify (2 minutes)

```bash
# Check containers
docker compose ps
# Both should show "healthy"

# Test application
curl http://localhost:3000

# Test domain (from your computer)
# Open browser: https://goodsale.online
```

---

## ✅ You're Live!

Your application is now running at **https://goodsale.online**

### Next Steps

1. **Login to admin:**
   - Go to: https://goodsale.online/admin/login
   - Email: admin@goodsale.com
   - Password: Admin@123
   - **CHANGE PASSWORD IMMEDIATELY!**

2. **Setup backups:**
```bash
# Create backup script
mkdir -p /opt/goodsale/backups
cat > /opt/goodsale/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/goodsale/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U goodsale goodsale | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/goodsale/backup.sh

# Schedule daily backups at 3 AM
crontab -e
# Add: 0 3 * * * /opt/goodsale/backup.sh
```

3. **Setup cron job for subscriptions:**
   - Go to https://cron-job.org
   - Create account
   - Add job:
     - URL: `https://goodsale.online/api/cron/subscription-renewal`
     - Schedule: Daily at 2 AM
     - Method: POST
     - Header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## 📝 Essential Commands

### View Logs
```bash
docker compose logs -f app        # Application logs
docker compose logs postgres      # Database logs
sudo tail -f /var/log/nginx/error.log  # Nginx logs
```

### Restart Services
```bash
docker compose restart app        # Restart application
sudo systemctl restart nginx      # Restart nginx
```

### Update Application
```bash
cd /opt/goodsale
git pull
docker compose build
docker compose up -d
```

### Manual Backup
```bash
cd /opt/goodsale
docker compose exec postgres pg_dump -U goodsale goodsale > backup.sql
```

### Check Status
```bash
docker compose ps                 # Container status
sudo systemctl status nginx       # Nginx status
free -h                          # Memory usage
df -h                            # Disk space
```

---

## 🆘 Quick Troubleshooting

### Site not loading?
```bash
# Check if containers are running
docker compose ps

# Check logs
docker compose logs app

# Restart everything
docker compose restart
sudo systemctl restart nginx
```

### 502 Bad Gateway?
```bash
# App probably crashed
docker compose restart app
docker compose logs -f app
```

### SSL not working?
```bash
sudo certbot certificates
sudo certbot renew
sudo systemctl restart nginx
```

### Out of space?
```bash
# Clean up Docker
docker system prune -a

# Remove old backups
find /opt/goodsale/backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 📚 Full Documentation

- **Detailed Guide:** `VPS_DEPLOYMENT_GUIDE.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting:** `DEPLOYMENT_TROUBLESHOOTING.md`
- **Nginx Tests:** `NGINX_TEST_COVERAGE.md`

---

## 🎉 Success Checklist

- [ ] Application running at https://goodsale.online
- [ ] Admin login works
- [ ] SSL certificate valid (green padlock in browser)
- [ ] HTTP redirects to HTTPS
- [ ] www redirects to non-www
- [ ] Default admin password changed
- [ ] Backups scheduled
- [ ] Firewall configured

---

**Total Time:** ~40-60 minutes  
**Support:** Check `DEPLOYMENT_TROUBLESHOOTING.md` for common issues

---

**Last Updated:** 2025-11-13  
**Version:** 1.0
