import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCategoriesByTenant, createCategory } from '@/lib/queries';
import { db, categories as categoriesTable } from '@/db';
import { and, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await getCategoriesByTenant(session.user.tenantId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    const newCategory = await createCategory(session.user.tenantId, body.name);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
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
    const { id, name } = body as { id: string; name: string };

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Optional: prevent duplicate names per tenant (case-sensitive)
    const existing = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(and(eq(categoriesTable.tenantId, session.user.tenantId), eq(categoriesTable.name, name)));

    if (existing.some((c) => c.id !== id)) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }

    const [updated] = await db
      .update(categoriesTable)
      .set({ name })
      .where(and(eq(categoriesTable.id, id), eq(categoriesTable.tenantId, session.user.tenantId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
    }

    const result = await db
      .delete(categoriesTable)
      .where(and(eq(categoriesTable.id, id), eq(categoriesTable.tenantId, session.user.tenantId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
