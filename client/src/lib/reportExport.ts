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
 * Generate PDF report with company branding
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

    // Add company header
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

    // Add top products table
    if (reportData.topProducts && reportData.topProducts.length > 0) {
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Top Selling Products", 10, yPosition);
      yPosition += 6;

      const tableStartY = yPosition;
      const headers = ["#", "Product", "Qty Sold", "Revenue"];
      const colWidths = [15, 80, 30, 40];
      let xPosition = 10;

      // Table headers
      doc.setFillColor(200, 200, 200);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      headers.forEach((header, idx) => {
        doc.rect(xPosition, tableStartY, colWidths[idx], 7, "F");
        doc.text(header, xPosition + 2, tableStartY + 5);
        xPosition += colWidths[idx];
      });

      // Table rows
      doc.setFont(undefined, "normal");
      let rowY = tableStartY + 7;
      for (const row of reportData.topProducts) {
        xPosition = 10;
        row.forEach((cell, idx) => {
          doc.text(String(cell), xPosition + 2, rowY);
          xPosition += colWidths[idx];
        });
        rowY += 6;

        // Check if we need a new page
        if (rowY > pageHeight - 30) {
          doc.addPage();
          rowY = 10;
          yPosition = rowY + 20;
        }
      }

      yPosition = rowY + 8;
    }

    // Add payment methods table
    if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 10;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Payment Methods", 10, yPosition);
      yPosition += 6;

      const tableStartY = yPosition;
      const headers = ["Payment Method", "Orders", "Total Revenue"];
      const colWidths = [80, 30, 60];
      let xPosition = 10;

      // Table headers
      doc.setFillColor(200, 200, 200);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      headers.forEach((header, idx) => {
        doc.rect(xPosition, tableStartY, colWidths[idx], 7, "F");
        doc.text(header, xPosition + 2, tableStartY + 5);
        xPosition += colWidths[idx];
      });

      // Table rows
      doc.setFont(undefined, "normal");
      let rowY = tableStartY + 7;
      for (const row of reportData.paymentMethods) {
        xPosition = 10;
        row.forEach((cell, idx) => {
          doc.text(String(cell), xPosition + 2, rowY);
          xPosition += colWidths[idx];
        });
        rowY += 6;
      }

      yPosition = rowY + 8;
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
 * Generate Excel report with company branding
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

    // Create top products sheet
    if (reportData.topProducts && reportData.topProducts.length > 0) {
      const productsData = [
        ["#", "Product", "Qty Sold", "Revenue"],
        ...reportData.topProducts,
      ];
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Top Products");
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
  const pageHeight = doc.internal.pageSize.getHeight();

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
