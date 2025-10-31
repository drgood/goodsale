import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, subscriptions, billingLedger, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify user is super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, tenantId, planId, billingPeriod, amount, invoiceNumber } = body;

    // Validate input
    if (!requestId || !tenantId || !planId || !billingPeriod || !amount || !invoiceNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate subscription dates based on billing period
    const startDate = new Date();
    const endDate = new Date();
    
    switch (billingPeriod) {
      case '1_month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '6_months':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '12_months':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case '24_months':
        endDate.setFullYear(endDate.getFullYear() + 2);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update or create active subscription
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1);

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set({
          planId,
          billingPeriod,
          status: 'active',
          startDate,
          endDate,
          amount,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSubscription.id));
    } else {
      // Create new subscription
      await db
        .insert(subscriptions)
        .values({
          tenantId,
          planId,
          billingPeriod,
          status: 'active',
          startDate,
          endDate,
          amount,
          autoRenewal: false,
        });
    }

    // Record payment in billing ledger
    await db.insert(billingLedger).values({
      tenantId,
      subscriptionId: existingSubscription?.id,
      amount,
      paymentMethod: 'cash',
      status: 'completed',
      invoiceNumber,
      recordedBy: token.sub as string,
      paidAt: new Date(),
    });

    // Update the request status in audit log
    const [currentLog] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, requestId))
      .limit(1);

    if (currentLog) {
      const updatedDetails = {
        ...(currentLog.details as any),
        status: 'activated',
        activatedAt: new Date().toISOString(),
        activatedBy: token.sub,
      };

      await db
        .update(auditLogs)
        .set({
          details: updatedDetails,
        })
        .where(eq(auditLogs.id, requestId));
    }

    // Log the activation
    await db.insert(auditLogs).values({
      userId: token.sub as string,
      userName: token.name as string || 'Admin',
      action: 'SUBSCRIPTION_ACTIVATED',
      entity: 'subscription',
      entityId: tenantId,
      details: {
        planId,
        billingPeriod,
        amount,
        invoiceNumber,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Subscription activated successfully',
        endDate: endDate.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
