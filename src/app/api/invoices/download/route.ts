import { NextRequest, NextResponse } from 'next/server';
import { db, invoices, subscriptions, tenants } from '@/db';
import { eq } from 'drizzle-orm';
import { generateInvoiceHTML, generateInvoiceFilename } from '@/lib/invoice-generator';

/**
 * Download invoice as HTML (can be printed to PDF client-side)
 * GET /api/invoices/download?invoiceId=xxx&format=html
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

    // Fetch invoice data
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .then((rows) => rows[0]);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Fetch subscription data
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, invoice.subscriptionId))
      .then((rows) => rows[0]);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Fetch tenant data
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, subscription.tenantId))
      .then((rows) => rows[0]);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Determine billing period from subscription
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth());

    let billingPeriod = '1_month';
    if (diffMonths >= 24) billingPeriod = '24_months';
    else if (diffMonths >= 12) billingPeriod = '12_months';
    else if (diffMonths >= 6) billingPeriod = '6_months';
    else billingPeriod = '1_month';

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      tenantName: tenant.name,
      tenantEmail: tenant.contactEmail || '',
      tenantPhone: tenant.contactPhone,
      planName: subscription.planName,
      billingPeriod,
      amount: invoice.amount,
      currency: 'USD',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      paymentMethod: invoice.paymentMethod || 'card',
      issuedDate: invoice.createdAt,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
    };

    if (format === 'html') {
      // Return HTML for client-side PDF conversion
      const html = generateInvoiceHTML(invoiceData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${generateInvoiceFilename(invoice.invoiceNumber)}"`,
        },
      });
    } else if (format === 'json') {
      // Return JSON data for custom handling
      return NextResponse.json({
        invoice: invoiceData,
        downloadUrl: `/api/invoices/download?invoiceId=${invoiceId}&format=html`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid format parameter. Use "html" or "json"' },
      { status: 400 }
    );
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
