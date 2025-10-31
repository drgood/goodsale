import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  db,
  billingLedger,
  subscriptions,
  tenants,
  planPricing,
  auditLogs,
  subscriptionRequests,
  superAdmins,
} from '@/db';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/admin/billing
 * List all billing transactions with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tenantId = searchParams.get('tenantId');
    const offset = (page - 1) * limit;

    const allRecords = tenantId
      ? await db
          .select()
          .from(billingLedger)
          .where(eq(billingLedger.tenantId, tenantId))
          .orderBy(desc(billingLedger.paidAt))
      : await db
          .select()
          .from(billingLedger)
          .orderBy(desc(billingLedger.paidAt));
    const total = allRecords.length;

    const records = await db
      .select()
      .from(billingLedger)
      .orderBy(desc(billingLedger.paidAt))
      .limit(limit)
      .offset(offset);

    // Enrich with tenant names
    const enriched = await Promise.all(
      records.map(async (record) => {
        const tenant = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, record.tenantId))
          .limit(1);

        return {
          ...record,
          tenantName: tenant[0]?.name || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching billing records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing records' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/billing
 * Record a cash payment and create/update subscription
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      planId,
      billingPeriod,
      amount,
      paymentMethod,
      invoiceNumber,
      notes,
      paidAt,
    } = body;

    // Validation
    if (!tenantId || !planId || !billingPeriod || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validBillingPeriods = [
      '1_month',
      '6_months',
      '12_months',
      '24_months',
    ];
    if (!validBillingPeriods.includes(billingPeriod)) {
      return NextResponse.json(
        {
          error: 'Invalid billing period. Must be: 1_month, 6_months, 12_months, or 24_months',
        },
        { status: 400 }
      );
    }

    // Verify tenant and plan exist
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const pricing = await db
      .select()
      .from(planPricing)
      .where(
        and(
          eq(planPricing.planId, planId),
          eq(planPricing.billingPeriod, billingPeriod)
        )
      )
      .limit(1);

    if (pricing.length === 0) {
      return NextResponse.json(
        { error: 'Pricing not found for this plan and billing period' },
        { status: 404 }
      );
    }

    // Calculate subscription dates
    const startDate = new Date(paidAt || new Date());
    const endDate = new Date(startDate);

    const periodMap: Record<string, number> = {
      '1_month': 1,
      '6_months': 6,
      '12_months': 12,
      '24_months': 24,
    };

    endDate.setMonth(endDate.getMonth() + periodMap[billingPeriod]);

    // Create subscription
    const newSubscription = await db
      .insert(subscriptions)
      .values({
        tenantId,
        planId,
        billingPeriod,
        status: 'active',
        startDate,
        endDate,
        autoRenewal: false,
        amount: parseFloat(amount).toString(),
      })
      .returning();

    if (newSubscription.length === 0) {
      throw new Error('Failed to create subscription');
    }

    // Record billing transaction
    const newRecord = await db
      .insert(billingLedger)
      .values({
        tenantId,
        subscriptionId: newSubscription[0].id,
        amount: parseFloat(amount).toString(),
        paymentMethod,
        status: 'completed',
        invoiceNumber,
        notes,
        recordedBy: token.id as string,
        paidAt: startDate,
      })
      .returning();

    if (newRecord.length === 0) {
      throw new Error('Failed to record billing transaction');
    }

    // Mark any pending subscription request as activated
    const pendingRequests = await db
      .select()
      .from(subscriptionRequests)
      .where(
        and(
          eq(subscriptionRequests.tenantId, tenantId),
          eq(subscriptionRequests.status, 'pending'),
          eq(subscriptionRequests.planId, planId),
          eq(subscriptionRequests.billingPeriod, billingPeriod)
        )
      )
      .orderBy(desc(subscriptionRequests.requestedAt))
      .limit(1);

    if (pendingRequests.length > 0) {
      const request = pendingRequests[0];
      
      await db
        .update(subscriptionRequests)
        .set({
          status: 'activated',
          activatedAt: new Date(),
          activatedBy: token.id as string,
          subscriptionId: newSubscription[0].id,
          invoiceNumber,
        })
        .where(eq(subscriptionRequests.id, request.id))
        .catch((err) => console.error('Failed to update request status:', err));
    }

    // Log the transaction
    await db
      .insert(auditLogs)
      .values({
        userId: null,
        userName: token.name as string,
        action: 'RECORD_CASH_PAYMENT',
        entity: 'billing_ledger',
        entityId: newRecord[0].id,
        details: {
          tenantId,
          tenantName: tenant[0].name,
          billingPeriod,
          amount,
          paymentMethod,
          invoiceNumber,
        },
      })
      .catch((err) => console.error('Audit log error:', err));

    return NextResponse.json(
      {
        billing: newRecord[0],
        subscription: newSubscription[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to record payment',
      },
      { status: 500 }
    );
  }
}
