/**
 * POS Invoice HTML Generator
 */

import type { Invoice, InvoiceItem } from '@/lib/types';

export function generatePOSInvoiceHTML(params: {
  invoice: Invoice;
  company: {
    name: string;
    address?: string | null;
    logoUrl?: string | null;
    phone?: string | null;
    email?: string | null;
    taxRate?: number;
    currency?: string;
    headerMessage?: string | null;
    footerMessage?: string | null;
  };
}): string {
  const { invoice, company } = params;
  const fmt = (n: number) => `${company.currency ?? 'GH₵'}${n.toFixed(2)}`;
  const d = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif; color:#111; }
    .container { max-width: 900px; margin: 0 auto; padding: 32px; }
    .header { display:flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .logo { height: 48px; }
    .meta { text-align: right; font-size: 14px; color:#444 }
    h1 { margin: 0 0 4px 0; font-size: 28px; }
    .muted { color:#666; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 16px 0 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
    th { text-align: left; background:#f8f8f8; }
    .right { text-align: right; }
    .totals { width: 320px; margin-left:auto; margin-top: 16px; }
    .totals .row { display:flex; justify-content: space-between; padding: 6px 0; }
    .totals .final { border-top:1px solid #ddd; margin-top: 8px; padding-top: 8px; font-weight: 700; }
    .footer { margin-top: 32px; font-size: 12px; color:#666; text-align: center; }
    @media print { .print-hide { display: none; } body { margin:0; } .container { padding: 0; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        ${company.logoUrl ? `<img src=\"${company.logoUrl}\" class=\"logo\"/>` : `<h1>${company.name}</h1>`}
        ${company.address ? `<div class=\"muted\">${company.address}</div>` : ''}
        ${company.phone ? `<div class=\"muted\">${company.phone}</div>` : ''}
        ${company.email ? `<div class=\"muted\">${company.email}</div>` : ''}
        ${company.headerMessage ? `<div class=\"muted\" style=\"margin-top:4px; white-space:pre-wrap;\">${company.headerMessage}</div>` : ''}
      </div>
      <div class="meta">
        <div><strong>Invoice:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>Date:</strong> ${d(invoice.issueDate)}</div>
        ${invoice.dueDate ? `<div><strong>Due:</strong> ${d(invoice.dueDate)}</div>` : ''}
        <div><strong>Status:</strong> ${invoice.status}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="muted" style="font-size:12px; text-transform:uppercase;">Bill To</div>
        <div><strong>${invoice.customerName ?? 'Walk-in Customer'}</strong></div>
      </div>
      <div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map((it: InvoiceItem) => `
            <tr>
              <td>${it.productName}${it.sku ? ` <span class="muted">(${it.sku})</span>` : ''}</td>
              <td class="right">${it.quantity}</td>
              <td class="right">${fmt(it.unitPrice)}</td>
              <td class="right">${fmt(it.lineTotal)}</td>
            </tr>
          `)
          .join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
      ${invoice.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>- ${fmt(invoice.discountAmount)}</span></div>` : ''}
      ${invoice.taxAmount > 0 ? `<div class="row"><span>Tax${company.taxRate ? ` (${company.taxRate}%)` : ''}</span><span>${fmt(invoice.taxAmount)}</span></div>` : ''}
      <div class="row final"><span>Total</span><span>${fmt(invoice.totalAmount)}</span></div>
    </div>

    ${invoice.notes ? `<div style="margin-top:16px; font-size:13px;"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}

    <div class=\"footer\">${company.footerMessage ? company.footerMessage : 'Thank you for your business.'}</div>
  </div>
</body>
</html>`;
}

export function generatePOSInvoiceFilename(invoiceNumber: string) {
  return `POS_Invoice_${invoiceNumber}.html`;
}
