import { NextRequest, NextResponse } from 'next/server';
import { db, posInvoices, posInvoiceItems, tenants, settings } from '@/db';
import { eq } from 'drizzle-orm';
import { generatePOSInvoiceHTML, generatePOSInvoiceFilename } from '@/lib/pos-invoice-generator';

export const runtime = 'nodejs';

/**
 * Download POS invoice as HTML (can be printed to PDF client-side)
 * GET /api/invoices/download?invoiceId=xxx&format=html|json
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoiceId');
    const format = searchParams.get('format') || 'html';

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId parameter is required' },
        { status: 400 }
      );
    }

    // Fetch invoice
const inv = await db.select().from(posInvoices).where(eq(posInvoices.id, invoiceId)).limit(1);
    const invoice = inv[0];
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch items
const items = await db.select().from(posInvoiceItems).where(eq(posInvoiceItems.invoiceId, invoiceId));

    // Fetch company settings (optional)
    const tenant = await db.select().from(tenants).where(eq(tenants.id, invoice.tenantId)).limit(1);
    const tenantSettings = await db.select().from(settings).where(eq(settings.tenantId, invoice.tenantId)).limit(1);

    const company = {
      name: tenantSettings[0]?.shopName || tenant[0]?.name || 'GoodSale',
      address: null,
      logoUrl: tenantSettings[0]?.logoUrl || null,
      phone: null,
      email: null,
      taxRate: tenantSettings[0]?.taxRate ? parseFloat(String(tenantSettings[0].taxRate)) : 8,
      currency: tenantSettings[0]?.currency?.toUpperCase?.() === 'USD' ? '$' : 'GH₵',
      headerMessage: tenantSettings[0]?.receiptHeader || null,
      footerMessage: tenantSettings[0]?.receiptFooter || null,
    };

    const responseInvoice = {
      ...invoice,
      subtotal: parseFloat(String(invoice.subtotal)),
      discountAmount: parseFloat(String(invoice.discountAmount)),
      taxAmount: parseFloat(String(invoice.taxAmount)),
      totalAmount: parseFloat(String(invoice.totalAmount)),
      items: items.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        sku: r.sku ?? undefined,
        quantity: r.quantity,
        unitPrice: parseFloat(String(r.unitPrice)),
        lineTotal: parseFloat(String(r.lineTotal)),
      })),
    };

    if (format === 'json') {
      return NextResponse.json({ invoice: responseInvoice, company });
    }

    const html = generatePOSInvoiceHTML({ invoice: responseInvoice as any, company });
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${generatePOSInvoiceFilename(invoice.invoiceNumber)}"`,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in invoice download:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate invoice',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
