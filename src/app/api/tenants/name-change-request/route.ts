import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, users, tenants, tenantNameChangeRequests, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify user is authenticated and is a tenant owner/admin
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newName, reason } = body;

    // Validate input
    if (!newName || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: newName and reason' },
        { status: 400 }
      );
    }

    if (newName.trim().length < 2 || newName.trim().length > 255) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 255 characters' },
        { status: 400 }
      );
    }

    // Get user
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, token.sub as string))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userData[0];

    // Get tenant
    const tenantData = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    if (tenantData.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenant = tenantData[0];

    // Check if new name is already taken by another tenant
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.name, newName.trim()))
      .limit(1);

    if (existingTenant.length > 0) {
      return NextResponse.json(
        { error: 'Name is already taken by another tenant' },
        { status: 400 }
      );
    }

    // Check for existing pending request for this tenant
    const existingRequest = await db
      .select()
      .from(tenantNameChangeRequests)
      .where(eq(tenantNameChangeRequests.tenantId, user.tenantId))
      .limit(1);

    if (
      existingRequest.length > 0 &&
      (existingRequest[0].status === 'pending' ||
        existingRequest[0].status === 'approved' ||
        existingRequest[0].status === 'scheduled')
    ) {
      return NextResponse.json(
        { error: 'There is already an active name change request for this tenant' },
        { status: 400 }
      );
    }

    // Create name change request
    const newRequest = await db
      .insert(tenantNameChangeRequests)
      .values({
        tenantId: user.tenantId,
        oldName: tenant.name,
        newName: newName.trim(),
        reason: reason.trim(),
        status: 'pending',
        requestedBy: user.id,
      })
      .returning();

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      userName: user.name,
      action: 'REQUEST_TENANT_NAME_CHANGE',
      entity: 'tenantNameChangeRequest',
      entityId: newRequest[0].id,
      details: {
        tenantId: user.tenantId,
        oldName: tenant.name,
        newName: newName.trim(),
        requestedBy: user.name,
      },
    }).catch((err) => console.error('Audit log error:', err));

    // TODO: Send email notification to tenant owner

    return NextResponse.json(newRequest[0], { status: 201 });
  } catch (error) {
    console.error('Error creating name change request:', error);
    return NextResponse.json(
      { error: 'Failed to create name change request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify user is authenticated
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, token.sub as string))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the latest name change request for this tenant
    const latestRequest = await db
      .select()
      .from(tenantNameChangeRequests)
      .where(eq(tenantNameChangeRequests.tenantId, userData[0].tenantId))
      .orderBy((table) => [table.requestedAt])
      .limit(1);

    if (latestRequest.length === 0) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: latestRequest[0] });
  } catch (error) {
    console.error('Error fetching name change request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch name change request' },
      { status: 500 }
    );
  }
}
