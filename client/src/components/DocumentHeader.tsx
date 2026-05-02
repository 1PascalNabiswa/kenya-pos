import React from "react";

export interface CompanyInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

export interface DocumentHeaderProps {
  companyInfo: CompanyInfo;
  documentType: string;
  documentNumber?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  companyInfo,
  documentType,
  documentNumber,
}) => {
  return (
    <div style={{ marginBottom: "20px", borderBottom: "2px solid #333", paddingBottom: "15px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Left side: Company info */}
        <div>
          {companyInfo.logo && (
            <img
              src={companyInfo.logo}
              alt="Company Logo"
              style={{ maxWidth: "120px", maxHeight: "60px", marginBottom: "10px" }}
            />
          )}
          <h1 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold" }}>
            {companyInfo.name}
          </h1>
          {companyInfo.address && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>{companyInfo.address}</p>
          )}
          {companyInfo.phone && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>Phone: {companyInfo.phone}</p>
          )}
          {companyInfo.email && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>Email: {companyInfo.email}</p>
          )}
          {companyInfo.website && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>Website: {companyInfo.website}</p>
          )}
          {companyInfo.taxId && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>Tax ID: {companyInfo.taxId}</p>
          )}
        </div>

        {/* Right side: Document type and number */}
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: "0", fontSize: "20px", fontWeight: "bold", color: "#333" }}>
            {documentType}
          </h2>
          {documentNumber && (
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
              #{documentNumber}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export interface DocumentFooterProps {
  pageNumber?: number;
  totalPages?: number;
  timestamp?: Date;
}

export const DocumentFooter: React.FC<DocumentFooterProps> = ({
  pageNumber,
  totalPages,
  timestamp,
}) => {
  const formattedTime = timestamp
    ? timestamp.toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : new Date().toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "10px",
        borderTop: "1px solid #ccc",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "10px",
        color: "#666",
      }}
    >
      <div>
        {pageNumber && totalPages ? (
          <span>Page {pageNumber} of {totalPages}</span>
        ) : pageNumber ? (
          <span>Page {pageNumber}</span>
        ) : null}
      </div>
      <div>Generated: {formattedTime}</div>
    </div>
  );
};

export interface DocumentTemplateProps {
  companyInfo: CompanyInfo;
  documentType: string;
  documentNumber?: string;
  children: React.ReactNode;
  pageNumber?: number;
  totalPages?: number;
  timestamp?: Date;
}

export const DocumentTemplate: React.FC<DocumentTemplateProps> = ({
  companyInfo,
  documentType,
  documentNumber,
  children,
  pageNumber,
  totalPages,
  timestamp,
}) => {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", fontSize: "12px" }}>
      <DocumentHeader
        companyInfo={companyInfo}
        documentType={documentType}
        documentNumber={documentNumber}
      />
      <div style={{ minHeight: "400px" }}>{children}</div>
      <DocumentFooter pageNumber={pageNumber} totalPages={totalPages} timestamp={timestamp} />
    </div>
  );
};
