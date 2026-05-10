// ─── Invoice Print Utility ────────────────────────────────────────────
// Prints invoice using hidden iframe (no popup blocker issues)

import { apiFetch } from '@/lib/auth-store'

export interface StoreSettings {
  storeName: string
  storeNameEn: string
  address: string
  phone: string
  email: string
  logo: string | null
  taxNumber: string
  invoiceFooter: string
  currency: string
}

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

function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildInvoiceHtml(data: InvoiceData, settings: StoreSettings): string {
  const toFarsi = (n: number) => n.toLocaleString('fa-AF')

  const itemsRows = data.items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${toFarsi(i + 1)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#1e293b;">${sanitizeHtml(item.name)}</td>
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

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاکتور ${sanitizeHtml(data.invoiceNumber)}</title>
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
    @page { margin: 12mm; size: A4; }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
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
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        ${settings.logo ? `<img src="${settings.logo}" style="width:56px;height:56px;border-radius:12px;margin-bottom:8px;object-fit:cover;" />` : ''}
        <div class="brand-name">${sanitizeHtml(settings.storeName)}</div>
        <div class="brand-sub">${sanitizeHtml(settings.storeNameEn)}</div>
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
        <div class="info-value">${sanitizeHtml(data.date)}</div>
      </div>
      <div class="info-card">
        <div class="info-label">👤 مشتری</div>
        <div class="info-value">${sanitizeHtml(data.customer?.name || 'بدون مشتری')}</div>
        ${data.customer?.phone ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px;direction:ltr;text-align:right;">${sanitizeHtml(data.customer.phone)}</div>` : ''}
      </div>
      <div class="info-card">
        <div class="info-label">💰 روش پرداخت</div>
        <div><span class="payment-badge">${sanitizeHtml(data.paymentMethod)}</span></div>
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
          <span style="font-weight:500;">${toFarsi(data.totalAmount)} <small style="font-size:11px;color:#94a3b8;">${settings.currency}</small></span>
        </div>
        ${data.discount > 0 ? `
        <div class="totals-row discount">
          <span class="totals-label">تخفیف</span>
          <span>−${toFarsi(data.discount)} <small style="font-size:11px;">${settings.currency}</small></span>
        </div>` : ''}
        <div class="totals-row final">
          <span class="totals-label">مبلغ نهایی</span>
          <span>${toFarsi(data.finalAmount)} <small style="font-size:11px;opacity:0.7;">${settings.currency}</small></span>
        </div>
        <div class="totals-row paid">
          <span class="totals-label" style="color:#059669;">پرداخت شده</span>
          <span>${toFarsi(data.paidAmount)} <small style="font-size:11px;">${settings.currency}</small></span>
        </div>
        ${data.change > 0 ? `
        <div class="totals-row">
          <span class="totals-label" style="color:#94a3b8;">پول برگشتی</span>
          <span style="color:#64748b;">${toFarsi(data.change)} <small style="font-size:11px;">${settings.currency}</small></span>
        </div>` : ''}
      </div>
    </div>

    ${data.notes ? `
    <div class="notes">
      <div class="notes-title">📝 یادداشت:</div>
      <div>${sanitizeHtml(data.notes || '')}</div>
    </div>` : ''}

    ${settings.phone || settings.email || settings.address ? `
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:20px;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;font-size:12px;color:#64748b;">
      ${settings.phone ? `<span>📞 ${sanitizeHtml(settings.phone)}</span>` : ''}
      ${settings.email ? `<span>✉️ ${sanitizeHtml(settings.email)}</span>` : ''}
      ${settings.address ? `<span>📍 ${sanitizeHtml(settings.address)}</span>` : ''}
      ${settings.taxNumber ? `<span>🔢 ${sanitizeHtml(settings.taxNumber)}</span>` : ''}
    </div>` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-right">
        <div class="footer-text">${sanitizeHtml(settings.invoiceFooter || 'با تشکر از خرید شما')}</div>
        <div class="footer-text">این فاکتور به صورت خودکار تولید شده است</div>
      </div>
      <div class="footer-left">
        <div class="barcode-area">${sanitizeHtml(data.invoiceNumber)}</div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function printInvoice(data: InvoiceData) {
  const defaultSettings: StoreSettings = {
    storeName: 'فروشگاه من',
    storeNameEn: 'My Store',
    address: '',
    phone: '',
    email: '',
    logo: null,
    taxNumber: '',
    invoiceFooter: 'با تشکر از خرید شما',
    currency: 'افغانی',
  }

  // Fetch settings from API
  let settings = defaultSettings
  try {
    const res = await apiFetch('/api/settings')
    const json = await res.json()
    if (json.success && json.data) {
      settings = { ...defaultSettings, ...json.data }
    }
  } catch {
    // Use default settings if fetch fails
  }

  // Build the invoice HTML
  const html = buildInvoiceHtml(data, settings)

  // Use iframe to avoid popup blockers
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.style.opacity = '0'
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) return

  iframeDoc.open()
  iframeDoc.write(html)
  iframeDoc.close()

  // Wait for fonts and styles to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {
        // Fallback: print the current window
        window.print()
      }

      // Clean up iframe after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 500)
  }
}
