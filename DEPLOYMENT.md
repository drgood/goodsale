# GoodSale Deployment Guide

This guide will help you deploy GoodSale to your Contabo VPS.

## Prerequisites on VPS

1. Ubuntu 20.04+ or similar Linux distribution
2. Root or sudo access
3. Domain name pointing to your VPS IP

## Deployment Options

### Option 1: Podman Deployment (Recommended)

**For Podman deployment, see [DEPLOYMENT-PODMAN.md](./DEPLOYMENT-PODMAN.md)**

Podman offers better security with rootless containers and no daemon requirement.

---

### Option 2: Docker Deployment

#### 1. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Clone/Upload Your Code

```bash
# Using git
git clone <your-repo-url> /opt/goodsale
cd /opt/goodsale

# OR upload via SCP/SFTP
scp -r /path/to/GoodSale user@your-vps-ip:/opt/goodsale
```

#### 3. Configure Environment Variables

```bash
cd /opt/goodsale
cp .env.production .env

# Edit the .env file
nano .env
```

Fill in:
- `DB_PASSWORD` - Strong database password
- `NEXTAUTH_URL` - Your domain (https://yourdomain.com)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_GENAI_API_KEY` - Your Google AI API key

#### 4. Build and Start Services

```bash
# Build and start containers
docker compose up -d

# Check if containers are running
docker compose ps

# View logs
docker compose logs -f app
```

#### 5. Run Database Migrations

```bash
# Enter the app container
docker compose exec app sh

# Inside container, run migrations
pnpm db:push

# Seed admin user
pnpm db:seed:admin

# Exit container
exit
```

#### 6. Setup Nginx (Optional but recommended)

```bash
# Install Nginx
sudo apt-get install nginx

# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/goodsale

# Update domain name in the config
sudo nano /etc/nginx/sites-available/goodsale

# Enable site
sudo ln -s /etc/nginx/sites-available/goodsale /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 7. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

---

### Option 3: PM2 Deployment (Alternative)

#### 1. Install Node.js & pnpm

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2
```

#### 2. Install PostgreSQL

```bash
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE goodsale;
CREATE USER goodsale WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE goodsale TO goodsale;
\q
```

#### 3. Clone/Upload Code and Install Dependencies

```bash
cd /opt/goodsale
pnpm install
```

#### 4. Configure Environment Variables

```bash
cp .env.production .env
nano .env
```

Update `DATABASE_URL`:
```
DATABASE_URL=postgresql://goodsale:your_password@localhost:5432/goodsale
```

#### 5. Build and Run Migrations

```bash
# Build the app
pnpm build

# Run migrations
pnpm db:push

# Seed admin user
pnpm db:seed:admin
```

#### 6. Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start app with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status
pm2 logs goodsale
```

#### 7. Setup Nginx (same as Docker option above)

---

## Maintenance Commands

### Docker

```bash
# View logs
docker compose logs -f app

# Restart app
docker compose restart app

# Stop all services
docker compose down

# Update app
git pull
docker compose build
docker compose up -d

# Backup database
docker compose exec postgres pg_dump -U goodsale goodsale > backup.sql
```

### PM2

```bash
# View logs
pm2 logs goodsale

# Restart app
pm2 restart goodsale

# Stop app
pm2 stop goodsale

# Update app
git pull
pnpm install
pnpm build
pm2 restart goodsale
```

## Troubleshooting

### Check if app is running
```bash
curl http://localhost:3000
```

### Check database connection
```bash
# Docker
docker compose exec app pnpm db:studio

# PM2
pnpm db:studio
```

### View application logs
```bash
# Docker
docker compose logs -f app

# PM2
pm2 logs goodsale
```

### Reset database (⚠️ destroys all data)
```bash
# Docker
docker compose down -v
docker compose up -d
docker compose exec app pnpm db:push
docker compose exec app pnpm db:seed:admin

# PM2
pnpm db:drop
pnpm db:push
pnpm db:seed:admin
```

## Security Checklist

- [ ] Strong database password set
- [ ] NEXTAUTH_SECRET generated with `openssl rand -base64 32`
- [ ] SSL certificate installed (HTTPS)
- [ ] Firewall configured (UFW recommended)
- [ ] Regular backups scheduled
- [ ] Environment variables not committed to git
- [ ] Database not exposed to internet (only localhost)
- [ ] Nginx rate limiting configured (optional)

## Support

For issues, check:
1. Application logs
2. Database connectivity
3. Environment variables
4. Nginx configuration
5. Firewall rules

## Default Super Admin Credentials

After running `db:seed:admin`, login with:
- **Email**: admin@goodsale.com
- **Password**: Admin@123

**⚠️ Change this password immediately after first login!**
