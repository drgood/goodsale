import { NextRequest, NextResponse } from 'next/server';
import { db, subscriptions, tenants, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Admin endpoint to manually activate a subscription after cash payment
 * POST /api/admin/subscriptions/activate
 * 
 * Body:
 * {
 *   tenantId: "tenant-uuid",
 *   newPlanId: "plan-id",
 *   billingPeriod: "1_month" | "6_months" | "12_months" | "24_months",
 *   amount: 29.99,
 *   notes: "Payment received via bank transfer"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify super admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - super admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tenantId, newPlanId, billingPeriod, amount, notes } = body;

    if (!tenantId || !newPlanId || !billingPeriod || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get current subscription
    const [currentSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId));

    if (!currentSub) {
      return NextResponse.json(
        { error: 'No subscription found for this tenant' },
        { status: 404 }
      );
    }

    // Calculate new end date based on billing period
    const newEndDate = new Date();
    const periodMonths = {
      '1_month': 1,
      '6_months': 6,
      '12_months': 12,
      '24_months': 24,
    }[billingPeriod] || 1;

    newEndDate.setMonth(newEndDate.getMonth() + periodMonths);

    // Update subscription
    const updated = await db
      .update(subscriptions)
      .set({
        status: 'active',
        planId: newPlanId,
        billingPeriod: billingPeriod as any,
        startDate: new Date(),
        endDate: newEndDate,
        amount: parseFloat(amount.toString()),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, currentSub.id))
      .returning();

    if (updated.length === 0) {
      throw new Error('Failed to update subscription');
    }

    // Log the activation
    await db
      .insert(auditLogs)
      .values({
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        action: 'SUBSCRIPTION_ACTIVATED',
        entity: 'subscription',
        entityId: updated[0].id,
        details: {
          tenantId,
          tenantName: tenant.name,
          previousStatus: currentSub.status,
          newStatus: 'active',
          planId: newPlanId,
          billingPeriod,
          amount,
          notes,
        },
      })
      .catch((err) => console.error('Audit log error:', err));

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription activated successfully',
        subscription: updated[0],
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error activating subscription:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
