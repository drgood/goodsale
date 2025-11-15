'use client';

import { useParams } from 'next/navigation';

/**
 * Hook for tenant-aware navigation
 * Now assumes path-based routing only (/:tenant/...).
 */
export function useTenantNavigation() {
  const params = useParams();
  const tenant = params.tenant as string | undefined;

  const isSubdomain = false;

  /**
   * Build a tenant-aware path
   * @param path - The path without tenant (e.g., '/dashboard', '/pos')
   * @returns Tenant-prefixed path when tenant is known, otherwise the raw path
   */
  const buildPath = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (tenant) {
      return `/${tenant}${normalizedPath}`;
    }

    return normalizedPath;
  };

  return {
    buildPath,
    isSubdomain,
    tenant,
  };
}
