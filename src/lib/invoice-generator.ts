/**
 * Invoice Generation Utility
 * Generates HTML invoice templates that can be converted to PDF on the client side
 */

interface InvoiceData {
  invoiceNumber: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  planName: string;
  billingPeriod: string;
  amount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  paymentMethod: string;
  issuedDate: Date;
  dueDate?: Date;
  notes?: string;
}

const billingPeriodLabels: Record<string, string> = {
  '1_month': '1 Month',
  '6_months': '6 Months',
  '12_months': '12 Months',
  '24_months': '24 Months',
};

/**
 * Generate HTML invoice template
 * Client-side can convert this to PDF using html2pdf or similar library
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US');
  const formatCurrency = (amount: number) => `${data.currency} ${amount.toFixed(2)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    .invoice-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
    }
    .company-info h1 {
      color: #0066cc;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .company-info p {
      font-size: 14px;
      color: #666;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta-item {
      margin-bottom: 10px;
    }
    .invoice-meta-label {
      font-weight: 600;
      color: #333;
    }
    .invoice-meta-value {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      color: #0066cc;
      margin-bottom: 15px;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .section-content {
      margin-left: 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .info-label {
      font-weight: 500;
      color: #666;
      min-width: 150px;
    }
    .info-value {
      color: #333;
    }
    .bill-to-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .bill-to-section h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
    }
    .bill-to-section p {
      font-size: 14px;
      margin-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background-color: #f5f5f5;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: #333;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 12px;
      font-size: 14px;
      border-bottom: 1px solid #eee;
    }
    .amount-right {
      text-align: right;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-box {
      width: 300px;
      border: 2px solid #eee;
      border-radius: 8px;
      padding: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .total-row.final {
      border-top: 2px solid #eee;
      padding-top: 12px;
      font-weight: 600;
      font-size: 16px;
      color: #0066cc;
    }
    .terms-section {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      font-size: 12px;
      color: #666;
    }
    .terms-section h4 {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <h1>GOODSALE</h1>
        <p>POS & Inventory Management</p>
        <p>www.goodsale.com</p>
      </div>
      <div class="invoice-meta">
        <div class="invoice-meta-item">
          <span class="invoice-meta-label">Invoice Number:</span><br>
          <span class="invoice-meta-value">${data.invoiceNumber}</span>
        </div>
        <div class="invoice-meta-item">
          <span class="invoice-meta-label">Issued Date:</span><br>
          <span class="invoice-meta-value">${formatDate(data.issuedDate)}</span>
        </div>
        ${data.dueDate ? `
        <div class="invoice-meta-item">
          <span class="invoice-meta-label">Due Date:</span><br>
          <span class="invoice-meta-value">${formatDate(data.dueDate)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Bill To Section -->
    <div class="section">
      <div class="bill-to-grid">
        <div class="bill-to-section">
          <h3>Bill To</h3>
          <p><strong>${data.tenantName}</strong></p>
          ${data.tenantEmail ? `<p>${data.tenantEmail}</p>` : ''}
          ${data.tenantPhone ? `<p>${data.tenantPhone}</p>` : ''}
        </div>
        <div class="bill-to-section">
          <h3>Subscription Details</h3>
          <p><strong>Plan:</strong> ${data.planName}</p>
          <p><strong>Billing Period:</strong> ${billingPeriodLabels[data.billingPeriod] || data.billingPeriod}</p>
          <p><strong>Service Period:</strong></p>
          <p style="margin-left: 15px;">${formatDate(data.startDate)} to ${formatDate(data.endDate)}</p>
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.planName} - ${billingPeriodLabels[data.billingPeriod] || data.billingPeriod} Subscription</td>
          <td class="amount-right">${formatCurrency(data.amount)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(data.amount)}</span>
        </div>
        <div class="total-row">
          <span>Tax:</span>
          <span>${formatCurrency(0)}</span>
        </div>
        <div class="total-row final">
          <span>Total Due:</span>
          <span>${formatCurrency(data.amount)}</span>
        </div>
      </div>
    </div>

    <!-- Payment Method -->
    <div class="section">
      <div class="section-title">Payment Information</div>
      <div class="section-content">
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value">${data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value" style="color: #22c55e; font-weight: 600;">PAID</span>
        </div>
      </div>
    </div>

    <!-- Terms -->
    ${data.notes ? `
    <div class="section">
      <div class="terms-section">
        <h4>Notes</h4>
        <p>${data.notes}</p>
      </div>
    </div>
    ` : ''}

    <!-- Terms & Conditions -->
    <div class="section">
      <div class="terms-section">
        <h4>Terms & Conditions</h4>
        <p>
          This subscription grants you access to GoodSale services for the specified billing period. 
          Services are provided as-is. For support, contact support@goodsale.com.
          Thank you for your business!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>GoodSale | POS & Inventory Management Solution</p>
      <p>Invoice generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate a filename for the invoice PDF
 */
export function generateInvoiceFilename(invoiceNumber: string): string {
  return `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
}
