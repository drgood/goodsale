import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, subscriptionRequests } from '@/db';
import { eq } from 'drizzle-orm';

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

    // Count pending requests
    const pending = await db
      .select()
      .from(subscriptionRequests)
      .where(eq(subscriptionRequests.status, 'pending'));

    return NextResponse.json({ count: pending.length });
  } catch (error) {
    console.error('Error fetching subscription requests count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count' },
      { status: 500 }
    );
  }
}
