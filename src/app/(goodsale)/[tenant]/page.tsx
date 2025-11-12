'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TenantRootPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  useEffect(() => {
    router.replace(`/${tenant}/login`);
  }, [tenant, router]);

  return null;
}
