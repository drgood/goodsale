import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getShiftsByTenant } from '@/lib/queries';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateExpectedCash } from '@/lib/shift-calculations';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const shifts = await getShiftsByTenant(session.user.tenantId);
    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
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
    
    const result = await db.insert(schema.shifts).values({
      tenantId: session.user.tenantId,
      cashierId: session.user.id,
      cashierName: session.user.name,
      startTime: new Date(),
      status: 'open',
      startingCash: body.startingCash.toString(),
      cashSales: '0',
      cardSales: '0',
      mobileSales: '0',
      creditSales: '0',
      totalSales: '0',
      expectedCash: body.startingCash.toString()
    }).returning();
    
    const shift = result[0];
    
    return NextResponse.json({
      id: shift.id,
      tenantId: shift.tenantId,
      cashierId: shift.cashierId || '',
      cashierName: shift.cashierName || '',
      startTime: shift.startTime.toISOString(),
      status: shift.status,
      startingCash: parseFloat(shift.startingCash),
      cashSales: parseFloat(shift.cashSales || '0'),
      cardSales: parseFloat(shift.cardSales || '0'),
      mobileSales: parseFloat(shift.mobileSales || '0'),
      creditSales: parseFloat(shift.creditSales || '0'),
      totalSales: parseFloat(shift.totalSales || '0'),
      expectedCash: parseFloat(shift.expectedCash || '0')
    });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    // First, fetch current shift to get all components for recalculation
    const currentShiftResult = await db.select().from(schema.shifts).where(eq(schema.shifts.id, id)).limit(1);
    if (!currentShiftResult[0]) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }
    const currentShift = currentShiftResult[0];
    
    const dataToUpdate: Record<string, string | Date> = {};
    if (updateData.endTime) dataToUpdate.endTime = new Date(updateData.endTime);
    if (updateData.status) dataToUpdate.status = updateData.status;
    if (updateData.cashSales !== undefined && updateData.cashSales !== null) dataToUpdate.cashSales = updateData.cashSales.toString();
    if (updateData.cardSales !== undefined && updateData.cardSales !== null) dataToUpdate.cardSales = updateData.cardSales.toString();
    if (updateData.mobileSales !== undefined && updateData.mobileSales !== null) dataToUpdate.mobileSales = updateData.mobileSales.toString();
    if (updateData.creditSales !== undefined && updateData.creditSales !== null) dataToUpdate.creditSales = updateData.creditSales.toString();
    if (updateData.totalSales !== undefined && updateData.totalSales !== null) dataToUpdate.totalSales = updateData.totalSales.toString();
    if (updateData.actualCash !== undefined && updateData.actualCash !== null) dataToUpdate.actualCash = updateData.actualCash.toString();
    if (updateData.cashDifference !== undefined && updateData.cashDifference !== null) dataToUpdate.cashDifference = updateData.cashDifference.toString();
    if (updateData.cashSettlements !== undefined && updateData.cashSettlements !== null) dataToUpdate.cashSettlements = updateData.cashSettlements.toString();
    if (updateData.cardSettlements !== undefined && updateData.cardSettlements !== null) dataToUpdate.cardSettlements = updateData.cardSettlements.toString();
    if (updateData.mobileSettlements !== undefined && updateData.mobileSettlements !== null) dataToUpdate.mobileSettlements = updateData.mobileSettlements.toString();
    if (updateData.cashReturns !== undefined && updateData.cashReturns !== null) dataToUpdate.cashReturns = updateData.cashReturns.toString();
    
    // IMPORTANT: Never accept expectedCash directly. Always recalculate from components.
    // This ensures data integrity and prevents stale values.
    const shiftForCalculation = {
      startingCash: parseFloat(dataToUpdate.cashSales !== undefined ? currentShift.startingCash : currentShift.startingCash),
      cashSales: parseFloat((dataToUpdate.cashSales as string) || currentShift.cashSales || '0'),
      cashSettlements: parseFloat((dataToUpdate.cashSettlements as string) || currentShift.cashSettlements || '0'),
      cashReturns: parseFloat((dataToUpdate.cashReturns as string) || currentShift.cashReturns || '0')
    };
    const recalculatedExpectedCash = calculateExpectedCash(shiftForCalculation);
    dataToUpdate.expectedCash = recalculatedExpectedCash.toString();
    
    const result = await db.update(schema.shifts)
      .set(dataToUpdate)
      .where(eq(schema.shifts.id, id))
      .returning();
    
    if (!result[0]) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }
    
    const shift = result[0];
    
    return NextResponse.json({
      id: shift.id,
      tenantId: shift.tenantId,
      cashierId: shift.cashierId || '',
      cashierName: shift.cashierName || '',
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime?.toISOString(),
      status: shift.status,
      startingCash: parseFloat(shift.startingCash),
      cashSales: parseFloat(shift.cashSales || '0'),
      cardSales: parseFloat(shift.cardSales || '0'),
      mobileSales: parseFloat(shift.mobileSales || '0'),
      creditSales: parseFloat(shift.creditSales || '0'),
      totalSales: parseFloat(shift.totalSales || '0'),
      expectedCash: parseFloat(shift.expectedCash || '0'),
      actualCash: shift.actualCash ? parseFloat(shift.actualCash) : undefined,
      cashDifference: shift.cashDifference ? parseFloat(shift.cashDifference) : undefined
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { error: 'Failed to update shift' },
      { status: 500 }
    );
  }
}
