import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, billingLedger } from '@/db';
import { eq, desc } from 'drizzle-orm';

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

    // Fetch billing history for the tenant
    const history = await db
      .select()
      .from(billingLedger)
      .where(eq(billingLedger.tenantId, tenantId))
      .orderBy(desc(billingLedger.paidAt))
      .limit(50);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}
