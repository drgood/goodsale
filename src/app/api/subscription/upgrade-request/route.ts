import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, subscriptionRequests, auditLogs, tenants, plans } from '@/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify user is authenticated
    if (!token?.sub || !token?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, billingPeriod, contactInfo, totalAmount } = body;

    // Validate input
    if (!planId || !billingPeriod || !contactInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get tenant and plan info for the request
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, token.tenantId as string))
      .limit(1);

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!tenant || !plan) {
      return NextResponse.json(
        { error: 'Tenant or plan not found' },
        { status: 404 }
      );
    }

    // Create subscription request
    const [newRequest] = await db
      .insert(subscriptionRequests)
      .values({
        tenantId: token.tenantId as string,
        planId,
        billingPeriod,
        totalAmount: parseFloat(totalAmount).toString(),
        contactName: contactInfo.name,
        contactPhone: contactInfo.phone,
        contactEmail: contactInfo.email || null,
        requestedBy: token.sub as string,
        status: 'pending',
      })
      .returning();

    // Log the action in audit logs
    await db
      .insert(auditLogs)
      .values({
        userId: token.sub as string,
        userName: token.name as string || 'Unknown',
        action: 'SUBSCRIPTION_UPGRADE_REQUEST',
        entity: 'subscription_requests',
        entityId: newRequest.id,
        details: {
          tenantName: tenant.name,
          planName: plan.name,
          billingPeriod,
          totalAmount,
        },
      })
      .catch((err) => console.error('Audit log error:', err));

    // TODO: Send notification to admin/sales team
    // TODO: Send confirmation email to tenant

    return NextResponse.json(
      { 
        success: true,
        message: 'Upgrade request submitted successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting upgrade request:', error);
    return NextResponse.json(
      { error: 'Failed to submit upgrade request' },
      { status: 500 }
    );
  }
}
