import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSalesByTenant, createSale, updateProductStock, updateSale } from '@/lib/queries';
import { notifyTeamManagers } from '@/lib/notification-helpers';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sales = await getSalesByTenant(session.user.tenantId);
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
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
    console.log('Creating sale with data:', JSON.stringify(body, null, 2));
    console.log('Tenant ID:', session.user.tenantId);
    
    const newSale = await createSale(body, session.user.tenantId);
    console.log('Sale created successfully:', newSale.id);
    
    // Decrease product stock for each item
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        if (item.productId) {
          console.log(`Updating stock for product ${item.productId}: -${item.quantity}`);
          await updateProductStock(item.productId, -item.quantity);
        }
      }
    }
    
    // Notify team managers about the new sale
    try {
      await notifyTeamManagers(
        session.user.tenantId,
        'sale',
        'New Sale!',
        `Sale of GH₵${(typeof newSale.totalAmount === 'number' ? newSale.totalAmount : parseFloat((newSale.totalAmount as any)?.toString?.() || '0')).toFixed(2)} completed by ${newSale.cashierName || 'Unknown'}`
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the sale creation if notification fails
    }
    
    return NextResponse.json(newSale);
  } catch (error) {
    console.error('Error creating sale - Full error:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to create sale', details: error instanceof Error ? error.message : String(error) },
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
    
    if (!id) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }
    
    const updatedSale = await updateSale(id, updateData);
    
    if (!updatedSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: 'Failed to update sale', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
