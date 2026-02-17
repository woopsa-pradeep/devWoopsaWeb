/** View model for the dynamic invoice HTML template. */
export interface DynamicInvoiceViewModel {
  vendor: { name: string; address1: string; address2: string; orderLine?: string; phoneFax?: string; whatsapp?: string };
  meta: {
    customerNo: string;
    invoiceNo: string;
    invoiceDate: string;
    page: number;
    terms: string;
    customerLicense: string;
    via: string;
    salesPerson: string;
    routeNumber: string;
    stopNumber: string;
  };
  billTo: string[];
  shipTo: string[];
  items: DynamicInvoiceItemRow[];
  categories: DynamicInvoiceCategory[];
  termsText?: string;
  netInvoice: number;
  charges: { delivery: number; crv: number };
  invoiceTotal: number;
  totalDue: number;
  totalCharges: number;
}

export interface DynamicInvoiceItemRow {
  qtyOrd: number;
  qtyShp: number;
  itemNo: string;
  pack: string | number;
  size: string;
  upc: string;
  desc: string;
  crv: number;
  unitPrice: number;
  gpPct: number;
  suggestedRetail: number;
  cost: number;
  extendedPrice: number;
}

export interface DynamicInvoiceCategory {
  qty: number;
  name: string;
  val: number;
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatMoney(n: number): string {
  return (n != null && !Number.isNaN(n) ? Number(n).toFixed(2) : '0.00');
}

/**
 * Build the full HTML document for the dynamic invoice template.
 * Data, height, and placement are dynamic from the view model.
 */
export function getDynamicInvoiceHtml(viewModel: DynamicInvoiceViewModel): string {
  const v = viewModel;
  const vendor = v.vendor;
  const meta = v.meta;

  const billToHtml = v.billTo.map((line: string) => escapeHtml(line)).join('<br>');
  const shipToHtml = v.shipTo.map((line: string) => escapeHtml(line)).join('<br>');

  const itemRowsHtml = v.items
    .map(
      (item: DynamicInvoiceItemRow) => `
    <tr>
      <td class="text-center bold">${formatMoney(item.qtyOrd)}</td>
      <td class="text-center bold">${formatMoney(item.qtyShp)}</td>
      <td class="text-center bold">${escapeHtml(item.itemNo)}</td>
      <td class="text-center">${item.pack}</td>
      <td class="text-center">${escapeHtml(item.size)}</td>
      <td class="text-center bold">${escapeHtml(item.upc)}</td>
      <td class="text-left bold col-desc">${escapeHtml(item.desc)}</td>
      <td class="text-right">${formatMoney(item.crv)}</td>
      <td class="text-right">$${formatMoney(item.unitPrice)}</td>
      <td class="text-right">${formatMoney(item.gpPct)}</td>
      <td class="text-right">$${formatMoney(item.suggestedRetail)}</td>
      <td class="text-right bold">$${formatMoney(item.cost)}</td>
      <td class="text-right bold">$${formatMoney(item.extendedPrice)}</td>
    </tr>`
    )
    .join('');

  const totalQtyShipped = v.items.reduce((s: number, i: DynamicInvoiceItemRow) => s + i.qtyShp, 0);
  const footerRowsHtml = `
    <tr class="total-row">
      <td colspan="2" class="text-center">${formatMoney(totalQtyShipped)}</td>
      <td colspan="10" class="text-center">TOTAL MERCHANDISE</td>
      <td class="text-right">$${formatMoney(v.netInvoice)}</td>
    </tr>`;

  const categoryRowsHtml = v.categories
    .map(
      (cat: DynamicInvoiceCategory) => `
    <tr>
      <td class="text-right" style="width:15%">${formatMoney(cat.qty)}</td>
      <td class="text-left" style="padding-left:15px;">${escapeHtml(cat.name)}</td>
      <td class="text-right" style="width:20%">${formatMoney(cat.val)}</td>
    </tr>`
    )
    .join('');

  const catTotalQty = v.categories.reduce((s: number, c: DynamicInvoiceCategory) => s + c.qty, 0);
  const catTotalVal = v.categories.reduce((s: number, c: DynamicInvoiceCategory) => s + c.val, 0);

  const termsHtml = (v.termsText || '')
    .split('\n')
    .map((line: string) => escapeHtml(line.trim()))
    .filter(Boolean)
    .join('<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
  <style>
    :root {
      --theme-color: #2c3e50;
      --border-color: #000;
      --bg-highlight: #e0e0e0;
      --font-main: Arial, Helvetica, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--font-main);
      font-size: 11px;
      margin: 0;
      padding: 20px;
      background-color: #555;
      display: flex;
      justify-content: center;
    }
    .invoice-paper {
      background: white;
      width: 100%;
      max-width: 950px;
      padding: 30px;
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .bold { font-weight: 700; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 20px;
    }
    .header-left {
      flex: 0.9;
      display: flex;
      flex-direction: row;
      gap: 20px;
    }
    .logo-license-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 120px;
    }
    .cw-logo {
      font-family: 'Arial Black', sans-serif;
      font-size: 70px;
      line-height: 1;
      letter-spacing: -5px;
      font-weight: 900;
      color: #000;
      margin-bottom: 10px;
    }
    .license-row { font-size: 11px; white-space: nowrap; }
    .company-details {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-top: 5px;
    }
    .company-details .invoice-title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
    .company-details h1 { margin: 0; font-size: 18px; text-transform: uppercase; font-weight: bold; line-height: 1.2; }
    .company-details p { margin: 2px 0; font-size: 11px; }
    .header-right {
      flex: 1.1;
      display: flex;
      flex-direction: column;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid var(--border-color);
      margin-bottom: 5px;
    }
    .meta-table th, .meta-table td {
      border: 1px solid var(--border-color);
      padding: 4px;
      text-align: center;
      height: 25px;
    }
    .meta-table th {
      background-color: #d3d3d3;
      font-weight: bold;
      font-size: 10px;
      white-space: nowrap;
    }
    .meta-table td { font-size: 11px; font-weight: bold; }
    .address-container { display: flex; gap: 20px; margin-bottom: 0; }
    .address-box { flex: 1; display: flex; border: 1px solid transparent; }
    .side-label {
      background-color: var(--theme-color);
      color: white;
      width: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-weight: bold;
      font-size: 10px;
      padding: 5px 0;
      flex-shrink: 0;
    }
    .address-content {
      padding: 2px 8px;
      font-size: 11px;
      line-height: 1.3;
      flex-grow: 1;
    }
    .divider {
      border: none;
      border-bottom: 1px solid var(--border-color);
      margin: 15px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid var(--border-color);
    }
    .items-table th {
      background-color: var(--theme-color);
      color: white;
      font-size: 9px;
      padding: 6px 2px;
      border: 1px solid var(--border-color);
      vertical-align: bottom;
    }
    .items-table td {
      border: 1px solid var(--border-color);
      padding: 4px;
      font-size: 10px;
      vertical-align: middle;
    }
    .col-qty { width: 4%; }
    .col-item { width: 5%; }
    .col-pack { width: 5%; }
    .col-upc { width: 10%; }
    .col-desc { width: auto; }
    .col-money { width: 7%; }
    .items-table tr.total-row { background-color: #ccc; font-weight: bold; }
    .items-table tr.total-row td { padding: 5px; font-size: 11px; }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0;
    }
    .footer-left { width: 65%; }
    .summary-table { width: 70%; border-collapse: collapse; margin-bottom: 15px; }
    .summary-table td { padding: 2px 0; font-size: 10px; }
    .summary-border-top { border-top: 1px solid #000; }
    .legal-text, .terms-text {
      font-size: 9px;
      color: #333;
      line-height: 1.3;
      text-align: justify;
      margin-right: 20px;
    }
    .footer-right { width: 30%; }
    .totals-grid { width: 100%; border-collapse: collapse; }
    .totals-grid td { padding: 4px 0; font-size: 12px; }
    .totals-grid .label { text-align: left; }
    .totals-grid .value { text-align: right; font-weight: bold; }
    .border-top { border-top: 1px solid #000; }
  </style>
</head>
<body>
  <div class="invoice-paper">
    <div class="header">
      <div class="header-left">
        <div class="logo-license-container">
          <div class="cw-logo">CW</div>
        </div>
        <div class="company-details">
          <div class="invoice-title">**INVOICE**</div>
          <h1>${escapeHtml(vendor.name)}</h1>
          <p>${escapeHtml(vendor.address1)}</p>
          <p>${escapeHtml(vendor.address2)}</p>
          ${vendor.orderLine ? `<p class="bold">Order Line: ${escapeHtml(vendor.orderLine)}</p>` : ''}
          ${vendor.phoneFax ? `<p>Phone/Fax: ${escapeHtml(vendor.phoneFax)}</p>` : ''}
          ${vendor.whatsapp ? `<p>Whatsapp #: ${escapeHtml(vendor.whatsapp)}</p>` : ''}
        </div>
      </div>
      <div class="header-right">
        <table class="meta-table">
          <thead>
            <tr>
              <th style="width:25%">CUSTOMER NO</th>
              <th style="width:25%">INVOICE#</th>
              <th style="width:25%">INVOICE DATE</th>
              <th style="width:25%">PAGE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(meta.customerNo)}</td>
              <td>${escapeHtml(meta.invoiceNo)}</td>
              <td>${escapeHtml(meta.invoiceDate)}</td>
              <td>${meta.page}</td>
            </tr>
          </tbody>
        </table>
        <table class="meta-table">
          <thead>
            <tr>
              <th style="width:20%">TERMS</th>
              <th style="width:50%">CUSTOMER LICENCE#</th>
              <th style="width:30%">VIA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(meta.terms)}</td>
              <td>${escapeHtml(meta.customerLicense)}</td>
              <td>${escapeHtml(meta.via)}</td>
            </tr>
          </tbody>
        </table>
        <table class="meta-table">
          <thead>
            <tr>
              <th style="width:40%">SALES PERSON</th>
              <th style="width:30%">ROUTE NUMBER</th>
              <th style="width:30%">STOP NUMBER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(meta.salesPerson)}</td>
              <td>${escapeHtml(meta.routeNumber)}</td>
              <td>${escapeHtml(meta.stopNumber)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="address-container">
      <div class="address-box">
        <div class="side-label">BILL TO</div>
        <div class="address-content">${billToHtml || '—'}</div>
      </div>
      <div class="address-box">
        <div class="side-label">SHIP TO</div>
        <div class="address-content">${shipToHtml || '—'}</div>
      </div>
    </div>
    <hr class="divider" />
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-qty">QTY<br>ORD</th>
          <th class="col-qty">QTY<br>SHP</th>
          <th class="col-item">ITEM<br>NO</th>
          <th class="col-pack">PACK</th>
          <th class="col-pack">SIZE</th>
          <th class="col-upc">UPC</th>
          <th class="col-desc">DESCRIPTION</th>
          <th>Deposite</th>
          <th>UNIT<br>PRICE</th>
          <th>GP%</th>
          <th>SRP</th>
          <th>COST</th>
          <th class="col-money">EXTENDED<br>PRICE</th>
        </tr>
      </thead>
      <tbody>${itemRowsHtml}</tbody>
      <tfoot>${footerRowsHtml}</tfoot>
    </table>
    <hr class="divider" />
    <div class="footer">
      <div class="footer-left">
        <div style="display: flex; gap: 40px;">
          <table class="summary-table">
            <tbody>
              ${categoryRowsHtml}
              <tr class="bold summary-border-top">
                <td class="text-right">${formatMoney(catTotalQty)}</td>
                <td class="text-left" style="padding-left:15px;">*TOTAL ITEMS</td>
                <td class="text-right">${formatMoney(catTotalVal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${termsHtml ? `<div class="legal-text">${termsHtml}</div>` : ''}
      </div>
      <div class="footer-right">
        <table class="totals-grid">
          <tr><td class="label">Net Invoice:</td><td class="value">$${formatMoney(v.netInvoice)}</td></tr>
          <tr><td class="label">Delivery Charge:</td><td class="value">$${formatMoney(v.charges.delivery)}</td></tr>
          <tr><td class="label">CRV Deposit:</td><td class="value">$${formatMoney(v.charges.crv)}</td></tr>
          <tr><td class="label border-top">Invoice Total:</td><td class="value border-top">$${formatMoney(v.invoiceTotal)}</td></tr>
          <tr><td class="label">Total Due:</td><td class="value">$${formatMoney(v.totalDue)}</td></tr>
          <tr><td class="label">Total Charges:</td><td class="value">$${formatMoney(v.totalCharges)}</td></tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;
}
