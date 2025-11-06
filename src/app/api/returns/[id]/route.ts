import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReturnById, updateReturn, updateCustomer, getShiftById, updateShift, logReturnTransaction } from '@/lib/queries';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateExpectedCash } from '@/lib/shift-calculations';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const returnRecord = await getReturnById(id);

    if (!returnRecord || returnRecord.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    return NextResponse.json(returnRecord);
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, approvalReason, rejectionReason, refundMethod } = body;

    const returnRecord = await getReturnById(id);

    if (!returnRecord || returnRecord.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Handle different actions
    if (action === 'approve') {
      const updated = await updateReturn(id, {
        status: 'approved',
        approvedBy: session.user.id,
        approvalReason: approvalReason || null
      });

      return NextResponse.json(updated);
    } else if (action === 'reject') {
      const updated = await updateReturn(id, {
        status: 'rejected',
        approvedBy: session.user.id,
        rejectionReason: rejectionReason || null
      });

      return NextResponse.json(updated);
    } else if (action === 'refund') {
      // Process refund - full implementation with stock, shift, and customer updates
      if (!refundMethod) {
        return NextResponse.json(
          { error: 'Refund method is required' },
          { status: 400 }
        );
      }

      // Get the original sale to check payment method
      const saleResult = await db.select().from(schema.sales).where(eq(schema.sales.id, returnRecord.saleId)).limit(1);
      const originalSale = saleResult[0];
      const originalPaymentMethod = originalSale?.paymentMethod || 'Cash';

      // Increase stock for all returned items
      if (returnRecord.items) {
        for (const item of returnRecord.items) {
          if (item.productId) {
            const product = await db.select().from(schema.products).where(eq(schema.products.id, item.productId)).limit(1);
            if (product[0]) {
              const currentStock = parseInt(product[0].stock?.toString() || '0') || 0;
              const newStock = currentStock + item.quantity;
              await db.update(schema.products).set({ stock: newStock }).where(eq(schema.products.id, item.productId));
            }
          }
        }
      }

      // Get the shift associated with the original sale to update it
      const shiftResult = await db.select().from(schema.shifts).where(eq(schema.shifts.id, originalSale?.shiftId || '')).limit(1);
      const shift = shiftResult[0];
      
      let shiftAfter = null;
      if (shift) {
        let impactOnCash = 0;
        let impactOnExpectedCash = 0;
        let newCashReturns = (shift.cashReturns ? parseFloat(shift.cashReturns.toString()) : 0);
        const refundAmount = returnRecord.refundAmount;

        // Calculate impact based on original payment method
        if (originalPaymentMethod === 'On Credit') {
          // Credit sales: no cash involved
          impactOnCash = 0;
          impactOnExpectedCash = 0;
        } else if (originalPaymentMethod === 'Cash' && refundMethod === 'cash') {
          // Cash sale with cash refund
          impactOnCash = -refundAmount;
          newCashReturns += refundAmount;
          impactOnExpectedCash = -refundAmount;
        } else if (originalPaymentMethod === 'Card' && refundMethod === 'cash') {
          // Card sale refunded as cash
          impactOnCash = refundAmount;
          newCashReturns += refundAmount;
          impactOnExpectedCash = refundAmount;
        } else {
          // Other combinations: store credit, etc.
          impactOnCash = 0;
          impactOnExpectedCash = 0;
        }

        // Recalculate expectedCash
        const recalculatedExpectedCash = calculateExpectedCash({
          startingCash: shift.startingCash,
          cashSales: shift.cashSales || '0',
          cashSettlements: shift.cashSettlements || '0',
          cashReturns: newCashReturns.toString()
        });

        // Update shift
        shiftAfter = await updateShift(shift.id, {
          expectedCash: recalculatedExpectedCash,
          cashReturns: newCashReturns
        });

        // Log transaction
        await logReturnTransaction({
          returnId: id,
          shiftId: shift.id,
          tenantId: session.user.tenantId,
          action: 'refunded',
          refundMethod,
          refundAmount,
          processedBy: session.user.id,
          impactOnRevenue: -refundAmount,
          impactOnCash,
          impactOnExpectedCash,
          reason: returnRecord.reason || 'Refund processed',
          notes: `Refund processed via ${refundMethod}. ${originalPaymentMethod === 'On Credit' ? 'Customer debt reduced.' : 'Cash impact handled.'}`
        });
      }

      // Update customer balance based on payment method
      if (returnRecord.customerId) {
        const customerResult = await db.select().from(schema.customers).where(eq(schema.customers.id, returnRecord.customerId)).limit(1);
        if (customerResult[0]) {
          const currentBalance = parseFloat(customerResult[0].balance || '0');
          let newBalance = currentBalance;
          
          // Only reduce balance for credit sales
          if (originalPaymentMethod === 'On Credit') {
            newBalance = Math.max(0, currentBalance - returnRecord.refundAmount);
          }
          // For cash/card sales, no balance change (refund is in cash/card, not credit)

          await updateCustomer(returnRecord.customerId, {
            balance: newBalance
          });
        }
      }

      // Update return status to refunded
      const updated = await updateReturn(id, {
        status: 'refunded',
        refundMethod,
        refundedAt: new Date()
      });

      return NextResponse.json(updated);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
