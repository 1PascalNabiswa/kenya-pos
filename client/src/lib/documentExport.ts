import { CompanyInfo } from "@/components/DocumentHeader";

/**
 * Export data to Excel format
 */
export async function exportToExcel(
  data: any[],
  fileName: string,
  columns: { key: string; label: string }[]
) {
  try {
    // Create CSV content
    const headers = columns.map((col) => col.label).join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = row[col.key];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? "").replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return false;
  }
}

/**
 * Generate HTML for PDF export with header and footer
 */
export function generatePDFHTML(
  companyInfo: CompanyInfo,
  documentType: string,
  documentNumber: string | undefined,
  content: string,
  pageNumber?: number,
  totalPages?: number
): string {
  const timestamp = new Date().toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .company-info {
          flex: 1;
        }
        .company-logo {
          max-width: 120px;
          max-height: 60px;
          margin-bottom: 10px;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 5px 0;
        }
        .company-details {
          font-size: 11px;
          margin: 2px 0;
          line-height: 1.4;
        }
        .document-info {
          text-align: right;
        }
        .document-type {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
          color: #333;
        }
        .document-number {
          font-size: 12px;
          color: #666;
          margin: 5px 0 0 0;
        }
        .content {
          min-height: 400px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-weight: bold;
        }
        td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Company Logo" class="company-logo">` : ""}
          <div class="company-name">${companyInfo.name}</div>
          ${companyInfo.address ? `<div class="company-details">${companyInfo.address}</div>` : ""}
          ${companyInfo.phone ? `<div class="company-details">Phone: ${companyInfo.phone}</div>` : ""}
          ${companyInfo.email ? `<div class="company-details">Email: ${companyInfo.email}</div>` : ""}
          ${companyInfo.website ? `<div class="company-details">Website: ${companyInfo.website}</div>` : ""}
          ${companyInfo.taxId ? `<div class="company-details">Tax ID: ${companyInfo.taxId}</div>` : ""}
        </div>
        <div class="document-info">
          <div class="document-type">${documentType}</div>
          ${documentNumber ? `<div class="document-number">#${documentNumber}</div>` : ""}
        </div>
      </div>

      <div class="content">
        ${content}
      </div>

      <div class="footer">
        <div>
          ${pageNumber && totalPages ? `Page ${pageNumber} of ${totalPages}` : pageNumber ? `Page ${pageNumber}` : ""}
        </div>
        <div>Generated: ${timestamp}</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export HTML to PDF using browser print functionality
 */
export async function exportToPDF(
  htmlContent: string,
  fileName: string
): Promise<boolean> {
  try {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      console.error("Failed to open print window");
      return false;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load
    printWindow.onload = () => {
      printWindow.print();
      // Note: In a real app, you might want to use a library like jsPDF or html2pdf
      // for more control over PDF generation
    };

    return true;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return false;
  }
}

/**
 * Get company info from localStorage or return defaults
 */
export function getCompanyInfo(): CompanyInfo {
  try {
    const stored = localStorage.getItem("companyInfo");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading company info:", error);
  }

  // Return defaults
  return {
    name: "KenPOS",
    address: "Nairobi, Kenya",
    phone: "+254 (0) 123 456 789",
    email: "info@kenpos.com",
    website: "www.kenpos.com",
  };
}

/**
 * Save company info to localStorage
 */
export function saveCompanyInfo(info: CompanyInfo): void {
  try {
    localStorage.setItem("companyInfo", JSON.stringify(info));
  } catch (error) {
    console.error("Error saving company info:", error);
  }
}
