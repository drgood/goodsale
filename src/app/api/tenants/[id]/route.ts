import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, tenants } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    // Verify user is authenticated
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: tenantId } = await params;

    // Debug logging
    console.log('Tenant API Debug:', {
      tokenId: token.sub,
      tokenTenantId: token.tenantId,
      isSuperAdmin: token.isSuperAdmin,
      requestedTenantId: tenantId,
      canAccess: token.isSuperAdmin || token.tenantId === tenantId
    });

    // Fetch tenant
    const tenantData = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenantData.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Verify user belongs to this tenant (unless super admin)
    if (!token.isSuperAdmin && token.tenantId !== tenantId) {
      console.error('Access Denied:', {
        isSuperAdmin: token.isSuperAdmin,
        tokenTenantId: token.tenantId,
        requestedTenantId: tenantId
      });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(tenantData[0]);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}
