import { ChallanTemplate } from './challan-template-service';
import { SchoolSettings } from './school-settings';
import { generateChallanQRData } from './qr-generator';

export interface ChallanData {
    student: {
        id: string;
        name: string;
        father_name: string;
        roll_number: string;
        class_name: string;
    };
    challan: {
        id: string;
        challan_number: string;
        month: string;
        due_date: string;
        total_amount: number;
        student_id: string;
    };
    fees: Array<{
        description: string;
        amount: number;
    }>;
    school: SchoolSettings;
}

/**
 * Render challan template with actual data
 */
export function renderChallanTemplate(template: ChallanTemplate, data: ChallanData): string {
    const { student, challan, fees, school } = data;

    // Calculate total
    const total = fees.reduce((sum, fee) => sum + fee.amount, 0);

    // Generate dynamic QR code
    const qrData = template.show_qr ? generateChallanQRData(challan) : '';

    // Build column labels
    const columnLabels =
        template.columns === 3 ? ['STUDENT COPY', 'SCHOOL COPY', 'BANK COPY'] : ['STUDENT COPY', 'SCHOOL COPY'];

    // Generate HTML for each column
    const columnsHTML = columnLabels
        .map((label) => generateColumnHTML(label, template, data, total, qrData))
        .join('');

    // Return complete HTML
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Challan - ${student.name}</title>
        <style>
          @page {
            size: A4 ${template.orientation};
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', Arial, sans-serif;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .container {
            display: grid;
            grid-template-columns: repeat(${template.columns}, 1fr);
            gap: 0;
            padding: 10px;
            width: 100%;
            min-height: ${template.orientation === 'landscape' ? '210mm' : '297mm'};
          }
          .column {
            border: 2px dashed ${template.primary_color};
            padding: 12px;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .header {
            background-color: ${template.primary_color};
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 10px;
          }
          .school-info {
            text-align: center;
            padding: 8px 0;
            border-bottom: 1px solid #ccc;
            margin-bottom: 8px;
          }
          .school-logo {
            height: 48px;
            width: 48px;
            object-fit: contain;
            margin: 0 auto 8px;
          }
          .school-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .school-details {
            font-size: 10px;
            color: #666;
          }
          .section {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 8px;
            font-size: 11px;
          }
          .section-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .label {
            font-weight: 600;
          }
          .value {
            text-align: right;
          }
          .fees-table {
            flex: 1;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 8px;
          }
          .fees-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 6px;
          }
          .fee-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            padding: 2px 0;
          }
          .total-box {
            background-color: ${template.secondary_color}33;
            border: 2px solid ${template.secondary_color};
            padding: 8px;
            margin-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-weight: bold;
            font-size: 12px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 16px;
            color: ${template.secondary_color};
          }
          .qr-code {
            text-align: center;
            margin-top: 8px;
          }
          .qr-code canvas {
            margin: 0 auto;
          }
          .footer {
            margin-top: auto;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .signature-image {
            height: 32px;
            width: 80px;
            object-fit: contain;
          }
          .footer-note {
            text-align: center;
            font-size: 9px;
            color: #666;
          }
          .due-date {
            color: #dc2626;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${columnsHTML}
        </div>
      </body>
    </html>
  `;
}

function generateColumnHTML(
    label: string,
    template: ChallanTemplate,
    data: ChallanData,
    total: number,
    qrData: string
): string {
    const { student, challan, fees, school } = data;

    const logoHTML = template.school_logo
        ? `<img src="${template.school_logo}" alt="Logo" class="school-logo" />`
        : '';

    const signatureHTML = template.signature_image
        ? `<img src="${template.signature_image}" alt="Signature" class="signature-image" />`
        : `<div>_______________<br><span style="font-size: 9px;">Signature/Stamp</span></div>`;

    const qrHTML = template.show_qr && qrData
        ? `<div class="qr-code"><canvas id="qr-${label.replace(/\s/g, '')}"></canvas></div>
       <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
       <script>
         QRCode.toCanvas(document.getElementById('qr-${label.replace(/\s/g, '')}'), '${qrData}', { width: 60 });
       </script>`
        : '';

    const feesHTML = fees.map((fee) => `
    <div class="fee-row">
      <span>${fee.description}</span>
      <span>Rs ${fee.amount.toLocaleString()}</span>
    </div>
  `).join('');

    return `
    <div class="column">
      <div class="header">${label}</div>
      
      <div class="school-info">
        ${logoHTML}
        <div class="school-name">${school.school_name}</div>
        <div class="school-details">${school.school_address}</div>
        <div class="school-details">Ph: ${school.contact_number}</div>
      </div>

      <div class="section">
        <div class="section-row">
          <span class="label">Challan No:</span>
          <span class="value">${challan.challan_number}</span>
        </div>
        <div class="section-row">
          <span class="label">Month:</span>
          <span class="value">${challan.month}</span>
        </div>
        <div class="section-row">
          <span class="label">Due Date:</span>
          <span class="value due-date">${challan.due_date}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-row">
          <span class="label">Name:</span>
          <span class="value">${student.name}</span>
        </div>
        <div class="section-row">
          <span class="label">Father:</span>
          <span class="value">${student.father_name}</span>
        </div>
        <div class="section-row">
          <span class="label">Roll No:</span>
          <span class="value">${student.roll_number}</span>
        </div>
        <div class="section-row">
          <span class="label">Class:</span>
          <span class="value">${student.class_name}</span>
        </div>
      </div>

      <div class="fees-table">
        <div class="fees-title">Fee Details:</div>
        ${feesHTML}
      </div>

      <div class="total-box">
        <span class="total-label">TOTAL:</span>
        <span class="total-amount">Rs ${total.toLocaleString()}</span>
      </div>

      ${qrHTML}

      <div class="footer">
        <div class="signature-section">
          <div>Date: __________</div>
          <div style="text-align: center;">
            ${signatureHTML}
          </div>
        </div>
        <div class="footer-note">
          Pay before due date to avoid late fee
        </div>
      </div>
    </div>
  `;
}
