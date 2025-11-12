import { headers } from 'next/headers';

/**
 * Extract subdomain from the host header
 * @param host - The host header value (e.g., "gshop.goodsale.online")
 * @returns The subdomain or null if not found
 */
export function extractSubdomain(host: string | null): string | null {
  if (!host) return null;

  // Remove port if present
  const hostWithoutPort = host.split(':')[0];

  // Check if it's a subdomain of goodsale.online
  const match = hostWithoutPort.match(/^([^.]+)\.goodsale\.online$/);
  if (match) {
    const subdomain = match[1];
    // Exclude common system subdomains
    if (['www', 'admin', 'api'].includes(subdomain)) {
      return null;
    }
    return subdomain;
  }

  // For development: handle localhost subdomains like "gshop.localhost:9002"
  const localhostMatch = hostWithoutPort.match(/^([^.]+)\.localhost$/);
  if (localhostMatch) {
    return localhostMatch[1];
  }

  return null;
}

/**
 * Get the current subdomain from request headers (for server components)
 */
export async function getCurrentSubdomain(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get('host');
  return extractSubdomain(host);
}

/**
 * Get the base domain based on environment
 */
export function getBaseDomain(): string {
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    return process.env.NEXT_PUBLIC_BASE_DOMAIN || 'goodsale.online';
  }
  return 'localhost:9002';
}

/**
 * Build a subdomain URL
 * @param subdomain - The tenant subdomain
 * @param path - Optional path to append
 */
export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
  const baseDomain = getBaseDomain();
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${subdomain}.${baseDomain}${path}`;
}

/**
 * Check if the current request is from a subdomain
 */
export async function isSubdomainRequest(): Promise<boolean> {
  const subdomain = await getCurrentSubdomain();
  return subdomain !== null;
}

/**
 * Validate subdomain format (alphanumeric and hyphens, 3-63 chars)
 */
export function isValidSubdomain(subdomain: string): boolean {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  return subdomainRegex.test(subdomain);
}
