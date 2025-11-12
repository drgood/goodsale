'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Hook for tenant-aware navigation
 * Automatically returns clean URLs based on whether we're on a subdomain or path-based routing
 */
export function useTenantNavigation() {
  const params = useParams();
  const tenant = params.tenant as string | undefined;

  const isSubdomain = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.host.includes('.localhost') || 
           window.location.host.includes('.goodsale.online');
  }, []);

  /**
   * Build a tenant-aware path
   * @param path - The path without tenant (e.g., '/dashboard', '/pos')
   * @returns Clean path for subdomain or full path for path-based routing
   */
  const buildPath = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    if (isSubdomain) {
      // On subdomain: just return the path
      return normalizedPath;
    } else if (tenant) {
      // Path-based: include tenant
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
