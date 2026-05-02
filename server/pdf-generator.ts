import PDFDocument from "pdfkit";

interface CompanySettings {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  logo?: string;
}

interface DailySalesData {
  date: string;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    avgOrderValue: number;
  };
  paymentBreakdown: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  itemizedSales: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    paymentMethod: string;
    createdAt: Date;
  }>;
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

function addHeaderFooter(doc: PDFDocument, settings: CompanySettings | undefined, pageNum: number) {
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;
  const now = new Date();
  const timestamp = now.toLocaleString("en-KE");

  // HEADER
  const headerY = 20;
  let currentX = 50;

  // Add logo if available
  if (settings?.logo) {
    try {
      // Convert base64 to buffer for PDFKit
      const logoBuffer = Buffer.from(settings.logo, "base64");
      doc.image(logoBuffer, currentX, headerY, { width: 30, height: 30 });
      currentX += 40;
    } catch (e) {
      console.warn("Could not add logo to daily PDF:", e);
      // Logo failed to load, continue without it
    }
  }

  // Company info
  doc.fontSize(14).font("Helvetica-Bold").text(settings?.companyName || "KenPOS", currentX, headerY);
  doc.fontSize(9).font("Helvetica");
  doc.text("Daily Sales Report", currentX, headerY + 18);

  // Right side company details
  const rightX = pageWidth - 150;
  doc.fontSize(8).text(settings?.address || "", rightX, headerY, { width: 100, align: "right" });
  if (settings?.phone) doc.text(`Phone: ${settings.phone}`, rightX, headerY + 30, { width: 100, align: "right" });
  if (settings?.email) doc.text(`Email: ${settings.email}`, rightX, headerY + 42, { width: 100, align: "right" });
  if (settings?.website) doc.text(`Web: ${settings.website}`, rightX, headerY + 54, { width: 100, align: "right" });

  // Horizontal line under header
  doc.moveTo(50, 85).lineTo(pageWidth - 50, 85).stroke();

  // FOOTER
  const footerY = pageHeight - 30;
  doc.fontSize(8).font("Helvetica");
  doc.text(`Generated: ${timestamp}`, 50, footerY);
  doc.text(`Page ${pageNum}`, pageWidth - 100, footerY, { align: "right" });
  if (settings?.taxId) {
    doc.text(`Tax ID: ${settings.taxId}`, 50, footerY + 12);
  }
  doc.moveTo(50, footerY - 5).lineTo(pageWidth - 50, footerY - 5).stroke();
}

export function generateDailySalesPDF(data: DailySalesData, settings?: CompanySettings): PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  let pageNum = 1;

  const formattedDate = new Date(data.date).toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Add page event listener for headers and footers on new pages
  doc.on("pageAdded", () => {
    pageNum++;
    addHeaderFooter(doc, settings, pageNum);
  });

  // Add header to first page
  addHeaderFooter(doc, settings, pageNum);

  // Content starts after header
  doc.y = 120;

  // Summary Section
  doc.fontSize(12).font("Helvetica-Bold").text("Daily Summary", { underline: true });
  doc.moveDown(0.3);

  const summaryBoxWidth = 110;
  const summaryBoxHeight = 50;
  const boxY = doc.y;

  // Draw summary boxes
  const summaries = [
    { label: "Total Revenue", value: `KES ${Number(data.summary.totalRevenue).toLocaleString()}` },
    { label: "Total Orders", value: `${data.summary.totalOrders}` },
    { label: "Avg Order Value", value: `KES ${Number(data.summary.avgOrderValue).toLocaleString()}` },
    { label: "Total Tax", value: `KES ${Number(data.summary.totalTax).toLocaleString()}` },
  ];

  summaries.forEach((item, idx) => {
    const x = 50 + idx * (summaryBoxWidth + 10);
    doc.rect(x, boxY, summaryBoxWidth, summaryBoxHeight).stroke();
    doc.fontSize(9).font("Helvetica").text(item.label, x + 5, boxY + 5, { width: summaryBoxWidth - 10 });
    doc.fontSize(11).font("Helvetica-Bold").text(item.value, x + 5, boxY + 20, { width: summaryBoxWidth - 10 });
  });

  doc.y = boxY + summaryBoxHeight + 10;
  doc.moveDown(0.5);

  // Payment Breakdown
  if (data.paymentBreakdown.length > 0) {
    doc.fontSize(12).font("Helvetica-Bold").text("Payment Method Breakdown", { underline: true });
    doc.moveDown(0.3);

    data.paymentBreakdown.forEach((payment) => {
      const line = `${payment.method.toUpperCase()}: ${payment.count} transactions - KES ${Number(payment.total).toLocaleString()}`;
      doc.fontSize(10).font("Helvetica").text(line);
    });
    doc.moveDown(0.5);
  }

  // Top Products
  if (data.topProducts.length > 0) {
    doc.fontSize(12).font("Helvetica-Bold").text("Top Selling Products", { underline: true });
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 350;
    const col3 = 450;
    const col4 = 530;
    const rowHeight = 20;

    // Header
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Product", col1, tableTop);
    doc.text("Qty", col2, tableTop);
    doc.text("Revenue", col3, tableTop);

    // Draw header line
    doc.moveTo(col1, tableTop + 15).lineTo(col4, tableTop + 15).stroke();

    // Data rows
    doc.font("Helvetica").fontSize(9);
    let currentY = tableTop + 20;

    data.topProducts.slice(0, 10).forEach((product) => {
      doc.text(product.productName, col1, currentY, { width: 300 });
      doc.text(String(product.totalQuantity), col2, currentY);
      doc.text(`KES ${Number(product.totalRevenue).toLocaleString()}`, col3, currentY);
      currentY += rowHeight;
    });

    doc.moveDown(0.5);
  }

  // Itemized Sales
  if (data.itemizedSales.length > 0) {
    doc.addPage();
    doc.fontSize(12).font("Helvetica-Bold").text(`Itemized Sales (${data.itemizedSales.length} items)`, { underline: true });
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 120;
    const col3 = 200;
    const col4 = 380;
    const col5 = 450;
    const col6 = 530;
    const rowHeight = 18;

    // Header
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("Order", col1, tableTop);
    doc.text("Customer", col2, tableTop);
    doc.text("Product", col3, tableTop);
    doc.text("Qty", col4, tableTop);
    doc.text("Unit Price", col5, tableTop);
    doc.text("Total", col6, tableTop);

    // Draw header line
    doc.moveTo(col1, tableTop + 12).lineTo(col6, tableTop + 12).stroke();

    // Data rows
    doc.font("Helvetica").fontSize(8);
    let currentY = tableTop + 18;
    let itemCount = 0;

    for (const item of data.itemizedSales) {
      if (currentY > 750) {
        doc.addPage();
        currentY = 100;
      }

      doc.text(item.orderNumber, col1, currentY, { width: 60 });
      doc.text(item.customerName || "Walk-in", col2, currentY, { width: 70 });
      doc.text(item.productName, col3, currentY, { width: 170 });
      doc.text(String(item.quantity), col4, currentY);
      doc.text(`${Number(item.unitPrice).toLocaleString()}`, col5, currentY);
      doc.text(`${Number(item.totalPrice).toLocaleString()}`, col6, currentY);

      currentY += rowHeight;
      itemCount++;

      if (itemCount >= 100) {
        doc.fontSize(9).font("Helvetica").text(`... and ${data.itemizedSales.length - 100} more items`, { align: "center" });
        break;
      }
    }
  }

  return doc;
}
