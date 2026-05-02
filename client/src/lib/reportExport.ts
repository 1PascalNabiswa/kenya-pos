import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export interface CompanyInfo {
  companyName?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  summary?: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalTax: number;
  };
  topProducts?: (string | number)[][];
  paymentMethods?: (string | number)[][];
  headers?: string[];
  rows?: (string | number)[][];
  totals?: Record<string, string | number>;
  startDate?: string;
  endDate?: string;
}

/**
 * Generate PDF report with company branding and pagination for large product lists
 */
export async function generateReportPDF(
  reportData: ReportData,
  companyInfo: CompanyInfo | undefined
): Promise<void> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Add company header on first page
    yPosition = addCompanyHeader(doc, companyInfo, pageWidth, yPosition);

    // Add report title
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(reportData.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;

    // Add report subtitle/date range
    if (reportData.subtitle) {
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(reportData.subtitle, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
    }

    // Add summary section
    if (reportData.summary) {
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Summary", 10, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      const summary = reportData.summary;
      doc.text(`Total Revenue: KES ${Number(summary.totalRevenue).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`, 10, yPosition);
      yPosition += 5;
      doc.text(`Total Orders: ${summary.totalOrders}`, 10, yPosition);
      yPosition += 5;
      doc.text(`Average Order Value: KES ${Number(summary.avgOrderValue).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`, 10, yPosition);
      yPosition += 5;
      doc.text(`Total VAT: KES ${Number(summary.totalTax).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`, 10, yPosition);
      yPosition += 10;
    }

    // Add all products table with pagination
    if (reportData.topProducts && reportData.topProducts.length > 0) {
      yPosition = addProductsTable(doc, reportData.topProducts, yPosition, pageHeight);
    }

    // Add payment methods table
    if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 10;
      }

      yPosition = addPaymentMethodsTable(doc, reportData.paymentMethods, yPosition, pageHeight);
    }

    // Add footer
    addFooter(doc, pageWidth, pageHeight);

    // Download PDF
    doc.save(`sales-report-${reportData.startDate}-to-${reportData.endDate}.pdf`);
    toast.success("Report exported as PDF");
  } catch (error) {
    console.error("Error exporting PDF:", error);
    toast.error("Failed to export PDF report");
  }
}

/**
 * Add products table with proper pagination
 */
function addProductsTable(
  doc: jsPDF,
  products: (string | number)[][],
  startY: number,
  pageHeight: number
): number {
  const headers = ["#", "Product", "Qty Sold", "Revenue"];
  const colWidths = [15, 80, 30, 40];
  const rowHeight = 6;
  const headerHeight = 7;
  const pageMargin = 10;
  const footerSpace = 15;
  const maxRowsPerPage = Math.floor((pageHeight - pageMargin - footerSpace - headerHeight) / rowHeight);

  let currentRow = 0;
  let yPosition = startY;
  let isFirstPage = true;

  // Add title
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text(`All Products Sold (${products.length} items)`, pageMargin, yPosition);
  yPosition += 8;

  // Process all products with pagination
  while (currentRow < products.length) {
    // Check if we need a new page (but not on first iteration)
    if (!isFirstPage && yPosition > pageHeight - footerSpace - headerHeight - 10) {
      doc.addPage();
      yPosition = pageMargin + 5;
    }

    // Add table headers
    let tableStartY = yPosition;
    let xPosition = pageMargin;

    doc.setFillColor(220, 220, 220);
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    
    // Draw header cells with borders instead of filled rectangles
    headers.forEach((header, idx) => {
      doc.setDrawColor(100);
      doc.rect(xPosition, tableStartY, colWidths[idx], headerHeight);
      doc.text(header, xPosition + 2, tableStartY + 5);
      xPosition += colWidths[idx];
    });

    // Add rows for this page
    doc.setFont(undefined, "normal");
    let rowY = tableStartY + headerHeight;
    const rowsOnThisPage = Math.min(maxRowsPerPage, products.length - currentRow);

    for (let i = 0; i < rowsOnThisPage; i++) {
      const row = products[currentRow + i];
      xPosition = pageMargin;
      
      // Draw row cells with borders
      row.forEach((cell, idx) => {
        doc.setDrawColor(200);
        doc.rect(xPosition, rowY - 5, colWidths[idx], rowHeight);
        doc.text(String(cell), xPosition + 2, rowY);
        xPosition += colWidths[idx];
      });
      rowY += rowHeight;
    }

    currentRow += rowsOnThisPage;
    yPosition = rowY + 8;
    isFirstPage = false;
  }

  return yPosition;
}

/**
 * Add payment methods table
 */
function addPaymentMethodsTable(
  doc: jsPDF,
  paymentMethods: (string | number)[][],
  startY: number,
  pageHeight: number
): number {
  let yPosition = startY;

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Payment Methods", 10, yPosition);
  yPosition += 6;

  const tableStartY = yPosition;
  const headers = ["Payment Method", "Orders", "Total Revenue"];
  const colWidths = [80, 30, 60];
  let xPosition = 10;

  // Table headers
  doc.setFillColor(220, 220, 220);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  
  headers.forEach((header, idx) => {
    doc.setDrawColor(100);
    doc.rect(xPosition, tableStartY, colWidths[idx], 7);
    doc.text(header, xPosition + 2, tableStartY + 5);
    xPosition += colWidths[idx];
  });

  // Table rows
  doc.setFont(undefined, "normal");
  let rowY = tableStartY + 7;
  for (const row of paymentMethods) {
    xPosition = 10;
    row.forEach((cell, idx) => {
      doc.setDrawColor(200);
      doc.rect(xPosition, rowY - 5, colWidths[idx], 6);
      // Format revenue values properly - avoid NaN
      let cellValue = String(cell);
      if (idx === 2 && typeof cell === "number" && !isNaN(cell)) {
        cellValue = `KES ${cell.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
      }
      doc.text(cellValue, xPosition + 2, rowY);
      xPosition += colWidths[idx];
    });
    rowY += 6;
  }

  return rowY + 8;
}

/**
 * Generate Excel report with company branding and all products
 */
export async function generateReportExcel(
  reportData: ReportData,
  companyInfo: CompanyInfo | undefined
): Promise<void> {
  try {
    const workbook = XLSX.utils.book_new();

    // Create summary sheet
    const summaryData = [
      ["Sales Report", reportData.startDate, reportData.endDate],
      [],
      [companyInfo?.companyName || "Company"],
      [companyInfo?.address || ""],
      [companyInfo?.phone || ""],
      [companyInfo?.email || ""],
      [],
    ];

    if (reportData.summary) {
      summaryData.push(["Summary"]);
      summaryData.push(["Total Revenue", reportData.summary.totalRevenue]);
      summaryData.push(["Total Orders", reportData.summary.totalOrders]);
      summaryData.push(["Average Order Value", reportData.summary.avgOrderValue]);
      summaryData.push(["Total VAT", reportData.summary.totalTax]);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Create all products sheet
    if (reportData.topProducts && reportData.topProducts.length > 0) {
      const productsData = [
        ["#", "Product", "Qty Sold", "Revenue"],
        ...reportData.topProducts,
      ];
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, "All Products");
    }

    // Create payment methods sheet
    if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
      const paymentData = [
        ["Payment Method", "Orders", "Total Revenue"],
        ...reportData.paymentMethods,
      ];
      const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
      XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Methods");
    }

    // Download Excel
    XLSX.writeFile(workbook, `sales-report-${reportData.startDate}-to-${reportData.endDate}.xlsx`);
    toast.success("Report exported as Excel");
  } catch (error) {
    console.error("Error exporting Excel:", error);
    toast.error("Failed to export Excel report");
  }
}

/**
 * Add company header to PDF
 */
function addCompanyHeader(
  doc: jsPDF,
  companyInfo: CompanyInfo | undefined,
  pageWidth: number,
  yPosition: number
): number {
  // Add horizontal line
  doc.setDrawColor(150);
  doc.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 3;

  // Add company name
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(companyInfo?.companyName || "Company", 10, yPosition);
  yPosition += 5;

  // Add company details
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  if (companyInfo?.address) {
    doc.text(companyInfo.address, 10, yPosition);
    yPosition += 4;
  }
  if (companyInfo?.phone) {
    doc.text(`Phone: ${companyInfo.phone}`, 10, yPosition);
    yPosition += 4;
  }
  if (companyInfo?.email) {
    doc.text(`Email: ${companyInfo.email}`, 10, yPosition);
    yPosition += 4;
  }
  if (companyInfo?.website) {
    doc.text(`Website: ${companyInfo.website}`, 10, yPosition);
    yPosition += 4;
  }

  // Add horizontal line
  doc.setDrawColor(150);
  doc.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  return yPosition;
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  const timestamp = new Date().toLocaleString("en-KE");
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(`Generated: ${timestamp}`, 10, pageHeight - 10);
  doc.text(`Page 1`, pageWidth - 20, pageHeight - 10);
}
