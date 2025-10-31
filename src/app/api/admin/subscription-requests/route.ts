import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, subscriptionRequests, tenants, plans, users } from '@/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify user is super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch pending subscription requests
    const requests = await db
      .select()
      .from(subscriptionRequests)
      .where(eq(subscriptionRequests.status, 'pending'))
      .orderBy(desc(subscriptionRequests.requestedAt))
      .limit(100);

    // Enrich with tenant, plan, and user information
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [tenant] = await db
          .select({
            name: tenants.name,
            subdomain: tenants.subdomain,
          })
          .from(tenants)
          .where(eq(tenants.id, request.tenantId))
          .limit(1);

        const [plan] = await db
          .select({
            name: plans.name,
          })
          .from(plans)
          .where(eq(plans.id, request.planId))
          .limit(1);

        const [user] = await db
          .select({
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, request.requestedBy))
          .limit(1);

        return {
          id: request.id,
          tenantId: request.tenantId,
          tenantName: tenant?.name || 'Unknown',
          tenantSubdomain: tenant?.subdomain || '',
          planId: request.planId,
          planName: plan?.name || 'Unknown',
          billingPeriod: request.billingPeriod,
          totalAmount: request.totalAmount,
          contactName: request.contactName,
          contactPhone: request.contactPhone,
          contactEmail: request.contactEmail,
          requestedBy: user?.name || 'Unknown',
          requestedAt: request.requestedAt,
          status: request.status,
        };
      })
    );

    return NextResponse.json(enrichedRequests);
  } catch (error) {
    console.error('Error fetching subscription requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription requests' },
      { status: 500 }
    );
  }
}
