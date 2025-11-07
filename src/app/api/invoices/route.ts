import { NextRequest, NextResponse } from 'next/server';
import { db, posInvoices, posInvoiceItems, tenants, customers, settings } from '@/db';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/invoices?tenantId=...&limit=20
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantParam = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!tenantParam) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Accept either a tenant UUID or a tenant subdomain (slug)
    let tenantId = tenantParam;
    const uuidLike = /^[0-9a-fA-F-]{36}$/;
    if (!uuidLike.test(tenantParam)) {
      const t = await db.select().from(tenants).where(eq(tenants.subdomain, tenantParam)).limit(1);
      if (!t || t.length === 0) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenantId = t[0].id;
    }

    const listRaw = await db
      .select()
      .from(posInvoices)
      .where(eq(posInvoices.tenantId, tenantId))
      .orderBy(desc(posInvoices.issueDate))
      .limit(limit);

    const list = listRaw.map((inv) => ({
      ...inv,
      subtotal: parseFloat(String((inv as any).subtotal)),
      discountAmount: parseFloat(String((inv as any).discountAmount)),
      taxAmount: parseFloat(String((inv as any).taxAmount)),
      totalAmount: parseFloat(String((inv as any).totalAmount)),
    }));

    return NextResponse.json({ data: list });
  } catch (error) {
    console.error('GET /api/invoices error', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST /api/invoices
// Creates an invoice from cart items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId: tenantParam,
      customerId,
      items,
      discountAmount = 0,
      taxRate = 8,
      dueDate,
      notes,
      createdBy,
    } = body as {
      tenantId: string; // can be UUID or subdomain
      customerId?: string;
      items: Array<{ productId?: string; productName: string; sku?: string; quantity: number; unitPrice: number }>;
      discountAmount?: number;
      taxRate?: number;
      dueDate?: string | null;
      notes?: string | null;
      createdBy?: string | null;
    };

    if (!tenantParam || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'tenantId (uuid or subdomain) and at least one item are required' }, { status: 400 });
    }

    // Resolve tenantId (accept uuid or subdomain)
    let tenantId = tenantParam;
    const uuidLike = /^[0-9a-fA-F-]{36}$/;
    if (!uuidLike.test(tenantParam)) {
      const t = await db.select().from(tenants).where(eq(tenants.subdomain, tenantParam)).limit(1);
      if (!t || t.length === 0) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenantId = t[0].id;
    }

    // Resolve customer name (optional)
    let customerName: string | null = null;
    if (customerId) {
      const c = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      customerName = c[0]?.name ?? null;
    }

    // Compute totals
    const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const taxAmount = ((subtotal - (discountAmount || 0)) * (taxRate || 0)) / 100;
    const totalAmount = subtotal - (discountAmount || 0) + taxAmount;

    // Generate invoice number: INV-YYYYMMDD-NNN scoped per tenant per day
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateKey = `${y}${m}${d}`;

    const todayInvoices = await db
      .select()
      .from(posInvoices)
      .where(and(eq(posInvoices.tenantId, tenantId)))
      .orderBy(desc(posInvoices.createdAt))
      .limit(200);

    const seq = (todayInvoices
      .map((inv: any) => String(inv.invoiceNumber))
      .filter((num) => num?.startsWith(`INV-${dateKey}-`))
      .map((num) => parseInt(num.split('-').pop() || '0', 10))
      .reduce((max, n) => (isNaN(n) ? max : Math.max(max, n)), 0) || 0) + 1;

    const invoiceNumber = `INV-${dateKey}-${String(seq).padStart(3, '0')}`;

    const [created] = await db
      .insert(posInvoices)
      .values({
        tenantId,
        invoiceNumber,
        customerId: customerId || null,
        customerName,
        createdBy: createdBy || null,
        status: 'Issued',
        issueDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: subtotal.toString(),
        discountAmount: (discountAmount || 0).toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes: notes || null,
      })
      .returning();

    if (!created) throw new Error('Failed to create invoice');

    // Insert items
    const itemRows = items.map((it) => ({
      invoiceId: created.id,
      productId: it.productId || null,
      productName: it.productName,
      sku: it.sku || null,
      quantity: it.quantity,
      unitPrice: it.unitPrice.toString(),
      lineTotal: (it.unitPrice * it.quantity).toString(),
    }));

    await db.insert(posInvoiceItems).values(itemRows);

    // Return invoice with items
    const full = {
      ...created,
      subtotal: parseFloat(String(created.subtotal)),
      discountAmount: parseFloat(String(created.discountAmount)),
      taxAmount: parseFloat(String(created.taxAmount)),
      totalAmount: parseFloat(String(created.totalAmount)),
      items: itemRows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        sku: r.sku ?? undefined,
        quantity: r.quantity,
        unitPrice: parseFloat(String(r.unitPrice)),
        lineTotal: parseFloat(String(r.lineTotal)),
      })),
    };

    return NextResponse.json({ invoice: full }, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoices error', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
