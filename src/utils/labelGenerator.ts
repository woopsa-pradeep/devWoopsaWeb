import JsBarcode from 'jsbarcode';
import { Order, BoxItem } from '../redux/apis/sales/orderCheckerApis';

export type LabelSize = '4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4';

export interface LabelData {
  size: LabelSize;
  route: string;
  stop: string;
  boxId: number;
  containerType: 'box' | 'tote' | 'drink';
  customerName: string;
  customerAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  custNumber?: string;
  accountNumber: string;
  deliveryDate?: string;
  itemCount?: number;
  xOfY: string;
  boxItems?: BoxItem[];
}

/**
 * Generate barcode as data URL
 */
export const generateBarcode = (value: string | number): string => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, String(value), {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: false,
    margin: 0,
  });
  return canvas.toDataURL('image/png');
};

/**
 * Get label dimensions in inches
 */
const getLabelDimensions = (size: LabelSize): { width: number; height: number } => {
  switch (size) {
    case '4x3':
      return { width: 4, height: 3 };
    case '4x6':
      return { width: 6, height: 4 }; // Landscape
    case '3x6':
      return { width: 6, height: 3 }; // Landscape
    case '3x2':
      return { width: 3, height: 2 };
    case '4x4':
      return { width: 4, height: 4 };
    case '2x2':
      return { width: 2, height: 2 };
    case '2x3':
      return { width: 3, height: 2 }; // Landscape
    case 'A4':
      return { width: 8.27, height: 11.69 }; // A4 in inches (portrait)
    default:
      return { width: 6, height: 4 };
  }
};

/**
 * Generate 4x3 label HTML
 */
const generate4x3LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 4in 3in landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 4in;
      height: 3in;
      font-family: Arial, sans-serif;
      padding: 0.1in;
      position: relative;
    }
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.08in;
      display: flex;
      flex-direction: column;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.06in;
    }
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.03in 0.1in;
      font-size: 16pt;
      font-weight: bold;
    }
    .barcode-section {
      text-align: center;
      margin: 0.06in 0;
    }
    .barcode-section img {
      max-width: 85%;
      height: auto;
      max-height: 0.5in;
    }
    .customer-section {
      border: 2px solid black;
      padding: 0.05in;
      margin-bottom: 0.05in;
      font-size: 9pt;
    }
    .customer-name {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 0.03in;
    }
    .address-line {
      font-size: 8pt;
      margin-bottom: 0.01in;
    }
    .cust-number {
      text-align: right;
      font-size: 8pt;
      margin-top: 0.03in;
    }
    .bottom-section {
      margin-top: auto;
      padding-top: 0.05in;
    }
    .info-row {
      font-size: 8pt;
      margin-bottom: 0.02in;
    }
    .delivery-date {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 0.02in;
    }
    .item-count {
      font-size: 8pt;
    }
    .box-indicator {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="header-section">
      <div class="route-box">ROUTE: ${data.route}</div>
      <div class="stop-box">STOP: ${data.stop}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" />
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    <div class="bottom-section">
      <div class="info-row">${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Number of Items in Container: ${data.itemCount}</div>` : ''}
    </div>
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate 4x6 label HTML (landscape)
 */
const generate4x6LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 6in 4in landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 6in;
      height: 4in;
      font-family: Arial, sans-serif;
      padding: 0.12in;
      position: relative;
    }
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.1in;
      display: flex;
      flex-direction: column;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.08in;
    }
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.04in 0.12in;
      font-size: 20pt;
      font-weight: bold;
    }
    .barcode-section {
      text-align: center;
      margin: 0.08in 0;
    }
    .barcode-section img {
      max-width: 88%;
      height: auto;
      max-height: 0.55in;
    }
    .box-id {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      margin-top: 0.04in;
    }
    .customer-section {
      border: 2px solid black;
      padding: 0.06in;
      margin-bottom: 0.06in;
      font-size: 10pt;
    }
    .customer-name {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 0.04in;
    }
    .address-line {
      font-size: 9pt;
      margin-bottom: 0.02in;
      line-height: 1.2;
    }
    .cust-number {
      text-align: right;
      font-size: 9pt;
      margin-top: 0.04in;
    }
    .bottom-section {
      margin-top: auto;
      padding-top: 0.06in;
    }
    .info-row {
      font-size: 9pt;
      margin-bottom: 0.03in;
    }
    .delivery-date {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 0.03in;
    }
    .item-count {
      font-size: 9pt;
      margin-bottom: 0.05in;
    }
    .box-indicator {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-top: 0.06in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="header-section">
      <div class="route-box">ROUTE: ${data.route}</div>
      <div class="stop-box">STOP: ${data.stop}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    <div class="bottom-section">
      <div class="info-row">${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Number of Items in Container: ${data.itemCount}</div>` : ''}
    </div>
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate 3x6 label HTML (landscape)
 */
const generate3x6LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 6in 3in landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 6in;
      height: 3in;
      font-family: Arial, sans-serif;
      padding: 0.1in;
      position: relative;
    }
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.08in;
      display: flex;
      flex-direction: column;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.1in;
    }
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.04in 0.12in;
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
    }
    .barcode-section {
      text-align: center;
      margin: 0.1in 0;
    }
    .barcode-section img {
      max-width: 90%;
      height: auto;
      max-height: 0.6in;
    }
    .box-id {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
    .customer-section {
      border: 2px solid black;
      padding: 0.06in;
      margin-bottom: 0.08in;
      font-size: 10pt;
    }
    .customer-name {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 0.04in;
    }
    .address-line {
      font-size: 9pt;
      margin-bottom: 0.02in;
      line-height: 1.2;
    }
    .cust-number {
      text-align: right;
      font-size: 9pt;
      margin-top: 0.04in;
    }
    .bottom-section {
      margin-top: auto;
      padding-top: 0.08in;
    }
    .info-row {
      font-size: 9pt;
      margin-bottom: 0.03in;
    }
    .delivery-date {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 0.03in;
    }
    .item-count {
      font-size: 9pt;
      margin-bottom: 0.05in;
    }
    .box-indicator {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-top: 0.08in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="header-section">
      <div class="route-box">ROUTE: ${data.route}</div>
      <div class="stop-box">STOP: ${data.stop}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    <div class="bottom-section">
      <div class="info-row">Account: ${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Items in Container: ${data.itemCount}</div>` : ''}
    </div>
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate 3x2 label HTML
 */
const generate3x2LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 3in 2in landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 3in;
      height: 2in;
      font-family: Arial, sans-serif;
      padding: 0.06in;
      position: relative;
    }
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.05in;
      display: flex;
      flex-direction: column;
    }
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.04in;
    }
    .route-box, .stop-box {
      border: 1.5px solid black;
      padding: 0.02in 0.08in;
      font-size: 11pt;
      font-weight: bold;
    }
    .box-indicator-top {
      font-size: 14pt;
      font-weight: bold;
    }
    .barcode-section {
      text-align: center;
      margin: 0.03in 0;
    }
    .barcode-section img {
      max-width: 80%;
      height: auto;
      max-height: 0.35in;
    }
    .box-id {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 0.02in;
    }
    .customer-section {
      border: 1.5px solid black;
      padding: 0.03in;
      margin-bottom: 0.03in;
      font-size: 7pt;
    }
    .customer-name {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 0.02in;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .address-line {
      font-size: 7pt;
      margin-bottom: 0.01in;
      line-height: 1.1;
    }
    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      margin-top: auto;
    }
    .left-info {
      flex: 1;
    }
    .account-number {
      font-weight: bold;
      margin-bottom: 0.01in;
    }
    .delivery-date {
      font-size: 7pt;
      margin-bottom: 0.01in;
    }
    .item-count {
      font-size: 7pt;
    }
    .cust-number {
      font-size: 7pt;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="top-row">
      <div style="display: flex; gap: 0.1in;">
        <div class="route-box">R:${data.route}</div>
        <div class="stop-box">S:${data.stop}</div>
      </div>
      <div class="box-indicator-top">${data.xOfY}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
    </div>
    <div class="bottom-row">
      <div class="left-info">
        <div class="account-number">${data.accountNumber}</div>
        ${data.deliveryDate ? `<div class="delivery-date">Del: ${data.deliveryDate}</div>` : ''}
        ${data.itemCount !== undefined ? `<div class="item-count">Items: ${data.itemCount}</div>` : ''}
      </div>
      ${data.custNumber ? `<div class="cust-number">C#${data.custNumber}</div>` : ''}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate 4x4 label HTML
 */
const generate4x4LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 4in 4in landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 4in;
      height: 4in;
      font-family: Arial, sans-serif;
      padding: 0.12in;
      position: relative;
    }
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.1in;
      display: flex;
      flex-direction: column;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.08in;
    }
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.04in 0.12in;
      font-size: 20pt;
      font-weight: bold;
    }
    .barcode-section {
      text-align: center;
      margin: 0.08in 0;
    }
    .barcode-section img {
      max-width: 88%;
      height: auto;
      max-height: 0.55in;
    }
    .box-id {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      margin-top: 0.04in;
    }
    .customer-section {
      border: 2px solid black;
      padding: 0.06in;
      margin-bottom: 0.06in;
      font-size: 10pt;
    }
    .customer-name {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 0.04in;
    }
    .address-line {
      font-size: 9pt;
      margin-bottom: 0.02in;
      line-height: 1.2;
    }
    .cust-number {
      text-align: right;
      font-size: 9pt;
      margin-top: 0.04in;
    }
    .bottom-section {
      margin-top: auto;
      padding-top: 0.06in;
    }
    .info-row {
      font-size: 9pt;
      margin-bottom: 0.03in;
    }
    .delivery-date {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 0.03in;
    }
    .item-count {
      font-size: 9pt;
      margin-bottom: 0.05in;
    }
    .box-indicator {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-top: 0.06in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="header-section">
      <div class="route-box">ROUTE: ${data.route}</div>
      <div class="stop-box">STOP: ${data.stop}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    <div class="bottom-section">
      <div class="info-row">${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Number of Items in Container: ${data.itemCount}</div>` : ''}
    </div>
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate 2x2 label HTML
 */
const generate2x2LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 2in 2in landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 2in;
      height: 2in;
      font-family: Arial, sans-serif;
      padding: 0.05in;
      position: relative;
    }
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.04in;
      display: flex;
      flex-direction: column;
    }
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.03in;
    }
    .route-box, .stop-box {
      border: 1.5px solid black;
      padding: 0.015in 0.06in;
      font-size: 9pt;
      font-weight: bold;
    }
    .box-indicator-top {
      font-size: 12pt;
      font-weight: bold;
    }
    .barcode-section {
      text-align: center;
      margin: 0.025in 0;
    }
    .barcode-section img {
      max-width: 75%;
      height: auto;
      max-height: 0.3in;
    }
    .box-id {
      text-align: center;
      font-size: 8pt;
      font-weight: bold;
      margin-top: 0.015in;
    }
    .customer-section {
      border: 1.5px solid black;
      padding: 0.025in;
      margin-bottom: 0.025in;
      font-size: 6pt;
    }
    .customer-name {
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 0.015in;
      line-height: 1.1;
    }
    .address-line {
      font-size: 6pt;
      margin-bottom: 0.01in;
      line-height: 1.1;
    }
    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 6pt;
      margin-top: auto;
    }
    .left-info {
      flex: 1;
    }
    .account-number {
      font-weight: bold;
      margin-bottom: 0.01in;
    }
    .delivery-date {
      font-size: 6pt;
      margin-bottom: 0.01in;
    }
    .item-count {
      font-size: 6pt;
    }
    .cust-number {
      font-size: 6pt;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="top-row">
      <div style="display: flex; gap: 0.1in;">
        <div class="route-box">R:${data.route}</div>
        <div class="stop-box">S:${data.stop}</div>
      </div>
      <div class="box-indicator-top">${data.xOfY}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
    </div>
    <div class="bottom-row">
      <div class="left-info">
        <div class="account-number">${data.accountNumber}</div>
        ${data.deliveryDate ? `<div class="delivery-date">Del: ${data.deliveryDate}</div>` : ''}
        ${data.itemCount !== undefined ? `<div class="item-count">Items: ${data.itemCount}</div>` : ''}
      </div>
      ${data.custNumber ? `<div class="cust-number">C#${data.custNumber}</div>` : ''}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate 2x3 label HTML (landscape)
 */
const generate2x3LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 3in 2in landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 3in;
      height: 2in;
      font-family: Arial, sans-serif;
      padding: 0.06in;
      position: relative;
    }
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.05in;
      display: flex;
      flex-direction: column;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.06in;
    }
    .route-box, .stop-box {
      border: 1.5px solid black;
      padding: 0.025in 0.08in;
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
    }
    .barcode-section {
      text-align: center;
      margin: 0.05in 0;
    }
    .barcode-section img {
      max-width: 85%;
      height: auto;
      max-height: 0.4in;
    }
    .box-id {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 0.03in;
    }
    .customer-section {
      border: 1.5px solid black;
      padding: 0.04in;
      margin-bottom: 0.05in;
      font-size: 7pt;
    }
    .customer-name {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 0.025in;
      line-height: 1.2;
    }
    .address-line {
      font-size: 7pt;
      margin-bottom: 0.015in;
      line-height: 1.1;
    }
    .cust-number {
      text-align: right;
      font-size: 7pt;
      margin-top: 0.025in;
    }
    .bottom-section {
      margin-top: auto;
      padding-top: 0.05in;
    }
    .info-row {
      font-size: 7pt;
      margin-bottom: 0.02in;
    }
    .delivery-date {
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 0.02in;
    }
    .item-count {
      font-size: 7pt;
      margin-bottom: 0.04in;
    }
    .box-indicator {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="header-section">
      <div class="route-box">ROUTE: ${data.route}</div>
      <div class="stop-box">STOP: ${data.stop}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    <div class="bottom-section">
      <div class="info-row">${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Number of Items In Container: ${data.itemCount}</div>` : ''}
    </div>
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate A4 label HTML
 */
const generateA4LabelHTML = (data: LabelData): string => {
  const barcodeUrl = generateBarcode(data.boxId);
  const itemsRows = data.boxItems && data.boxItems.length > 0
    ? data.boxItems.map((item) => `
      <tr>
        <td style="text-align: center; padding: 8px;">${item.itemNumber || 'N/A'}</td>
        <td style="padding: 8px;">${item.description || 'N/A'}</td>
        <td style="text-align: center; padding: 8px;">${item.qty || 0}</td>
      </tr>
    `).join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 15px;
      margin: 0;
    }
    .label-container {
      width: 100%;
      min-height: 100%;
      border: 2px solid black;
      padding: 0.2in;
      display: flex;
      flex-direction: column;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.15in;
    }
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.05in 0.15in;
      font-size: 24pt;
      font-weight: bold;
    }
    .barcode-section {
      text-align: center;
      margin: 0.15in 0;
    }
    .barcode-img {
      max-width: 400px;
      height: auto;
      margin-bottom: 10px;
    }
    .box-id {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
    .customer-section {
      border: 2px solid black;
      padding: 0.1in;
      margin-bottom: 0.15in;
      font-size: 12pt;
    }
    .customer-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 0.06in;
    }
    .address-line {
      font-size: 11pt;
      margin-bottom: 0.03in;
      line-height: 1.3;
    }
    .cust-number {
      text-align: right;
      font-size: 11pt;
      margin-top: 0.06in;
    }
    .info-section {
      margin-bottom: 0.15in;
      font-size: 11pt;
    }
    .info-row {
      margin-bottom: 0.05in;
    }
    .delivery-date {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 0.05in;
    }
    .item-count {
      font-size: 11pt;
      margin-bottom: 0.1in;
    }
    .box-indicator {
      text-align: center;
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 0.15in;
    }
    .items-section {
      margin-top: 0.2in;
    }
    .items-title {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 0.1in;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.1in;
      font-size: 11pt;
      border: 1px solid black;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
      text-align: center;
      padding: 12px 10px;
      border: 1px solid black;
    }
    td {
      padding: 10px;
      border: 1px solid black;
    }
    .no-items {
      text-align: center;
      padding: 30px;
      color: #666;
      font-style: italic;
      font-size: 12pt;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="header-section">
      <div class="route-box">ROUTE: ${data.route}</div>
      <div class="stop-box">STOP: ${data.stop}</div>
    </div>
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${data.boxId}" class="barcode-img" />
      <div class="box-id">${data.boxId}</div>
    </div>
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    <div class="info-section">
      <div class="info-row">Account: ${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Number of Items in Container: ${data.itemCount}</div>` : ''}
    </div>
    <div class="box-indicator">
      ${data.xOfY}
    </div>
    <div class="items-section">
      <div class="items-title">${data.containerType.toUpperCase()} ${data.boxId} Items</div>
      ${data.boxItems && data.boxItems.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Item Number</th>
              <th>Description</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      ` : `
        <div class="no-items">No items found in this ${data.containerType}</div>
      `}
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate label HTML based on size
 */
export const generateLabelHTML = (data: LabelData): string => {
  switch (data.size) {
    case '4x3':
      return generate4x3LabelHTML(data);
    case '4x6':
      return generate4x6LabelHTML(data);
    case '3x6':
      return generate3x6LabelHTML(data);
    case '3x2':
      return generate3x2LabelHTML(data);
    case '4x4':
      return generate4x4LabelHTML(data);
    case '2x2':
      return generate2x2LabelHTML(data);
    case '2x3':
      return generate2x3LabelHTML(data);
    case 'A4':
      return generateA4LabelHTML(data);
    default:
      return generate4x6LabelHTML(data);
  }
};

/**
 * Extract body content from full HTML document
 */
const extractBodyContent = (html: string): string => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1].trim();
  }
  return html;
};

/**
 * Extract styles from full HTML document
 */
const extractStyles = (html: string): string => {
  const styleMatch = html.match(/<style[^>]*>([\s\S]*)<\/style>/i);
  if (styleMatch && styleMatch[1]) {
    return styleMatch[1].trim();
  }
  return '';
};

/**
 * Generate label HTML for a single container
 */
const generateSingleLabelHTML = (
  order: Order,
  size: LabelSize,
  containerId: number,
  containerType: 'box' | 'tote' | 'drink',
  allOrderItems: any[],
  accountNumber: string,
  customerAddress?: string,
  city?: string,
  state?: string,
  zip?: string,
  custNumber?: string,
  deliveryDate?: string,
  index?: number,
  total?: number
): { body: string; styles: string } => {
  const containerItems = allOrderItems.filter(
    item => item.boxId === containerId && item.boxType === containerType
  );
  const itemCount = containerItems.reduce((sum, item) => sum + item.qty, 0);
  
  const labelData: LabelData = {
    size,
    route: String(order.route),
    stop: String(order.stop || 'N/A'),
    boxId: containerId,
    containerType,
    customerName: order.customerName,
    customerAddress,
    city,
    state,
    zip,
    custNumber,
    accountNumber,
    deliveryDate,
    itemCount,
    xOfY: index !== undefined && total !== undefined ? `${index + 1} of ${total}` : '1 of 1',
    boxItems: containerItems,
  };

  const fullHTML = generateLabelHTML(labelData);
  return {
    body: extractBodyContent(fullHTML),
    styles: extractStyles(fullHTML),
  };
};

/**
 * Print labels for containers
 */
export const printLabels = (
  order: Order,
  size: LabelSize,
  containerIds: number[],
  containerType: 'box' | 'tote' | 'drink',
  allOrderItems: any[],
  accountNumber: string = '',
  customerAddress?: string,
  city?: string,
  state?: string,
  zip?: string,
  custNumber?: string,
  deliveryDate?: string
): void => {
  if (containerIds.length === 0) {
    return;
  }

  // Get all containers of this type from the order
  const orderContainers = containerType === 'box' ? order.box :
    containerType === 'tote' ? order.tote :
    order.drink;

  // Filter to only containers that exist in the order and are in containerIds
  const containersToPrint = containerIds.filter(id => orderContainers.includes(id));

  if (containersToPrint.length === 0) {
    return;
  }

  const totalContainers = containersToPrint.length;
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print labels');
    return;
  }

  let bodyHTML = '';
  const allStyles = new Set<string>();
  
  containersToPrint.forEach((containerId, index) => {
    const label = generateSingleLabelHTML(
      order,
      size,
      containerId,
      containerType,
      allOrderItems,
      accountNumber,
      customerAddress,
      city,
      state,
      zip,
      custNumber,
      deliveryDate,
      index,
      totalContainers
    );
    
    // Remove @page rules from styles (we'll add a single one)
    const cleanedStyles = label.styles.replace(/@page\s*\{[^}]*\}/gi, '');
    allStyles.add(cleanedStyles);
    
    bodyHTML += `<div class="label-page" style="page-break-after: always; page-break-inside: avoid;">${label.body}</div>`;
  });

  const dimensions = getLabelDimensions(size);
  const isA4 = size === 'A4';
  const pageSize = isA4 
    ? 'A4' 
    : `${dimensions.width}in ${dimensions.height}in landscape`;

  const combinedStyles = Array.from(allStyles)
    .join('\n')
    .replace(/body\s*\{[^}]*width:[^;]*;[^}]*\}/gi, '')
    .replace(/body\s*\{[^}]*height:[^;]*;[^}]*\}/gi, '');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Labels</title>
      <style>
        @page {
          size: ${pageSize};
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          font-family: Arial, sans-serif;
        }
        .label-page {
          width: ${dimensions.width}in;
          height: ${dimensions.height}in;
          page-break-after: always;
          page-break-inside: avoid;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .label-page:last-child {
          page-break-after: auto;
        }
        .label-page .label-container {
          width: 100%;
          height: 100%;
        }
        ${combinedStyles}
        @media print {
          @page {
            size: ${pageSize};
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          .label-page {
            width: ${dimensions.width}in;
            height: ${dimensions.height}in;
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            break-inside: avoid;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .label-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .label-page .label-container {
            width: 100%;
            height: 100%;
          }
        }
      </style>
    </head>
    <body>
      ${bodyHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

/**
 * Print labels for multiple container types in a single print window
 */
export const printAllLabels = (
  order: Order,
  size: LabelSize,
  allContainers: Array<{ id: number; type: 'box' | 'tote' | 'drink' }>,
  allOrderItems: any[],
  accountNumber: string = '',
  customerAddress?: string,
  city?: string,
  state?: string,
  zip?: string,
  custNumber?: string,
  deliveryDate?: string
): void => {
  if (allContainers.length === 0) {
    return;
  }

  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print labels');
    return;
  }

  let bodyHTML = '';
  const allStyles = new Set<string>();
  const totalContainers = allContainers.length;
  
  allContainers.forEach((container, index) => {
    const label = generateSingleLabelHTML(
      order,
      size,
      container.id,
      container.type,
      allOrderItems,
      accountNumber,
      customerAddress,
      city,
      state,
      zip,
      custNumber,
      deliveryDate,
      index,
      totalContainers
    );
    
    // Remove @page rules from styles (we'll add a single one)
    const cleanedStyles = label.styles.replace(/@page\s*\{[^}]*\}/gi, '');
    allStyles.add(cleanedStyles);
    
    bodyHTML += `<div class="label-page" style="page-break-after: always; page-break-inside: avoid;">${label.body}</div>`;
  });

  const dimensions = getLabelDimensions(size);
  const isA4 = size === 'A4';
  const pageSize = isA4 
    ? 'A4' 
    : `${dimensions.width}in ${dimensions.height}in landscape`;

  const combinedStyles = Array.from(allStyles)
    .join('\n')
    .replace(/body\s*\{[^}]*width:[^;]*;[^}]*\}/gi, '')
    .replace(/body\s*\{[^}]*height:[^;]*;[^}]*\}/gi, '');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Labels</title>
      <style>
        @page {
          size: ${pageSize};
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          font-family: Arial, sans-serif;
        }
        .label-page {
          width: ${dimensions.width}in;
          height: ${dimensions.height}in;
          page-break-after: always;
          page-break-inside: avoid;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .label-page:last-child {
          page-break-after: auto;
        }
        .label-page .label-container {
          width: 100%;
          height: 100%;
        }
        ${combinedStyles}
        @media print {
          @page {
            size: ${pageSize};
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          .label-page {
            width: ${dimensions.width}in;
            height: ${dimensions.height}in;
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            break-inside: avoid;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .label-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .label-page .label-container {
            width: 100%;
            height: 100%;
          }
        }
      </style>
    </head>
    <body>
      ${bodyHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

