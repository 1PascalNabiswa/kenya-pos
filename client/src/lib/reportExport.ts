import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export interface CompanyInfo {
  name: string;
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
  headers: string[];
  rows: (string | number)[][];
  totals?: Record<string, string | number>;
  startDate?: string;
  endDate?: string;
}

/**
 * Generate PDF report with company branding
 */
export async function generateReportPDF(
  reportData: ReportData,
  companyInfo: CompanyInfo
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
      yPosition += 6;
    }

    if (reportData.startDate && reportData.endDate) {
      doc.setFontSize(9);
      doc.text(
        `Period: ${reportData.startDate} to ${reportData.endDate}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 8;
    }

    // Add table
    const tableStartY = yPosition;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");

    // Table headers
    const colWidth = (pageWidth - 20) / reportData.headers.length;
    let xPosition = 10;

    doc.setFillColor(200, 200, 200);
    reportData.headers.forEach((header) => {
      doc.rect(xPosition, tableStartY, colWidth, 7, "F");
      doc.text(header, xPosition + 2, tableStartY + 5);
      xPosition += colWidth;
    });

    // Table rows
    yPosition = tableStartY + 10;
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    reportData.rows.forEach((row) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 10;
      }

      xPosition = 10;
      row.forEach((cell, index) => {
        const cellText = String(cell);
        doc.text(cellText, xPosition + 2, yPosition);
        xPosition += colWidth;
      });

      yPosition += 7;
    });

    // Add totals if provided
    if (reportData.totals) {
      yPosition += 5;
      doc.setFont(undefined, "bold");
      doc.setFillColor(230, 230, 230);

      const totalKeys = Object.keys(reportData.totals);
      xPosition = 10;

      totalKeys.forEach((key, index) => {
        if (index === 0) {
          doc.rect(xPosition, yPosition, colWidth, 7, "F");
          doc.text(key, xPosition + 2, yPosition + 5);
        } else {
          doc.rect(xPosition, yPosition, colWidth, 7, "F");
          doc.text(String(reportData.totals![key]), xPosition + 2, yPosition + 5);
        }
        xPosition += colWidth;
      });
    }

    // Add footer
    addPDFFooter(doc, companyInfo, pageHeight);

    // Download PDF
    const fileName = `${reportData.title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    toast.success("Report exported as PDF");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF report");
  }
}

/**
 * Generate Excel report with company branding
 */
export async function generateReportExcel(
  reportData: ReportData,
  companyInfo: CompanyInfo
): Promise<void> {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Add company info at top
    let rowIndex = 0;
    XLSX.utils.sheet_add_aoa(worksheet, [[companyInfo.name]], { origin: { r: rowIndex, c: 0 } });
    rowIndex++;

    if (companyInfo.address) {
      XLSX.utils.sheet_add_aoa(worksheet, [[companyInfo.address]], { origin: { r: rowIndex, c: 0 } });
      rowIndex++;
    }

    if (companyInfo.phone || companyInfo.email) {
      const contactInfo = [
        companyInfo.phone,
        companyInfo.email,
      ]
        .filter(Boolean)
        .join(" | ");
      XLSX.utils.sheet_add_aoa(worksheet, [[contactInfo]], { origin: { r: rowIndex, c: 0 } });
      rowIndex++;
    }

    if (companyInfo.website) {
      XLSX.utils.sheet_add_aoa(worksheet, [[companyInfo.website]], { origin: { r: rowIndex, c: 0 } });
      rowIndex++;
    }

    // Add blank row
    rowIndex += 2;

    // Add report title
    XLSX.utils.sheet_add_aoa(worksheet, [[reportData.title]], { origin: { r: rowIndex, c: 0 } });
    rowIndex++;

    // Add date range
    if (reportData.startDate && reportData.endDate) {
      XLSX.utils.sheet_add_aoa(worksheet, [[`Period: ${reportData.startDate} to ${reportData.endDate}`]], {
        origin: { r: rowIndex, c: 0 },
      });
      rowIndex++;
    }

    // Add blank row
    rowIndex += 1;

    // Add headers
    XLSX.utils.sheet_add_aoa(worksheet, [reportData.headers], { origin: { r: rowIndex, c: 0 } });
    rowIndex++;

    // Add data rows
    XLSX.utils.sheet_add_aoa(worksheet, reportData.rows, { origin: { r: rowIndex, c: 0 } });
    rowIndex += reportData.rows.length;

    // Add totals
    if (reportData.totals) {
      rowIndex += 1;
      const totalRow = Object.entries(reportData.totals).map(([key, value]) => value);
      XLSX.utils.sheet_add_aoa(worksheet, [totalRow], { origin: { r: rowIndex, c: 0 } });
    }

    // Set column widths
    const colWidths = reportData.headers.map(() => 15);
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const fileName = `${reportData.title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Report exported as Excel");
  } catch (error) {
    console.error("Error generating Excel:", error);
    toast.error("Failed to generate Excel report");
  }
}

/**
 * Add company header to PDF
 */
function addCompanyHeader(
  doc: jsPDF,
  companyInfo: CompanyInfo,
  pageWidth: number,
  startY: number
): number {
  let yPosition = startY;
  const leftMargin = 10;
  const rightMargin = pageWidth - 10;

  // Add logo if available
  if (companyInfo.logo) {
    try {
      let logoData = companyInfo.logo;
      // If logo is raw base64 without data URI prefix, add it
      if (!logoData.startsWith("data:")) {
        logoData = `data:image/png;base64,${logoData}`;
      }
      doc.addImage(logoData, "PNG", leftMargin, yPosition, 20, 15);
    } catch (error) {
      console.warn("Could not add logo to PDF:", error);
    }
  }

  // Add company info on the right
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(companyInfo.name || "Company Name", rightMargin - 60, yPosition + 3, { align: "left" });

  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  if (companyInfo.address) {
    doc.text(companyInfo.address, rightMargin - 60, yPosition, { align: "left" });
    yPosition += 4;
  }

  if (companyInfo.phone) {
    doc.text(`Phone: ${companyInfo.phone}`, rightMargin - 60, yPosition, { align: "left" });
    yPosition += 4;
  }

  if (companyInfo.email) {
    doc.text(`Email: ${companyInfo.email}`, rightMargin - 60, yPosition, { align: "left" });
    yPosition += 4;
  }

  if (companyInfo.website) {
    doc.text(`Web: ${companyInfo.website}`, rightMargin - 60, yPosition, { align: "left" });
    yPosition += 4;
  }

  if (companyInfo.taxId) {
    doc.text(`Tax ID: ${companyInfo.taxId}`, rightMargin - 60, yPosition, { align: "left" });
    yPosition += 4;
  }

  // Add horizontal line
  yPosition += 3;
  doc.setDrawColor(200);
  doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);

  return yPosition + 5;
}

/**
 * Add footer to PDF
 */
function addPDFFooter(doc: jsPDF, companyInfo: CompanyInfo, pageHeight: number): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(150);

    // Add page number and timestamp
    const timestamp = new Date().toLocaleString();
    doc.text(`Generated on ${timestamp}`, 10, pageHeight - 5);
    doc.text(`Page ${i} of ${pageCount}`, 200, pageHeight - 5, { align: "right" });
  }
}
