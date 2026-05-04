import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export interface ReportPreviewData {
  title: string;
  subtitle?: string;
  summary?: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalTax: number;
  };
  products?: (string | number)[][];
  paymentMethods?: (string | number)[][];
  startDate?: string;
  endDate?: string;
}

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReportPreviewData | null;
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExporting?: boolean;
  pdfBlob?: Blob | null;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  data,
  onExportPDF,
  onExportExcel,
  isExporting = false,
  pdfBlob = null,
}: ReportPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pdfBlob && !pdfUrl) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    }
  }, [isOpen, pdfBlob]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen || !data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{data.title}</DialogTitle>
          {data.subtitle && <p className="text-sm text-gray-600 mt-1">{data.subtitle}</p>}
        </DialogHeader>

        {/* PDF Viewer - Main Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0 rounded shadow-lg"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading PDF preview...</span>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <DialogFooter className="px-6 py-4 border-t bg-white flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Close
          </Button>
          <Button
            variant="outline"
            onClick={onExportExcel}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Excel
          </Button>
          <Button
            onClick={onExportPDF}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
