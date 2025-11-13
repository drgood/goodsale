# GoodSale VPS Deployment Checklist

Use this checklist to ensure you complete all deployment steps correctly.

## 📋 Pre-Deployment

- [ ] VPS server provisioned (Ubuntu 20.04+, 2GB+ RAM)
- [ ] Domain `goodsale.online` registered
- [ ] DNS A records configured:
  - [ ] `@` → VPS IP
  - [ ] `www` → VPS IP
  - [ ] `*` → VPS IP (for subdomains)
- [ ] SSH access to VPS confirmed
- [ ] Code ready to upload (committed to git or prepared for transfer)

## 🔧 Server Setup

- [ ] Connected to VPS via SSH
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Docker installed and verified
- [ ] Docker Compose installed and verified
- [ ] Application user created (optional)
- [ ] Application directory created: `/opt/goodsale`

## 📦 Application Deployment

- [ ] Code uploaded to `/opt/goodsale`
- [ ] `.env` file created from `.env.production`
- [ ] Environment variables configured:
  - [ ] `DB_PASSWORD` (strong password)
  - [ ] `NEXTAUTH_SECRET` (generated with openssl)
  - [ ] `NEXTAUTH_URL` (https://goodsale.online)
  - [ ] `NEXT_PUBLIC_BASE_DOMAIN` (goodsale.online)
  - [ ] `GOOGLE_GENAI_API_KEY`
  - [ ] `CRON_SECRET` (generated with openssl)
- [ ] Docker containers started: `docker compose up -d`
- [ ] Containers verified as healthy: `docker compose ps`

## 🗄️ Database Setup

- [ ] Database schema pushed: `docker compose exec app sh -c "npx drizzle-kit push"`
- [ ] Super admin seeded: `docker compose exec app sh -c "npx tsx scripts/seed-super-admin.ts"`
- [ ] Database connection tested

## 🌐 Web Server Configuration

- [ ] Nginx installed
- [ ] Nginx config copied to `/etc/nginx/sites-available/goodsale`
- [ ] Site enabled (symlink created in sites-enabled)
- [ ] Default site removed (optional)
- [ ] Nginx configuration tested: `sudo nginx -t`
- [ ] Nginx started and enabled

## 🔒 SSL Certificate

- [ ] Certbot installed
- [ ] SSL certificate obtained for `goodsale.online` and `www.goodsale.online`
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`
- [ ] HTTPS redirect verified

## 🔐 Security

- [ ] UFW firewall installed
- [ ] SSH port allowed: `sudo ufw allow OpenSSH`
- [ ] HTTP allowed: `sudo ufw allow 80/tcp`
- [ ] HTTPS allowed: `sudo ufw allow 443/tcp`
- [ ] Firewall enabled: `sudo ufw enable`
- [ ] Strong passwords used for all services
- [ ] Environment variables secured (not in git)

## ✅ Verification

- [ ] Application accessible at `http://localhost:3000`
- [ ] Nginx proxy working at `http://localhost`
- [ ] HTTPS working at `https://goodsale.online`
- [ ] WWW redirect working: `https://www.goodsale.online` → `https://goodsale.online`
- [ ] HTTP redirect working: `http://goodsale.online` → `https://goodsale.online`
- [ ] SSL certificate valid and trusted
- [ ] Nginx tests passing: `docker compose exec app npm test -- nginx-config.test.ts`

## 🔄 Automation

- [ ] Cron job for subscription renewal configured (cron-job.org or crontab)
- [ ] Backup script created: `/opt/goodsale/backup.sh`
- [ ] Backup script made executable
- [ ] Automated backups scheduled (daily at 3 AM)

## 🎯 Post-Deployment

- [ ] Admin login successful at `https://goodsale.online/admin/login`
- [ ] Default admin password changed immediately
- [ ] First business plan created
- [ ] Test tenant created
- [ ] Tenant login verified
- [ ] POS system tested
- [ ] Product management tested
- [ ] Customer management tested
- [ ] Reports and dashboard checked

## 📊 Monitoring & Maintenance

- [ ] Application logs accessible: `docker compose logs -f app`
- [ ] Health check script tested
- [ ] Update procedure documented and understood
- [ ] Monitoring service configured (UptimeRobot, etc.) - optional
- [ ] Error tracking configured (Sentry) - optional

## 📝 Documentation

- [ ] Environment variables documented (stored securely)
- [ ] Server access credentials saved
- [ ] DNS configuration documented
- [ ] SSL certificate renewal process understood
- [ ] Backup restoration procedure tested

## 🚨 Emergency Contacts

- VPS Provider: ____________________
- Domain Registrar: ____________________
- DNS Provider: ____________________
- Support Email: ____________________

---

## Quick Commands Reference

```bash
# Start/Stop Services
docker compose up -d           # Start all services
docker compose down            # Stop all services
docker compose restart app     # Restart application

# View Logs
docker compose logs -f app     # Follow application logs
docker compose logs postgres   # Database logs

# Database Operations
docker compose exec postgres psql -U goodsale  # Connect to database
./backup.sh                    # Manual backup

# Nginx Operations
sudo systemctl restart nginx   # Restart nginx
sudo nginx -t                  # Test configuration

# SSL Certificate
sudo certbot renew             # Renew certificates
sudo certbot certificates      # List certificates

# Health Check
docker compose ps              # Check container status
curl http://localhost:3000     # Test application
```

---

## Estimated Time to Complete

- **Initial Setup**: 15-20 minutes
- **Application Deployment**: 10-15 minutes
- **SSL Configuration**: 5-10 minutes
- **Testing & Verification**: 10-15 minutes
- **Total**: ~40-60 minutes

---

**Last Updated**: 2025-11-13
**Version**: 1.0
