# GoodSale Podman Deployment Guide

This guide will help you deploy GoodSale to your Contabo VPS using **Podman** instead of Docker.

## Why Podman?

- **Rootless containers** - Better security (no daemon running as root)
- **Daemonless** - No background service required
- **Docker-compatible** - Drop-in replacement for Docker CLI
- **Systemd integration** - Native systemd service generation
- **Pod support** - Kubernetes-like pod management

## Prerequisites on VPS

1. Ubuntu 20.04+ or similar Linux distribution
2. Root or sudo access
3. Domain name pointing to your VPS IP

---

## Podman Deployment

### 1. Install Podman & Podman Compose

```bash
# Update system
sudo apt-get update

# Install Podman
sudo apt-get install -y podman

# Install Podman Compose (Python-based)
sudo apt-get install -y python3-pip
pip3 install podman-compose

# OR install using package manager (Ubuntu 22.04+)
sudo apt-get install -y podman-compose

# Verify installation
podman --version
podman-compose --version
```

### 2. Configure Podman for Rootless Mode (Recommended)

```bash
# Enable user namespaces (if not already enabled)
sudo sysctl -w kernel.unprivileged_userns_clone=1

# Make it persistent
echo 'kernel.unprivileged_userns_clone=1' | sudo tee -a /etc/sysctl.conf

# Configure subuid and subgid for your user
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER

# Enable lingering (keep user services running after logout)
loginctl enable-linger $USER

# Verify podman info
podman info
```

### 3. Clone/Upload Your Code

```bash
# Using git
git clone <your-repo-url> /opt/goodsale
cd /opt/goodsale

# OR upload via SCP/SFTP
scp -r /path/to/GoodSale user@your-vps-ip:/opt/goodsale
cd /opt/goodsale
```

### 4. Configure Environment Variables

```bash
cp .env.production .env

# Edit the .env file
nano .env
```

Fill in:
- `DB_PASSWORD` - Strong database password
- `NEXTAUTH_URL` - Your domain (https://yourdomain.com)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_GENAI_API_KEY` - Your Google AI API key

### 5. Build and Start Services with Podman Compose

```bash
# Build and start containers
podman-compose up -d

# Check if containers are running
podman-compose ps

# View logs
podman-compose logs -f app

# Alternative: View logs for specific service
podman logs -f goodsale-app
```

### 6. Run Database Migrations

```bash
# Enter the app container
podman exec -it goodsale-app sh

# Inside container, run migrations
pnpm db:push

# Seed admin user
pnpm db:seed:admin

# Exit container
exit
```

### 7. Create Systemd Services (Auto-start on Boot)

Podman integrates beautifully with systemd. Generate systemd unit files:

```bash
# Create systemd user directory
mkdir -p ~/.config/systemd/user

# Generate systemd service files for the pod
cd /opt/goodsale
podman generate systemd --new --files --name goodsale-app
podman generate systemd --new --files --name goodsale-db

# Move service files to systemd directory
mv *.service ~/.config/systemd/user/

# Reload systemd
systemctl --user daemon-reload

# Enable services to start on boot
systemctl --user enable container-goodsale-app.service
systemctl --user enable container-goodsale-db.service

# Start services
systemctl --user start container-goodsale-app.service
systemctl --user start container-goodsale-db.service

# Check status
systemctl --user status container-goodsale-app.service
```

**Alternative: Create a Pod and Generate Pod Service**

```bash
# Stop existing containers
podman-compose down

# Create a pod (like Kubernetes pod - containers share network)
podman pod create --name goodsale-pod -p 3000:3000 -p 5432:5432

# Run database in pod
podman run -d --pod goodsale-pod \
  --name goodsale-db \
  -e POSTGRES_USER=goodsale \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=goodsale \
  -v goodsale_postgres_data:/var/lib/postgresql/data:Z \
  docker.io/library/postgres:16-alpine

# Build and run app in pod
podman build -t goodsale-app .
podman run -d --pod goodsale-pod \
  --name goodsale-app \
  -e DATABASE_URL=postgresql://goodsale:your_password@localhost:5432/goodsale \
  -e NEXTAUTH_URL=https://yourdomain.com \
  -e NEXTAUTH_SECRET=your_secret \
  -e GOOGLE_GENAI_API_KEY=your_key \
  -e NODE_ENV=production \
  localhost/goodsale-app

# Generate systemd service for the entire pod
podman generate systemd --new --files --name goodsale-pod
mv pod-goodsale-pod.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable pod-goodsale-pod.service
systemctl --user start pod-goodsale-pod.service
```

### 8. Setup Nginx (Reverse Proxy)

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

### 9. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## Maintenance Commands

### Podman Compose Commands

```bash
# View logs
podman-compose logs -f app

# Restart app
podman-compose restart app

# Stop all services
podman-compose down

# Update app
git pull
podman-compose build
podman-compose up -d

# Remove everything (including volumes)
podman-compose down -v
```

### Direct Podman Commands

```bash
# List all containers
podman ps -a

# List all pods
podman pod ps

# View logs
podman logs -f goodsale-app

# Stop container
podman stop goodsale-app

# Start container
podman start goodsale-app

# Restart container
podman restart goodsale-app

# Remove container
podman rm goodsale-app

# List images
podman images

# Remove image
podman rmi goodsale-app
```

### Systemd Commands (if using systemd services)

```bash
# View status
systemctl --user status container-goodsale-app.service

# View logs
journalctl --user -u container-goodsale-app.service -f

# Restart service
systemctl --user restart container-goodsale-app.service

# Stop service
systemctl --user stop container-goodsale-app.service

# Start service
systemctl --user start container-goodsale-app.service

# Disable auto-start
systemctl --user disable container-goodsale-app.service
```

### Database Backup

```bash
# Backup database
podman exec goodsale-db pg_dump -U goodsale goodsale > backup_$(date +%Y%m%d).sql

# Restore database
podman exec -i goodsale-db psql -U goodsale goodsale < backup_20250112.sql
```

---

## Troubleshooting

### Check if app is running
```bash
curl http://localhost:3000
```

### Check container logs
```bash
podman logs goodsale-app
podman logs goodsale-db
```

### Check database connection
```bash
podman exec -it goodsale-app pnpm db:studio
```

### Permission issues with volumes
If you encounter permission issues with volumes, ensure the `:Z` flag is used:
```bash
# Correct
-v postgres_data:/var/lib/postgresql/data:Z

# The :Z flag tells Podman to relabel the volume for SELinux
```

### Rootless networking issues
If containers can't communicate:
```bash
# Check if slirp4netns is installed
which slirp4netns

# Install if missing
sudo apt-get install slirp4netns
```

### Port already in use
```bash
# Check what's using the port
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 <PID>
```

---

## Security Benefits of Podman

1. **Rootless by default** - Containers run as your user, not as root
2. **No daemon** - No long-running privileged process
3. **SELinux support** - Better isolation with SELinux labels (`:Z` flag)
4. **Fork/exec model** - Each container is a child process
5. **User namespaces** - Complete isolation from host

---

## Podman vs Docker Command Comparison

| Docker Command | Podman Command |
|---------------|----------------|
| `docker ps` | `podman ps` |
| `docker images` | `podman images` |
| `docker build` | `podman build` |
| `docker run` | `podman run` |
| `docker-compose up` | `podman-compose up` |
| `docker exec` | `podman exec` |
| `docker logs` | `podman logs` |

**Tip**: You can alias docker to podman:
```bash
echo "alias docker=podman" >> ~/.bashrc
source ~/.bashrc
```

---

## Default Super Admin Credentials

After running `db:seed:admin`, login with:
- **Email**: admin@goodsale.com
- **Password**: Admin@123

**⚠️ Change this password immediately after first login!**

---

## Additional Resources

- [Podman Official Docs](https://docs.podman.io/)
- [Podman Compose](https://github.com/containers/podman-compose)
- [Rootless Containers](https://rootlesscontaine.rs/)
