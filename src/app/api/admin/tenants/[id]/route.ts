import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, tenants, auditLogs, users, sales } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch tenant
    const tenantData = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id));

    if (tenantData.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenant = tenantData[0];

    // Fetch tenant users
    const tenantUsers = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, id));

    // Fetch recent sales for this tenant (limit to 5)
    const tenantSales = await db
      .select()
      .from(sales)
      .where(eq(sales.tenantId, id))
      .orderBy(sales.createdAt)
      .limit(5);

    return NextResponse.json({
      tenant,
      users: tenantUsers,
      recentSales: tenantSales,
      stats: {
        totalUsers: tenantUsers.length,
        totalSales: tenantSales.length,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    // Verify super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, plan } = body;

    // Verify tenant exists
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Update tenant
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (plan) updates.plan = plan.toLowerCase();

    const updated = await db
      .update(tenants)
      .set(updates)
      .where(eq(tenants.id, id))
      .returning();

    // Log the action (userId null since super admins aren't in users table)
    await db.insert(auditLogs).values({
      userId: null,
      userName: token.name as string,
      action: 'UPDATE_TENANT',
      entity: 'tenant',
      entityId: id as string,
      details: {
        changes: updates,
      },
    }).catch(err => console.error('Audit log error:', err));

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    // Verify super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify tenant exists
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenantName = tenant[0].name;

    // Delete tenant (cascade will handle related records)
    await db.delete(tenants).where(eq(tenants.id, id));

    // Log the action (userId null since super admins aren't in users table)
    await db.insert(auditLogs).values({
      userId: null,
      userName: token.name as string,
      action: 'DELETE_TENANT',
      entity: 'tenant',
      entityId: id as string,
      details: {
        tenantName,
      },
    }).catch(err => console.error('Audit log error:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
