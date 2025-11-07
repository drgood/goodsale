import { NextRequest, NextResponse } from 'next/server';
import { db, posInvoices } from '@/db';
import { eq } from 'drizzle-orm';

// PATCH /api/invoices/[id] - update invoice (status, notes)
export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await _request.json();
    const { status, notes } = body as { status?: string; notes?: string | null };

    if (!status && typeof notes === 'undefined') {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (typeof notes !== 'undefined') updates.notes = notes;

    const updated = await db.update(posInvoices).set(updates).where(eq(posInvoices.id, id)).returning();
    if (updated.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ invoice: updated[0] });
  } catch (e) {
    console.error('PATCH /api/invoices/[id] error', e);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
