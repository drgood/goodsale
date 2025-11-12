# Subdomain Multi-Tenancy Setup

This app supports subdomain-based multi-tenancy where each tenant has their own subdomain:
- Production: `gshop.goodsale.online`
- Development: `gshop.localhost:9002`

## How It Works

1. **DNS Wildcard**: All `*.goodsale.online` subdomains point to your server
2. **Next.js Rewrites**: Subdomain requests are internally rewritten to `/:subdomain/:path`
3. **Middleware**: Extracts subdomain and validates tenant
4. **Routing**: Existing `/[tenant]/*` routes handle the actual pages

## Local Development Testing

### Option 1: Using localhost subdomains (Recommended)

Most browsers support `*.localhost` natively without configuration:

```bash
# Start the dev server
pnpm dev

# Access via subdomain
http://gshop.localhost:9002/dashboard
http://testshop.localhost:9002/pos
```

### Option 2: Using hosts file

**Windows:** Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator)
**Mac/Linux:** Edit `/etc/hosts` (with sudo)

Add entries:
```
127.0.0.1 gshop.localhost
127.0.0.1 testshop.localhost
```

Then access:
```
http://gshop.localhost:9002/dashboard
```

### Option 3: Path-based testing

You can still use the original path-based routing during development:
```
http://localhost:9002/gshop/dashboard
```

## Production Deployment

### 1. DNS Configuration

Add a wildcard A record at your DNS provider (e.g., Cloudflare, Route53):

```
Type: A
Name: *
Value: Your server IP address
TTL: Auto or 300

OR

Type: CNAME  
Name: *
Value: yourdomain.com
TTL: Auto or 300
```

This makes all `*.goodsale.online` subdomains point to your server.

### 2. SSL Certificate

Use a wildcard SSL certificate for `*.goodsale.online`:

**With Let's Encrypt:**
```bash
certbot certonly --manual \
  --preferred-challenges dns \
  -d goodsale.online \
  -d *.goodsale.online
```

**With Cloudflare:**
- Cloudflare automatically provides SSL for wildcard domains if you use their proxy

### 3. Reverse Proxy (Nginx/Caddy)

**Nginx example:**
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name *.goodsale.online goodsale.online;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy example (simpler):**
```
*.goodsale.online, goodsale.online {
    reverse_proxy localhost:3000
}
```

### 4. Environment Variables

Make sure `.env` has:
```env
NEXT_PUBLIC_BASE_DOMAIN=goodsale.online
NEXTAUTH_URL=https://goodsale.online
```

### 5. Docker Deployment

If using Docker, ensure the container can access the host header:

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BASE_DOMAIN=goodsale.online
      - NEXTAUTH_URL=https://goodsale.online
```

## Testing Subdomain Routing

### 1. Create a test tenant
```bash
# Via admin panel or directly in database
INSERT INTO tenants (name, subdomain, status) 
VALUES ('Test Shop', 'testshop', 'active');
```

### 2. Access the tenant subdomain
```
# Development
http://testshop.localhost:9002/dashboard

# Production
https://testshop.goodsale.online/dashboard
```

## Utilities Available

The app provides helper functions in `src/lib/subdomain.ts`:

```typescript
import { 
  extractSubdomain, 
  getCurrentSubdomain, 
  buildSubdomainUrl,
  isValidSubdomain 
} from '@/lib/subdomain';

// Extract subdomain from host
const subdomain = extractSubdomain('gshop.goodsale.online'); // 'gshop'

// Get current subdomain (server component)
const current = await getCurrentSubdomain();

// Build subdomain URL
const url = buildSubdomainUrl('gshop', '/dashboard'); 
// http://gshop.localhost:9002/dashboard (dev)
// https://gshop.goodsale.online/dashboard (prod)

// Validate subdomain format
isValidSubdomain('my-shop'); // true
isValidSubdomain('My Shop'); // false
```

## Common Issues

### 1. "Site can't be reached" on subdomains locally
- Ensure you're using `*.localhost` (works natively in most browsers)
- Or add entries to your hosts file
- Try a different browser (Chrome/Firefox support localhost subdomains)

### 2. Subdomain redirects to main domain
- Check Next.js config rewrites are correct
- Verify middleware is extracting subdomain properly
- Check browser dev tools Network tab for the Host header

### 3. SSL errors in production
- Ensure wildcard SSL certificate covers `*.goodsale.online`
- Check certificate is properly configured in reverse proxy
- Use Cloudflare for automatic SSL if DNS is through them

### 4. Wrong tenant loaded
- Verify subdomain in database matches URL
- Check middleware logs for extracted subdomain
- Ensure tenant lookup is using subdomain field

## Migration from Path-Based to Subdomain

If you have existing tenants using path-based URLs (`/gshop/dashboard`):

1. Keep both routing methods working (they can coexist)
2. Notify users of the new subdomain URLs
3. Add redirects in middleware to suggest subdomain:
```typescript
if (!subdomain && path.startsWith('/[tenant]')) {
  const tenant = path.split('/')[1];
  return NextResponse.redirect(buildSubdomainUrl(tenant, restOfPath));
}
```

## Benefits of Subdomain Multi-Tenancy

✅ Better branding - `yourstore.goodsale.online` vs `goodsale.online/yourstore`
✅ Easier marketing - shorter, cleaner URLs
✅ SSL per subdomain (with wildcard cert)
✅ Isolated sessions and cookies per subdomain
✅ Better SEO - each tenant is a separate "site"
✅ Professional appearance
