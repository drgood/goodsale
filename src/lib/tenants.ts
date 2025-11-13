import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';

export async function getTenantBySubdomain(subdomain: string) {
  // Skip reserved subdomains (optional)
  if (!subdomain || ['www', 'admin'].includes(subdomain)) return null;

  // Query your database for the tenant
  const result = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.subdomain, subdomain),
  });

  return result;
}
