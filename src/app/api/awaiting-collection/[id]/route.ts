import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

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
    const { status } = body;

    // Validate status
    if (status !== 'Completed') {
      return NextResponse.json(
        { error: 'Invalid status. Only "Completed" is allowed.' },
        { status: 400 }
      );
    }

    // Verify the sale exists and belongs to the tenant
    const saleResult = await db
      .select()
      .from(schema.sales)
      .where(
        and(
          eq(schema.sales.id, id),
          eq(schema.sales.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    if (!saleResult[0]) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    const sale = saleResult[0];

    // Check if the sale is actually awaiting collection
    if (sale.status !== 'Awaiting Collection') {
      return NextResponse.json(
        { error: 'Sale is not awaiting collection' },
        { status: 400 }
      );
    }

    // Update the sale status to Completed
    const updated = await db
      .update(schema.sales)
      .set({ status: 'Completed' })
      .where(eq(schema.sales.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      sale: updated[0]
    });
  } catch (error) {
    console.error('Error updating sale status:', error);
    return NextResponse.json(
      { error: 'Failed to update sale status' },
      { status: 500 }
    );
  }
}
