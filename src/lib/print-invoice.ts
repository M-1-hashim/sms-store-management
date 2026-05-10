// ─── Invoice Print Utility ────────────────────────────────────────────
// Prints invoice using hidden iframe with professional design

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
        <td style="padding:14px 16px;border-bottom:1px solid #e8ecf1;font-size:12px;color:#8896a7;width:40px;text-align:center;">${toFarsi(i + 1)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e8ecf1;font-size:13.5px;font-weight:600;color:#1a2332;">${sanitizeHtml(item.name)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e8ecf1;font-size:13px;text-align:center;color:#3d4f63;">${toFarsi(item.quantity)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e8ecf1;font-size:13px;text-align:left;color:#3d4f63;">${toFarsi(item.unitPrice)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e8ecf1;font-size:13.5px;text-align:left;font-weight:700;color:#1a2332;">${toFarsi(item.totalPrice)}</td>
      </tr>`
    )
    .join('')

  const totalItems = data.items.reduce((s, i) => s + i.quantity, 0)

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاکتور ${sanitizeHtml(data.invoiceNumber)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      margin: 10mm;
      size: A4;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Vazirmatn', system-ui, -apple-system, sans-serif;
      background: #fff;
      color: #1a2332;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      padding: 0;
    }

    /* ─── Top Accent Bar ─── */
    .accent-bar {
      height: 6px;
      background: linear-gradient(90deg, #0d9488, #0f766e, #115e59);
      border-radius: 0 0 4px 4px;
    }

    /* ─── Header ─── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 32px 24px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-box {
      width: 64px;
      height: 64px;
      border-radius: 14px;
      background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
      border: 2px solid #99f6e4;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    .logo-placeholder {
      font-size: 24px;
      font-weight: 900;
      color: #0d9488;
    }
    .brand-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .store-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .store-name-en {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 400;
      letter-spacing: 0.5px;
      direction: ltr;
      text-align: right;
    }
    .invoice-tag {
      text-align: left;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 20px;
    }
    .invoice-tag-label {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 0.8px;
      margin-bottom: 2px;
    }
    .invoice-tag-number {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      direction: ltr;
      text-align: left;
      letter-spacing: 0.5px;
    }

    /* ─── Divider ─── */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #cbd5e1 20%, #cbd5e1 80%, transparent);
      margin: 0 32px;
    }

    /* ─── Info Section ─── */
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0;
      padding: 20px 32px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 8px 0;
    }
    .info-item:not(:last-child) {
      border-left: 1px solid #e8ecf1;
      padding-left: 20px;
      margin-left: 20px;
    }
    .info-key {
      font-size: 10.5px;
      color: #94a3b8;
      font-weight: 500;
    }
    .info-val {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
    }
    .info-sub {
      font-size: 11px;
      color: #8896a7;
      font-weight: 400;
      direction: ltr;
      text-align: right;
    }
    .payment-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      background: #0d9488;
      width: fit-content;
    }

    /* ─── Table Section ─── */
    .table-section {
      margin: 8px 32px 0;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .table-section table {
      width: 100%;
      border-collapse: collapse;
    }
    .table-section thead th {
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-align: right;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      letter-spacing: 0.3px;
    }
    .table-section thead th:nth-child(1) { text-align: center; width: 40px; }
    .table-section thead th:nth-child(3) { text-align: center; }
    .table-section thead th:nth-child(4) { text-align: left; }
    .table-section thead th:nth-child(5) { text-align: left; }
    .table-section tbody tr:last-child td {
      border-bottom: none;
    }
    .table-section tbody tr:nth-child(even) {
      background: #fafbfc;
    }

    /* ─── Totals Section ─── */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      padding: 20px 32px 0;
    }
    .totals-card {
      width: 300px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .totals-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 18px;
      font-size: 13px;
    }
    .totals-line + .totals-line {
      border-top: 1px solid #f1f5f9;
    }
    .totals-line .label {
      color: #64748b;
      font-weight: 500;
    }
    .totals-line .value {
      color: #334155;
      font-weight: 600;
    }
    .totals-line .cur {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 400;
      margin-right: 4px;
    }
    .totals-line.discount .label,
    .totals-line.discount .value {
      color: #dc2626;
    }
    .totals-line.final-row {
      background: #0f172a;
      padding: 14px 18px;
    }
    .totals-line.final-row .label {
      color: #94a3b8;
      font-weight: 500;
      font-size: 13px;
    }
    .totals-line.final-row .value {
      color: #fff;
      font-weight: 800;
      font-size: 17px;
    }
    .totals-line.final-row .cur {
      color: #64748b;
    }
    .totals-line.paid-row .label {
      color: #059669;
    }
    .totals-line.paid-row .value {
      color: #059669;
    }

    /* ─── Notes ─── */
    .notes-box {
      margin: 16px 32px 0;
      padding: 12px 16px;
      background: #fefce8;
      border: 1px solid #fde68a;
      border-right: 3px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      font-size: 12.5px;
      color: #854d0e;
      line-height: 1.7;
    }
    .notes-box strong {
      font-weight: 700;
      color: #92400e;
    }

    /* ─── Store Contact ─── */
    .contact-bar {
      margin: 20px 32px 0;
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      padding: 14px 18px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e8ecf1;
      font-size: 11.5px;
      color: #64748b;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .contact-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #0d9488;
      flex-shrink: 0;
    }

    /* ─── Footer ─── */
    .footer-section {
      margin: 24px 32px 0;
      padding-top: 16px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-msg {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.8;
    }
    .footer-msg strong {
      color: #64748b;
      font-weight: 600;
    }
    .barcode-box {
      font-family: 'Libre Barcode 39', 'Courier New', monospace;
      font-size: 10px;
      color: #94a3b8;
      direction: ltr;
      letter-spacing: 2.5px;
      background: #f8fafc;
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px dashed #cbd5e1;
    }
    .footer-brand {
      margin-top: 16px;
      text-align: center;
      font-size: 9.5px;
      color: #cbd5e1;
      letter-spacing: 1px;
      direction: ltr;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Accent Bar -->
    <div class="accent-bar"></div>

    <!-- Header -->
    <div class="header">
      <div class="brand-section">
        <div class="logo-box">
          ${settings.logo
            ? `<img src="${settings.logo}" alt="logo" />`
            : `<span class="logo-placeholder">${sanitizeHtml(settings.storeName).charAt(0)}</span>`
          }
        </div>
        <div class="brand-info">
          <div class="store-name">${sanitizeHtml(settings.storeName)}</div>
          <div class="store-name-en">${sanitizeHtml(settings.storeNameEn)}</div>
        </div>
      </div>
      <div class="invoice-tag">
        <div class="invoice-tag-label">INVOICE NUMBER</div>
        <div class="invoice-tag-number">${data.invoiceNumber}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="info-item">
        <div class="info-key">تاریخ صدور</div>
        <div class="info-val">${sanitizeHtml(data.date)}</div>
      </div>
      <div class="info-item">
        <div class="info-key">مشتری</div>
        <div class="info-val">${sanitizeHtml(data.customer?.name || 'بدون مشتری')}</div>
        ${data.customer?.phone ? `<div class="info-sub">${sanitizeHtml(data.customer.phone)}</div>` : ''}
      </div>
      <div class="info-item">
        <div class="info-key">روش پرداخت</div>
        <div class="payment-chip">${sanitizeHtml(data.paymentMethod)}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Items Table -->
    <div class="table-section">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>محصول</th>
            <th>تعداد</th>
            <th>قیمت واحد</th>
            <th>جمع</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-card">
        <div class="totals-line">
          <span class="label">جمع کل</span>
          <span class="value">${toFarsi(data.totalAmount)} <span class="cur">${settings.currency}</span></span>
        </div>
        ${data.discount > 0 ? `
        <div class="totals-line discount">
          <span class="label">تخفیف</span>
          <span class="value">&minus;${toFarsi(data.discount)} <span class="cur">${settings.currency}</span></span>
        </div>` : ''}
        <div class="totals-line final-row">
          <span class="label">مبلغ نهایی</span>
          <span class="value">${toFarsi(data.finalAmount)} <span class="cur">${settings.currency}</span></span>
        </div>
        <div class="totals-line paid-row">
          <span class="label">پرداخت شده</span>
          <span class="value">${toFarsi(data.paidAmount)} <span class="cur">${settings.currency}</span></span>
        </div>
        ${data.change > 0 ? `
        <div class="totals-line">
          <span class="label">پول برگشتی</span>
          <span class="value">${toFarsi(data.change)} <span class="cur">${settings.currency}</span></span>
        </div>` : ''}
      </div>
    </div>

    ${data.notes ? `
    <div class="notes-box">
      <strong>یادداشت:</strong> ${sanitizeHtml(data.notes || '')}
    </div>` : ''}

    ${settings.phone || settings.email || settings.address ? `
    <div class="contact-bar">
      ${settings.phone ? `<div class="contact-item"><div class="contact-dot"></div>${sanitizeHtml(settings.phone)}</div>` : ''}
      ${settings.email ? `<div class="contact-item"><div class="contact-dot"></div>${sanitizeHtml(settings.email)}</div>` : ''}
      ${settings.address ? `<div class="contact-item"><div class="contact-dot"></div>${sanitizeHtml(settings.address)}</div>` : ''}
      ${settings.taxNumber ? `<div class="contact-item"><div class="contact-dot"></div>نمبر مالیاتی: ${sanitizeHtml(settings.taxNumber)}</div>` : ''}
    </div>` : ''}

    <!-- Footer -->
    <div class="footer-section">
      <div class="footer-msg">
        <strong>${sanitizeHtml(settings.invoiceFooter || 'با تشکر از خرید شما')}</strong><br>
        این فاکتور به صورت خودکار تولید شده است
      </div>
      <div class="barcode-box">${sanitizeHtml(data.invoiceNumber)}</div>
    </div>

    <div class="footer-brand">SMS &mdash; Store Management System</div>

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
