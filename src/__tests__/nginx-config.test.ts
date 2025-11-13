import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Nginx Configuration Tests', () => {
  let nginxConfig: string;

  beforeAll(() => {
    // Read the nginx.conf file
    const configPath = resolve(process.cwd(), 'nginx.conf');
    nginxConfig = readFileSync(configPath, 'utf-8');
  });

  describe('HTTP to HTTPS Redirects', () => {
    it('should redirect HTTP requests to goodsale.online to https://goodsale.online', () => {
      // Verify server block listens on port 80
      expect(nginxConfig).toMatch(/listen 80;/);
      
      // Verify server_name includes goodsale.online
      const httpServerBlock = extractServerBlock(nginxConfig, 'listen 80;');
      expect(httpServerBlock).toMatch(/server_name[^;]*goodsale\.online/);
      
      // Verify 301 redirect to https://goodsale.online
      expect(httpServerBlock).toMatch(/return 301 https:\/\/goodsale\.online\$request_uri;/);
    });

    it('should redirect HTTP requests to www.goodsale.online to https://goodsale.online', () => {
      // Verify server block listens on port 80
      expect(nginxConfig).toMatch(/listen 80;/);
      
      // Verify server_name includes www.goodsale.online
      const httpServerBlock = extractServerBlock(nginxConfig, 'listen 80;');
      expect(httpServerBlock).toMatch(/server_name[^;]*www\.goodsale\.online/);
      
      // Verify 301 redirect to https://goodsale.online (not www)
      expect(httpServerBlock).toMatch(/return 301 https:\/\/goodsale\.online\$request_uri;/);
    });
  });

  describe('HTTPS Redirects', () => {
    it('should redirect HTTPS requests to www.goodsale.online to https://goodsale.online', () => {
      // Find the HTTPS www server block
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const wwwHttpsBlock = serverBlocks.find(block => 
        block.includes('listen 443 ssl') && 
        block.includes('server_name www.goodsale.online;') &&
        !block.includes('server_name goodsale.online;')
      );
      
      expect(wwwHttpsBlock).toBeDefined();
      expect(wwwHttpsBlock).toMatch(/return 301 https:\/\/goodsale\.online\$request_uri;/);
    });

    it('should serve HTTPS requests to goodsale.online directly without redirect', () => {
      // Find the main HTTPS server block
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const mainHttpsBlock = serverBlocks.find(block => 
        block.includes('listen 443 ssl') && 
        block.includes('server_name goodsale.online;') &&
        !block.includes('www.goodsale.online;')
      );
      
      expect(mainHttpsBlock).toBeDefined();
      
      // Should NOT contain a redirect
      expect(mainHttpsBlock).not.toMatch(/return 301/);
      
      // Should contain proxy_pass to serve the application
      expect(mainHttpsBlock).toMatch(/proxy_pass http:\/\/localhost:3000/);
    });
  });

  describe('SSL Certificate Configuration', () => {
    it('should load correct SSL certificates for goodsale.online', () => {
      // Find the main HTTPS server block
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const mainHttpsBlock = serverBlocks.find(block => 
        block.includes('listen 443 ssl') && 
        block.includes('server_name goodsale.online;') &&
        !block.includes('www.goodsale.online;')
      );
      
      expect(mainHttpsBlock).toBeDefined();
      
      // Verify SSL certificate paths
      expect(mainHttpsBlock).toMatch(/ssl_certificate\s+\/etc\/letsencrypt\/live\/goodsale\.online\/fullchain\.pem;/);
      expect(mainHttpsBlock).toMatch(/ssl_certificate_key\s+\/etc\/letsencrypt\/live\/goodsale\.online\/privkey\.pem;/);
    });

    it('should load correct SSL certificates for www.goodsale.online redirect', () => {
      // Find the HTTPS www server block
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const wwwHttpsBlock = serverBlocks.find(block => 
        block.includes('listen 443 ssl') && 
        block.includes('server_name www.goodsale.online;') &&
        !block.includes('server_name goodsale.online;')
      );
      
      expect(wwwHttpsBlock).toBeDefined();
      
      // Verify SSL certificate paths (same as main domain for wildcard cert)
      expect(wwwHttpsBlock).toMatch(/ssl_certificate\s+\/etc\/letsencrypt\/live\/goodsale\.online\/fullchain\.pem;/);
      expect(wwwHttpsBlock).toMatch(/ssl_certificate_key\s+\/etc\/letsencrypt\/live\/goodsale\.online\/privkey\.pem;/);
    });

    it('should configure SSL protocols correctly', () => {
      // Find the main HTTPS server block
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const mainHttpsBlock = serverBlocks.find(block => 
        block.includes('listen 443 ssl') && 
        block.includes('server_name goodsale.online;') &&
        !block.includes('www.goodsale.online;')
      );
      
      expect(mainHttpsBlock).toBeDefined();
      
      // Verify SSL protocols (should use TLSv1.2 and TLSv1.3)
      expect(mainHttpsBlock).toMatch(/ssl_protocols\s+TLSv1\.2\s+TLSv1\.3;/);
    });

    it('should configure SSL ciphers correctly', () => {
      // Find the main HTTPS server block
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const mainHttpsBlock = serverBlocks.find(block => 
        block.includes('listen 443 ssl') && 
        block.includes('server_name goodsale.online;') &&
        !block.includes('www.goodsale.online;')
      );
      
      expect(mainHttpsBlock).toBeDefined();
      
      // Verify SSL ciphers configuration
      expect(mainHttpsBlock).toMatch(/ssl_ciphers\s+HIGH:!aNULL:!MD5;/);
      expect(mainHttpsBlock).toMatch(/ssl_prefer_server_ciphers\s+on;/);
    });
  });

  describe('Server Configuration Count', () => {
    it('should have exactly 3 server blocks configured', () => {
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      expect(serverBlocks.length).toBe(3);
    });

    it('should have 1 HTTP server block', () => {
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const httpBlocks = serverBlocks.filter(block => 
        block.includes('listen 80;')
      );
      expect(httpBlocks.length).toBe(1);
    });

    it('should have 2 HTTPS server blocks', () => {
      const serverBlocks = extractAllServerBlocks(nginxConfig);
      const httpsBlocks = serverBlocks.filter(block => 
        block.includes('listen 443 ssl')
      );
      expect(httpsBlocks.length).toBe(2);
    });
  });
});

/**
 * Helper function to extract a server block containing a specific pattern
 */
function extractServerBlock(config: string, pattern: string): string {
  const blocks = extractAllServerBlocks(config);
  return blocks.find(block => block.includes(pattern)) || '';
}

/**
 * Helper function to extract all server blocks from nginx config
 */
function extractAllServerBlocks(config: string): string[] {
  const blocks: string[] = [];
  const lines = config.split('\n');
  let currentBlock = '';
  let braceDepth = 0;
  let inServerBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('server {')) {
      inServerBlock = true;
      currentBlock = line + '\n';
      braceDepth = 1;
      continue;
    }

    if (inServerBlock) {
      currentBlock += line + '\n';
      
      // Count braces to track block depth
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      // When we close the server block
      if (braceDepth === 0) {
        blocks.push(currentBlock);
        currentBlock = '';
        inServerBlock = false;
      }
    }
  }

  return blocks;
}
