import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReturnPolicyByTenant, createOrUpdateReturnPolicy } from '@/lib/queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const policy = await getReturnPolicyByTenant(session.user.tenantId);
    
    if (!policy) {
      // Return default policy if none exists
      return NextResponse.json({
        returnWindowDays: 30,
        refundMethod: 'original',
        restockingFeePercent: 0,
        requiresApproval: true,
        allowPartialReturns: true,
        notifyCustomer: true
      });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Error fetching return policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return policy' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      returnWindowDays,
      refundMethod,
      restockingFeePercent,
      requiresApproval,
      allowPartialReturns,
      notifyCustomer
    } = body;

    // Validation
    if (!returnWindowDays || returnWindowDays < 0) {
      return NextResponse.json(
        { error: 'Valid return window days is required' },
        { status: 400 }
      );
    }

    if (!refundMethod) {
      return NextResponse.json(
        { error: 'Refund method is required' },
        { status: 400 }
      );
    }

    const policy = await createOrUpdateReturnPolicy(session.user.tenantId, {
      returnWindowDays,
      refundMethod,
      restockingFeePercent: restockingFeePercent || 0,
      requiresApproval: requiresApproval !== false,
      allowPartialReturns: allowPartialReturns !== false,
      notifyCustomer: notifyCustomer !== false
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Error updating return policy:', error);
    return NextResponse.json(
      { error: 'Failed to update return policy', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
