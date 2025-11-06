import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getReturnsByTenant, createReturn, getReturnPolicyByTenant, getSalesByTenant, getShiftById, updateShift, logReturnTransaction, updateReturn, updateCustomer } from '@/lib/queries';
import { calculateExpectedCash } from '@/lib/shift-calculations';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const returns = await getReturnsByTenant(session.user.tenantId);
    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
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
    const { saleId, customerId, reason, items, refundMethod, shiftId, createdDuringShift } = body;

    // Validation
    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Check for duplicate returns - prevent same item being returned multiple times
    // NOTE: Only works if saleItemId is provided. POS returns may not have saleItemId,
    // so we validate quantity-based duplicates instead
    for (const item of items) {
      if (item.saleItemId) {
        // Track exact sale items being returned
        const existingReturns = await db.select({
          totalReturned: schema.returnItems.quantity
        })
        .from(schema.returnItems)
        .innerJoin(schema.returns, eq(schema.returnItems.returnId, schema.returns.id))
        .where(
          eq(schema.returnItems.saleItemId, item.saleItemId)
        );
        
        const totalAlreadyReturned = existingReturns.reduce((sum, ret) => sum + ret.totalReturned, 0);
        
        // Get original sale item quantity to check against
        const originalSaleItem = await db.select()
          .from(schema.saleItems)
          .where(eq(schema.saleItems.id, item.saleItemId))
          .limit(1);
          
        if (originalSaleItem[0] && (totalAlreadyReturned + item.quantity) > originalSaleItem[0].quantity) {
          return NextResponse.json({ 
            error: `Cannot return ${item.quantity} of ${item.productName}. Only ${originalSaleItem[0].quantity - totalAlreadyReturned} remaining to return.` 
          }, { status: 400 });
        }
      }
      // NOTE: If saleItemId is null (POS returns), validation will be done in approval handler
      // when manager can physically verify items and quantities
    }

    // Fetch the original sale early (needed for refund calculation)
    const saleResult = await db.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1);
    const originalSale = saleResult[0];
    
    if (!originalSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Get return policy
    const policy = await getReturnPolicyByTenant(session.user.tenantId);

    // Fetch all sale items from database to recalculate refund amount
    const saleItems = await db.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, saleId));
    
    // Calculate refund the same way POS calculates total:
    // 1. Calculate subtotal of items being returned
    const returnedItemsSubtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0);
    
    // 2. Get original sale discount amount (proportional to returned items)
    const originalSaleDiscount = parseFloat(originalSale.discountAmount?.toString() || '0');
    const allItemsSubtotal = saleItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * parseFloat(item.price)), 0);
    
    // 3. Calculate proportional discount for returned items
    const proportionalDiscount = (allItemsSubtotal > 0) 
      ? (returnedItemsSubtotal / allItemsSubtotal) * originalSaleDiscount 
      : 0;
    
    // 4. Apply discount to get discounted subtotal
    const discountedSubtotal = returnedItemsSubtotal - proportionalDiscount;
    
    // 5. Add 8% tax on discounted subtotal (same as POS)
    const tax = discountedSubtotal * 0.08;
    
    // 6. Final refund amount = discounted subtotal + tax
    const totalReturnAmount = discountedSubtotal + tax;
    const restockingFeeAmount = policy ? (totalReturnAmount * policy.restockingFeePercent) / 100 : 0;
    const refundAmount = totalReturnAmount - restockingFeeAmount;

    // All returns start as pending - manager approves on Returns page
    let initialStatus = 'pending';
    let approvedBy = null;
    let approvalReason = null;
    
    // Create return
    const newReturn = await createReturn({
      tenantId: session.user.tenantId,
      saleId,
      customerId: customerId || null,
      requestedBy: session.user.id,
      reason: reason || null,
      totalReturnAmount,
      restockingFeeAmount,
      refundAmount,
      items: items.map((item: any) => ({
        saleItemId: item.saleItemId || null,
        productId: item.productId || null,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        returnAmount: item.quantity * item.unitPrice,
        condition: item.condition || null
      }))
    });

    // All returns are created as pending
    // Approval and processing happens in the [id]/route.ts handler

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
