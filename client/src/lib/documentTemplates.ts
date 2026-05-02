import { CompanyInfo } from "@/components/DocumentHeader";
import { generatePDFHTML } from "./documentExport";

/**
 * Generate HTML for Sales Report
 */
export function generateSalesReportHTML(
  companyInfo: CompanyInfo,
  reportData: {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    totalOrders: number;
    paymentBreakdown: { method: string; amount: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
  }
): string {
  const content = `
    <h2 style="margin-top: 0;">Sales Report</h2>
    <p><strong>Report Period:</strong> ${reportData.startDate} to ${reportData.endDate}</p>

    <h3>Summary</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th class="text-right">Value</th>
      </tr>
      <tr>
        <td>Total Revenue</td>
        <td class="text-right">KES ${reportData.totalRevenue.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Total Orders</td>
        <td class="text-right">${reportData.totalOrders}</td>
      </tr>
      <tr>
        <td>Average Order Value</td>
        <td class="text-right">KES ${(reportData.totalRevenue / reportData.totalOrders).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      </tr>
    </table>

    <h3>Payment Methods Breakdown</h3>
    <table>
      <tr>
        <th>Payment Method</th>
        <th class="text-right">Amount</th>
        <th class="text-right">Percentage</th>
      </tr>
      ${reportData.paymentBreakdown
        .map(
          (payment) => `
        <tr>
          <td>${payment.method}</td>
          <td class="text-right">KES ${payment.amount.toLocaleString()}</td>
          <td class="text-right">${((payment.amount / reportData.totalRevenue) * 100).toFixed(1)}%</td>
        </tr>
      `
        )
        .join("")}
    </table>

    <h3>Top Products</h3>
    <table>
      <tr>
        <th>Product Name</th>
        <th class="text-right">Quantity Sold</th>
        <th class="text-right">Revenue</th>
      </tr>
      ${reportData.topProducts
        .map(
          (product) => `
        <tr>
          <td>${product.name}</td>
          <td class="text-right">${product.quantity}</td>
          <td class="text-right">KES ${product.revenue.toLocaleString()}</td>
        </tr>
      `
        )
        .join("")}
    </table>
  `;

  return generatePDFHTML(
    companyInfo,
    "SALES REPORT",
    new Date().toISOString().split("T")[0],
    content
  );
}

/**
 * Generate HTML for Invoice
 */
export function generateInvoiceHTML(
  companyInfo: CompanyInfo,
  invoiceData: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    items: { description: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
  }
): string {
  const content = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <p><strong>Invoice Date:</strong> ${invoiceData.invoiceDate}</p>
        ${invoiceData.dueDate ? `<p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <p style="margin: 0; font-weight: bold;">Bill To:</p>
        <p style="margin: 5px 0 0 0;">${invoiceData.customerName}</p>
        ${invoiceData.customerEmail ? `<p style="margin: 2px 0;">${invoiceData.customerEmail}</p>` : ""}
        ${invoiceData.customerPhone ? `<p style="margin: 2px 0;">${invoiceData.customerPhone}</p>` : ""}
      </div>
    </div>

    <table style="margin-bottom: 20px;">
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
      ${invoiceData.items
        .map(
          (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">KES ${item.unitPrice.toLocaleString()}</td>
          <td class="text-right">KES ${item.total.toLocaleString()}</td>
        </tr>
      `
        )
        .join("")}
    </table>

    <div style="margin-left: auto; width: 250px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ddd;">
        <span>Subtotal:</span>
        <span>KES ${invoiceData.subtotal.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ddd;">
        <span>Tax (VAT):</span>
        <span>KES ${invoiceData.tax.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0; font-weight: bold; font-size: 14px;">
        <span>Total:</span>
        <span>KES ${invoiceData.total.toLocaleString()}</span>
      </div>
    </div>

    ${invoiceData.notes ? `<p><strong>Notes:</strong><br>${invoiceData.notes}</p>` : ""}
  `;

  return generatePDFHTML(
    companyInfo,
    "INVOICE",
    invoiceData.invoiceNumber,
    content
  );
}

/**
 * Generate HTML for Purchase Order
 */
export function generatePurchaseOrderHTML(
  companyInfo: CompanyInfo,
  poData: {
    poNumber: string;
    poDate: string;
    supplierName: string;
    supplierEmail?: string;
    supplierPhone?: string;
    items: { description: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    tax: number;
    total: number;
    deliveryDate?: string;
    notes?: string;
  }
): string {
  const content = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <p><strong>PO Date:</strong> ${poData.poDate}</p>
        ${poData.deliveryDate ? `<p><strong>Delivery Date:</strong> ${poData.deliveryDate}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <p><strong>PO #:</strong> ${poData.poNumber}</p>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <p style="margin: 0; font-weight: bold;">Supplier:</p>
        <p style="margin: 5px 0 0 0;">${poData.supplierName}</p>
        ${poData.supplierEmail ? `<p style="margin: 2px 0;">${poData.supplierEmail}</p>` : ""}
        ${poData.supplierPhone ? `<p style="margin: 2px 0;">${poData.supplierPhone}</p>` : ""}
      </div>
    </div>

    <table style="margin-bottom: 20px;">
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
      ${poData.items
        .map(
          (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">KES ${item.unitPrice.toLocaleString()}</td>
          <td class="text-right">KES ${item.total.toLocaleString()}</td>
        </tr>
      `
        )
        .join("")}
    </table>

    <div style="margin-left: auto; width: 250px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ddd;">
        <span>Subtotal:</span>
        <span>KES ${poData.subtotal.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ddd;">
        <span>Tax (VAT):</span>
        <span>KES ${poData.tax.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0; font-weight: bold; font-size: 14px;">
        <span>Total:</span>
        <span>KES ${poData.total.toLocaleString()}</span>
      </div>
    </div>

    ${poData.notes ? `<p><strong>Terms & Conditions:</strong><br>${poData.notes}</p>` : ""}
  `;

  return generatePDFHTML(
    companyInfo,
    "PURCHASE ORDER",
    poData.poNumber,
    content
  );
}

/**
 * Generate HTML for Customer Statement
 */
export function generateCustomerStatementHTML(
  companyInfo: CompanyInfo,
  statementData: {
    statementDate: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    transactions: {
      date: string;
      description: string;
      amount: number;
      type: "debit" | "credit";
    }[];
    openingBalance: number;
    closingBalance: number;
  }
): string {
  const content = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <p><strong>Statement Date:</strong> ${statementData.statementDate}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>Customer Statement</strong></p>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <p style="margin: 0; font-weight: bold;">Customer:</p>
      <p style="margin: 5px 0 0 0;">${statementData.customerName}</p>
      ${statementData.customerEmail ? `<p style="margin: 2px 0;">${statementData.customerEmail}</p>` : ""}
      ${statementData.customerPhone ? `<p style="margin: 2px 0;">${statementData.customerPhone}</p>` : ""}
    </div>

    <div style="margin-bottom: 20px;">
      <p><strong>Opening Balance:</strong> KES ${statementData.openingBalance.toLocaleString()}</p>
    </div>

    <table style="margin-bottom: 20px;">
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th class="text-right">Debit</th>
        <th class="text-right">Credit</th>
      </tr>
      ${statementData.transactions
        .map(
          (txn) => `
        <tr>
          <td>${txn.date}</td>
          <td>${txn.description}</td>
          <td class="text-right">${txn.type === "debit" ? "KES " + txn.amount.toLocaleString() : "-"}</td>
          <td class="text-right">${txn.type === "credit" ? "KES " + txn.amount.toLocaleString() : "-"}</td>
        </tr>
      `
        )
        .join("")}
    </table>

    <div style="margin-left: auto; width: 250px;">
      <div style="display: flex; justify-content: space-between; padding: 5px 0; font-weight: bold; font-size: 14px;">
        <span>Closing Balance:</span>
        <span>KES ${statementData.closingBalance.toLocaleString()}</span>
      </div>
    </div>
  `;

  return generatePDFHTML(
    companyInfo,
    "CUSTOMER STATEMENT",
    statementData.statementDate,
    content
  );
}
