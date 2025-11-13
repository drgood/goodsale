# GoodSale Deployment Troubleshooting Guide

Common issues you might encounter during deployment and how to fix them.

---

## 🔴 Docker Issues

### Issue: Docker build fails with "permission denied"

**Symptoms:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Verify
docker ps
```

---

### Issue: "Port 3000 is already in use"

**Symptoms:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Solution:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change the port in docker-compose.yml
```

---

### Issue: Container keeps restarting

**Symptoms:**
```
goodsale-app   Restarting (1) 2 seconds ago
```

**Solution:**
```bash
# Check the logs for errors
docker compose logs app

# Common causes:
# 1. Missing environment variables
cat .env

# 2. Database not ready
docker compose logs postgres

# 3. Build errors
docker compose build --no-cache
docker compose up -d
```

---

## 🗄️ Database Issues

### Issue: "Connection refused" to database

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL container is running
docker compose ps postgres

# Should show "healthy"

# Check logs
docker compose logs postgres

# Restart database
docker compose restart postgres

# Verify DATABASE_URL is correct
cat .env | grep DATABASE_URL
# Should be: postgresql://goodsale:${DB_PASSWORD}@postgres:5432/goodsale
```

---

### Issue: "database does not exist"

**Symptoms:**
```
database "goodsale" does not exist
```

**Solution:**
```bash
# Recreate the database
docker compose down -v
docker compose up -d

# Wait for database to be healthy
docker compose ps

# Run migrations
docker compose exec app sh -c "npx drizzle-kit push"
```

---

### Issue: Migration fails

**Symptoms:**
```
Error: relation "users" already exists
```

**Solution:**
```bash
# Check what tables exist
docker compose exec postgres psql -U goodsale -d goodsale -c "\dt"

# If tables are correct, skip migration
# If tables are incorrect, drop and recreate
docker compose down -v
docker compose up -d
docker compose exec app sh -c "npx drizzle-kit push"
```

---

## 🌐 Nginx Issues

### Issue: "Connection refused" to localhost:80

**Symptoms:**
```
curl: (7) Failed to connect to localhost port 80
```

**Solution:**
```bash
# Check if nginx is running
sudo systemctl status nginx

# If not running, start it
sudo systemctl start nginx

# If failing, check error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

---

### Issue: "nginx: [emerg] bind() to 0.0.0.0:80 failed"

**Symptoms:**
```
bind() to 0.0.0.0:80 failed (98: Address already in use)
```

**Solution:**
```bash
# Check what's using port 80
sudo lsof -i :80

# Usually Apache if installed
sudo systemctl stop apache2
sudo systemctl disable apache2

# Restart nginx
sudo systemctl restart nginx
```

---

### Issue: 502 Bad Gateway

**Symptoms:**
Browser shows "502 Bad Gateway"

**Solution:**
```bash
# Check if app is running on port 3000
curl http://localhost:3000

# If not working, check app logs
docker compose logs app

# Restart app
docker compose restart app

# Check nginx proxy configuration
sudo nano /etc/nginx/sites-available/goodsale
# Verify: proxy_pass http://localhost:3000;

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

### Issue: Static files not loading (404 errors)

**Symptoms:**
Browser console shows 404 for CSS/JS files

**Solution:**
```bash
# Check Next.js build completed
docker compose logs app | grep "Compiled"

# Rebuild the application
docker compose build --no-cache
docker compose up -d

# Check nginx cache
sudo rm -rf /var/cache/nginx/*
sudo systemctl restart nginx
```

---

## 🔒 SSL Certificate Issues

### Issue: Certbot fails with "Could not bind to IPv4 or IPv6"

**Symptoms:**
```
Problem binding to port 80: Could not bind to IPv4 or IPv6
```

**Solution:**
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d goodsale.online -d www.goodsale.online

# Update nginx config to use certificates
sudo nano /etc/nginx/sites-available/goodsale

# Start nginx
sudo systemctl start nginx
```

---

### Issue: "Certificate verify failed"

**Symptoms:**
Browser shows "Your connection is not private"

**Solution:**
```bash
# Check certificate status
sudo certbot certificates

# If expired, renew
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl restart nginx

# If still issues, regenerate
sudo certbot delete --cert-name goodsale.online
sudo certbot --nginx -d goodsale.online -d www.goodsale.online
```

---

### Issue: DNS validation failed

**Symptoms:**
```
Failed authorization procedure. goodsale.online (http-01): urn:ietf:params:acme:error:dns :: DNS problem: NXDOMAIN
```

**Solution:**
```bash
# Verify DNS is configured correctly
nslookup goodsale.online

# Should return your VPS IP
# If not, wait for DNS propagation (can take up to 24 hours)

# Check from multiple locations
# Use: https://www.whatsmydns.net/

# Meanwhile, test locally
echo "YOUR_VPS_IP goodsale.online" | sudo tee -a /etc/hosts
```

---

## 🔥 Firewall Issues

### Issue: Can't access site from internet

**Symptoms:**
Site works on VPS but not from external network

**Solution:**
```bash
# Check firewall status
sudo ufw status

# Ensure ports are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check cloud provider firewall/security groups
# AWS: Security Groups
# DigitalOcean: Firewalls
# Ensure ports 80 and 443 are open
```

---

### Issue: Locked out after enabling firewall

**Symptoms:**
Can't SSH after `ufw enable`

**Solution:**
```bash
# From VPS provider's console (not SSH):

# Allow SSH
sudo ufw allow 22/tcp
# or
sudo ufw allow OpenSSH

# If completely locked out, use VPS provider's console/recovery mode
# Disable firewall temporarily
sudo ufw disable
```

---

## 📦 Application Issues

### Issue: "Module not found" errors

**Symptoms:**
```
Error: Cannot find module 'next'
```

**Solution:**
```bash
# Rebuild without cache
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

### Issue: Environment variables not loaded

**Symptoms:**
App works locally but fails on VPS

**Solution:**
```bash
# Check .env file exists
cat .env

# Verify all required variables
grep -E 'DB_PASSWORD|NEXTAUTH_SECRET|NEXTAUTH_URL|NEXT_PUBLIC_BASE_DOMAIN|GOOGLE_GENAI_API_KEY' .env

# Restart app after changes
docker compose restart app
```

---

### Issue: "NEXTAUTH_URL mismatch"

**Symptoms:**
```
[next-auth][error][CALLBACK_URL_MISMATCH]
```

**Solution:**
```bash
# Update .env
nano .env

# Set correct URL
NEXTAUTH_URL=https://goodsale.online

# Restart
docker compose restart app
```

---

## 🐌 Performance Issues

### Issue: Site is very slow

**Solutions:**

1. **Check memory usage:**
```bash
free -h
docker stats

# If low memory, increase swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

2. **Check disk space:**
```bash
df -h

# If full, clean up
docker system prune -a
sudo apt autoremove
```

3. **Optimize Docker:**
```bash
# Limit container memory in docker-compose.yml
services:
  app:
    mem_limit: 512m
```

---

## 🔍 Debugging Commands

### Check everything at once

```bash
#!/bin/bash
echo "=== DOCKER STATUS ==="
docker compose ps

echo -e "\n=== APP LOGS (last 20 lines) ==="
docker compose logs --tail=20 app

echo -e "\n=== NGINX STATUS ==="
sudo systemctl status nginx --no-pager

echo -e "\n=== DISK SPACE ==="
df -h /

echo -e "\n=== MEMORY ==="
free -h

echo -e "\n=== FIREWALL ==="
sudo ufw status

echo -e "\n=== SSL CERTIFICATES ==="
sudo certbot certificates
```

Save as `health-check.sh` and run: `bash health-check.sh`

---

## 📞 Getting More Help

### Collect diagnostic information:

```bash
# Create a diagnosis file
{
  echo "=== System Info ==="
  uname -a
  
  echo -e "\n=== Docker Version ==="
  docker --version
  docker compose version
  
  echo -e "\n=== Container Status ==="
  docker compose ps
  
  echo -e "\n=== Recent Logs ==="
  docker compose logs --tail=50 app
  
  echo -e "\n=== Nginx Config Test ==="
  sudo nginx -t
  
  echo -e "\n=== Environment ==="
  cat .env | grep -v PASSWORD | grep -v SECRET | grep -v API_KEY
  
} > diagnosis.txt

# Review before sharing (remove any sensitive data)
cat diagnosis.txt
```

---

## 🚨 Emergency Procedures

### Complete Reset (Nuclear Option)

⚠️ **WARNING: This will delete all data!**

```bash
# Stop everything
docker compose down -v

# Remove all containers and images
docker system prune -a --volumes

# Remove application files (backup first!)
rm -rf /opt/goodsale/*

# Start fresh deployment
# Follow VPS_DEPLOYMENT_GUIDE.md from Step 3
```

### Quick Rollback

```bash
cd /opt/goodsale

# If using git
git log --oneline -5
git reset --hard <previous-commit-hash>
docker compose build
docker compose up -d
```

---

**Last Updated**: 2025-11-13  
**Version**: 1.0
