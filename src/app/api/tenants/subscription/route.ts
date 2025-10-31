import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, subscriptions, plans } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify user is authenticated
    if (!token?.sub || !token?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = token.tenantId as string;

    // Fetch current subscription with plan details
    const [subscription] = await db
      .select({
        id: subscriptions.id,
        planId: subscriptions.planId,
        billingPeriod: subscriptions.billingPeriod,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        amount: subscriptions.amount,
        planName: plans.name,
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.tenantId, tenantId))
      .orderBy(subscriptions.createdAt)
      .limit(1);

    if (!subscription) {
      return NextResponse.json(null);
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
