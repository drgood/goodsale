import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, planPricing, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/plan-pricing?planId=xxx
 * Get all pricing options for a specific plan
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { error: 'planId query parameter is required' },
        { status: 400 }
      );
    }

    const pricing = await db
      .select()
      .from(planPricing)
      .where(eq(planPricing.planId, planId));

    return NextResponse.json({
      data: pricing,
    });
  } catch (error) {
    console.error('Error fetching plan pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan pricing' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/plan-pricing
 * Create or update pricing for a plan billing period
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingPeriod, price, discountPercent } = body;

    if (!planId || !billingPeriod || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, billingPeriod, price' },
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

    // Check if pricing already exists for this plan/period combo
    const existing = await db
      .select()
      .from(planPricing)
      .where(
        db.and(
          db.eq(planPricing.planId, planId),
          db.eq(planPricing.billingPeriod, billingPeriod)
        )
      )
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update existing
      result = await db
        .update(planPricing)
        .set({
          price: parseFloat(price),
          discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
        })
        .where(eq(planPricing.id, existing[0].id))
        .returning();
    } else {
      // Create new
      result = await db
        .insert(planPricing)
        .values({
          planId,
          billingPeriod,
          price: parseFloat(price),
          discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
        })
        .returning();
    }

    if (result.length === 0) {
      throw new Error('Failed to save plan pricing');
    }

    // Log the action
    await db
      .insert(auditLogs)
      .values({
        userId: null,
        userName: token.name as string,
        action: 'UPDATE_PLAN_PRICING',
        entity: 'plan_pricing',
        entityId: result[0].id,
        details: {
          planId,
          billingPeriod,
          price,
          discountPercent,
          isNew: existing.length === 0,
        },
      })
      .catch((err) => console.error('Audit log error:', err));

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error saving plan pricing:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to save plan pricing',
      },
      { status: 500 }
    );
  }
}
