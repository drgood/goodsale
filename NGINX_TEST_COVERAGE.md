# Nginx Configuration Test Coverage

## Overview
This document describes the unit tests added for validating the nginx configuration for goodsale.online.

## Test File Location
`src/__tests__/nginx-config.test.ts`

## Test Coverage

### 1. HTTP to HTTPS Redirects
✅ **Test Case 1:** HTTP requests to goodsale.online are redirected to https://goodsale.online
- Verifies that the server listens on port 80
- Confirms server_name includes goodsale.online
- Validates 301 redirect to https://goodsale.online

✅ **Test Case 2:** HTTP requests to www.goodsale.online are redirected to https://goodsale.online
- Verifies that the server listens on port 80
- Confirms server_name includes www.goodsale.online
- Validates 301 redirect to https://goodsale.online (not www)

### 2. HTTPS Redirects
✅ **Test Case 3:** HTTPS requests to www.goodsale.online are redirected to https://goodsale.online
- Locates the HTTPS www server block (port 443 with SSL)
- Verifies server_name is www.goodsale.online
- Validates 301 redirect to canonical domain (https://goodsale.online)

✅ **Test Case 4:** HTTPS requests to goodsale.online are served directly
- Locates the main HTTPS server block
- Confirms there is NO redirect (no return 301)
- Verifies proxy_pass to localhost:3000 for serving the application

### 3. SSL Certificate Configuration
✅ **Test Case 5:** The correct SSL certificates are loaded for goodsale.online
- Verifies ssl_certificate path: `/etc/letsencrypt/live/goodsale.online/fullchain.pem`
- Verifies ssl_certificate_key path: `/etc/letsencrypt/live/goodsale.online/privkey.pem`
- Confirms SSL protocols: TLSv1.2 and TLSv1.3
- Validates SSL ciphers configuration: HIGH:!aNULL:!MD5
- Checks ssl_prefer_server_ciphers is enabled

### Additional Test Coverage

#### SSL Certificate for www subdomain
- Verifies www.goodsale.online HTTPS block uses the same certificate
- Ensures certificate includes both domain and www subdomain as SANs

#### Server Block Configuration
- Validates exactly 3 server blocks exist
- Confirms 1 HTTP server block (port 80)
- Confirms 2 HTTPS server blocks (port 443 with SSL)

## Running the Tests

### Run all tests
```bash
npm test
```

### Run only nginx configuration tests
```bash
npm test -- nginx-config.test.ts
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Implementation Details

### Helper Functions
The test suite includes two helper functions for parsing nginx configuration:

1. **extractServerBlock(config, pattern)**: Extracts a single server block containing a specific pattern
2. **extractAllServerBlocks(config)**: Parses the nginx config and extracts all server blocks by tracking brace depth

### Test Methodology
- Tests parse the actual `nginx.conf` file at runtime
- Regular expressions validate configuration patterns
- Server blocks are isolated and tested independently
- No mocking - tests verify the actual configuration file

## Current Test Results
All 11 tests passing ✅
- 2 HTTP to HTTPS redirect tests
- 2 HTTPS redirect/serve tests
- 4 SSL certificate configuration tests
- 3 server block structure tests

## Maintenance Notes
- Tests should be run after any nginx configuration changes
- If domain name changes, update test expectations accordingly
- SSL certificate paths are based on Let's Encrypt standard locations
- Tests validate configuration structure, not runtime behavior
