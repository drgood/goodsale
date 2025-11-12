'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TenantRootPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  useEffect(() => {
    // Check if we're on a subdomain by looking at the host
    const isSubdomain = window.location.host.includes('.localhost') || 
                        window.location.host.includes('.goodsale.online');
    
    if (isSubdomain) {
      // On subdomain: use clean URL
      router.replace('/login');
    } else {
      // Path-based: use full path
      router.replace(`/${tenant}/login`);
    }
  }, [tenant, router]);

  return null;
}
