import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch sales with status 'Awaiting Collection'
    const salesResult = await db
      .select()
      .from(schema.sales)
      .where(
        and(
          eq(schema.sales.tenantId, session.user.tenantId),
          eq(schema.sales.status, 'Awaiting Collection')
        )
      )
      .orderBy(desc(schema.sales.createdAt));

    // Fetch items for each sale
    const salesWithItems = await Promise.all(
      salesResult.map(async (sale) => {
        const items = await db
          .select()
          .from(schema.saleItems)
          .where(eq(schema.saleItems.saleId, sale.id));
        
        return {
          id: sale.id,
          tenantId: sale.tenantId,
          shiftId: sale.shiftId || '',
          cashierId: sale.cashierId || '',
          cashierName: sale.cashierName || '',
          customerId: sale.customerId || undefined,
          customerName: sale.customerName || undefined,
          totalAmount: parseFloat(sale.totalAmount),
          totalProfit: parseFloat(sale.totalProfit || '0'),
          itemCount: items.length,
          paymentMethod: sale.paymentMethod as 'Cash' | 'Card' | 'Mobile' | 'On Credit',
          status: sale.status as 'Awaiting Collection',
          discountAmount: parseFloat(sale.discountAmount || '0'),
          amountSettled: parseFloat(sale.amountSettled || '0'),
          createdAt: sale.createdAt?.toISOString() || new Date().toISOString(),
          items: items.map(item => ({
            productId: item.productId || '',
            productName: item.productName || '',
            quantity: item.quantity,
            price: parseFloat(item.price),
            costPrice: parseFloat(item.costPrice)
          }))
        };
      })
    );
    
    return NextResponse.json(salesWithItems);
  } catch (error) {
    console.error('Error fetching awaiting collection sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch awaiting collection sales' },
      { status: 500 }
    );
  }
}
