import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateProduct, deleteProduct } from '@/lib/queries';
import { db, products } from '@/db';
import { eq } from 'drizzle-orm';
import { notifyTeamManagers } from '@/lib/notification-helpers';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await props.params;
    const body = await request.json();
    const updatedProduct = await updateProduct(params.id, body);

    // Check if stock is now below threshold and notify managers
    if (updatedProduct && updatedProduct.stock !== null && updatedProduct.stockThreshold !== null && updatedProduct.stock < updatedProduct.stockThreshold) {
      try {
        await notifyTeamManagers(
          session.user.tenantId as string,
          'stock',
          'Low Stock Warning',
          `${updatedProduct.name} stock is critically low at ${updatedProduct.stock} units (threshold: ${updatedProduct.stockThreshold})`
        );
      } catch (notifError) {
        console.error('Error creating low stock notification:', notifError);
        // Don't fail the product update if notification fails
      }
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await props.params;
    await deleteProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
