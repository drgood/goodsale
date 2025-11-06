import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getShiftById } from '@/lib/queries';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: shiftId } = await params;
    
    const shift = await getShiftById(shiftId);
    
    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }
    
    // Verify shift belongs to user's tenant
    if (shift.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(shift);
  } catch (error) {
    console.error('Error fetching shift by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift' },
      { status: 500 }
    );
  }
}