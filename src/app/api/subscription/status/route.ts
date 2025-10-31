import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSubscriptionStatus } from '@/lib/trial-validation';

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

    const status = await getSubscriptionStatus(token.tenantId as string);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
