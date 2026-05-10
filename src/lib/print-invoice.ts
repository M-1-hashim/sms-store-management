// ─── Invoice Print Utility ────────────────────────────────────────────
// Opens a beautiful RTL invoice in a new window for printing

export interface InvoiceData {
  invoiceNumber: string
  date: string
  customer?: { name: string; phone: string } | null
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  totalAmount: number
  discount: number
  finalAmount: number
  paidAmount: number
  change: number
  paymentMethod: string
  notes?: string | null
}

export function printInvoice(data: InvoiceData) {
  const toFarsi = (n: number) => n.toLocaleString('fa-AF')
  const itemsRows = data.items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${toFarsi(i + 1)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#1e293b;">${item.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:center;color:#475569;">${toFarsi(item.quantity)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:left;color:#475569;">${toFarsi(item.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:left;font-weight:600;color:#0f172a;">${toFarsi(item.totalPrice)}</td>
      </tr>`
    )
    .join('')

  const totalItems = data.items.reduce((s, i) => s + i.quantity, 0)

  const paymentMethodColor =
    data.paymentMethod === 'نقدی'
      ? '#059669'
      : data.paymentMethod === 'نسیه'
      ? '#d97706'
      : '#2563eb'

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاکتور ${data.invoiceNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Vazirmatn', system-ui, sans-serif;
      background: #fff;
      color: #1e293b;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 12mm; size: A4; }
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
    }
    .brand {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .brand-name {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 400;
    }
    .invoice-badge {
      text-align: left;
    }
    .invoice-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .invoice-number {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      direction: ltr;
      text-align: left;
    }
    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .info-label {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }
    .payment-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      background: ${paymentMethodColor};
    }
    /* Table */
    .table-wrapper {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead th {
      padding: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-align: right;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    thead th:nth-child(3),
    thead th:nth-child(4),
    thead th:nth-child(5) {
      text-align: center;
    }
    /* Totals */
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .totals-box {
      width: 280px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      font-size: 14px;
    }
    .totals-row + .totals-row {
      border-top: 1px solid #f1f5f9;
    }
    .totals-row.discount {
      color: #dc2626;
    }
    .totals-row.final {
      background: #0f172a;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
    }
    .totals-row.final .totals-label {
      color: #94a3b8;
    }
    .totals-row.paid {
      color: #059669;
      font-weight: 500;
    }
    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 2px solid #e2e8f0;
    }
    .footer-right {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
    }
    .footer-left {
      text-align: left;
    }
    .barcode-area {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #94a3b8;
      direction: ltr;
      letter-spacing: 3px;
      background: #f8fafc;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px dashed #e2e8f0;
    }
    /* Notes */
    .notes {
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      font-size: 13px;
      color: #92400e;
    }
    .notes-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    /* Print Button */
    .print-btn {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      padding: 14px 40px;
      background: #0f172a;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-family: 'Vazirmatn', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn:hover {
      background: #1e293b;
      transform: translateX(-50%) translateY(-2px);
      box-shadow: 0 6px 25px rgba(0,0,0,0.25);
    }
    .watermark {
      position: fixed;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-name">سیستم مدریتی فروشگاه</div>
        <div class="brand-sub">Sales Management System</div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-label">شماره فاکتور</div>
        <div class="invoice-number">${data.invoiceNumber}</div>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">📅 تاریخ صدور</div>
        <div class="info-value">${data.date}</div>
      </div>
      <div class="info-card">
        <div class="info-label">👤 مشتری</div>
        <div class="info-value">${data.customer?.name || 'بدون مشتری'}</div>
        ${data.customer?.phone ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px;direction:ltr;text-align:right;">${data.customer.phone}</div>` : ''}
      </div>
      <div class="info-card">
        <div class="info-label">💰 روش پرداخت</div>
        <div><span class="payment-badge">${data.paymentMethod}</span></div>
      </div>
      <div class="info-card">
        <div class="info-label">📦 تعداد اقلام</div>
        <div class="info-value">${toFarsi(totalItems)} عدد — ${toFarsi(data.items.length)} محصول</div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width:50px;">#</th>
            <th>محصول</th>
            <th style="width:80px;">تعداد</th>
            <th style="width:120px;">قیمت واحد</th>
            <th style="width:130px;">جمع</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span class="totals-label" style="color:#94a3b8;">جمع کل</span>
          <span style="font-weight:500;">${toFarsi(data.totalAmount)} <small style="font-size:11px;color:#94a3b8;">افغانی</small></span>
        </div>
        ${data.discount > 0 ? `
        <div class="totals-row discount">
          <span class="totals-label">تخفیف</span>
          <span>−${toFarsi(data.discount)} <small style="font-size:11px;">افغانی</small></span>
        </div>` : ''}
        <div class="totals-row final">
          <span class="totals-label">مبلغ نهایی</span>
          <span>${toFarsi(data.finalAmount)} <small style="font-size:11px;opacity:0.7;">افغانی</small></span>
        </div>
        <div class="totals-row paid">
          <span class="totals-label" style="color:#059669;">پرداخت شده</span>
          <span>${toFarsi(data.paidAmount)} <small style="font-size:11px;">افغانی</small></span>
        </div>
        ${data.change > 0 ? `
        <div class="totals-row">
          <span class="totals-label" style="color:#94a3b8;">پول برگشتی</span>
          <span style="color:#64748b;">${toFarsi(data.change)} <small style="font-size:11px;">افغانی</small></span>
        </div>` : ''}
      </div>
    </div>

    ${data.notes ? `
    <div class="notes">
      <div class="notes-title">📝 یادداشت:</div>
      <div>${data.notes}</div>
    </div>` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-right">
        <div class="footer-text">با تشکر از خرید شما</div>
        <div class="footer-text">این فاکتور به صورت خودکار تولید شده است</div>
      </div>
      <div class="footer-left">
        <div class="barcode-area">${data.invoiceNumber}</div>
      </div>
    </div>
  </div>

  <!-- Print Button -->
  <button class="print-btn no-print" onclick="window.print()">
    🖨️ چاپ فاکتور
  </button>
  <div class="watermark no-print">SMS — Store Management System</div>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=850,height=900')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
