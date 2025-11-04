import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getPurchaseOrdersByTenant, 
  createPurchaseOrder, 
  updatePurchaseOrder, 
  deletePurchaseOrder,
  updateProductStock 
} from '@/lib/queries';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const purchaseOrders = await getPurchaseOrdersByTenant(session.user.tenantId);
    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const role = session.user.role.toLowerCase();
  if (role !== 'owner' && role !== 'manager' && role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { supplierId, poNumber, status, items, totalCost } = body;
    
    console.log('Creating PO with data:', { supplierId, poNumber, status, items, totalCost });
    
    const newPO = await createPurchaseOrder(
      {
        supplierId,
        poNumber,
        status: status || 'Draft',
        items,
        totalCost,
        tenantId: session.user.tenantId,
        supplierName: '' // Will be fetched when getting POs
      },
      session.user.tenantId
    );
    
    return NextResponse.json(newPO);
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    const code = error?.code ?? error?.cause?.code;
    if (code === '23505') {
      return NextResponse.json(
        { error: 'PO number already exists' },
        { status: 409 }
      );
    }
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to create purchase order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const role = session.user.role.toLowerCase();
  if (role !== 'owner' && role !== 'manager' && role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, items, totalCost } = body;
    
    const updatedPO = await updatePurchaseOrder(id, {
      status,
      items,
      totalCost
    });
    
    // If status is "Received", update product stock
    if (status === 'Received' && items) {
      for (const item of items) {
        await updateProductStock(item.productId, item.quantity);
      }
    }
    
    return NextResponse.json(updatedPO);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const role = session.user.role.toLowerCase();
  if (role !== 'owner' && role !== 'manager' && role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    
    await deletePurchaseOrder(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}
