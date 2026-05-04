import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

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
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  data,
  onExportPDF,
  onExportExcel,
  isExporting = false,
}: ReportPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (isOpen && data && !pdfUrl) {
      generatePdfPreview();
    }
  }, [isOpen, data]);

  const generatePdfPreview = async () => {
    try {
      setGeneratingPdf(true);
      // Generate PDF blob for preview
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      // Add content to PDF
      let yPosition = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text(data?.title || "Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
      
      // Summary
      if (data?.summary) {
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(`Total Revenue: KES ${data.summary.totalRevenue.toLocaleString()}`, 10, yPosition);
        yPosition += 5;
        doc.text(`Total Orders: ${data.summary.totalOrders}`, 10, yPosition);
        yPosition += 5;
        doc.text(`Avg Order Value: KES ${data.summary.avgOrderValue.toLocaleString()}`, 10, yPosition);
        yPosition += 10;
      }
      
      // Products table preview (first 10 items)
      if (data?.products && data.products.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text(`Products (${data.products.length} items)`, 10, yPosition);
        yPosition += 8;
        
        doc.setFontSize(9);
        const headers = ["#", "Product", "Qty", "Revenue"];
        const colWidths = [15, 80, 25, 40];
        let xPos = 10;
        
        // Headers
        headers.forEach((header, idx) => {
          doc.rect(xPos, yPosition - 5, colWidths[idx], 6);
          doc.text(header, xPos + 2, yPosition);
          xPos += colWidths[idx];
        });
        
        yPosition += 8;
        
        // Show first 10 products in preview
        const previewProducts = data.products.slice(0, 10);
        previewProducts.forEach((row) => {
          xPos = 10;
          row.forEach((cell, idx) => {
            doc.rect(xPos, yPosition - 5, colWidths[idx], 6);
            doc.text(String(cell), xPos + 2, yPosition);
            xPos += colWidths[idx];
          });
          yPosition += 6;
        });
        
        if (data.products.length > 10) {
          yPosition += 5;
          doc.setFontSize(9);
          doc.text(`... and ${data.products.length - 10} more products`, 10, yPosition);
        }
      }
      
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!isOpen || !data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Report Preview</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{data.title}</h3>
                {data.subtitle && <p className="text-sm text-gray-600">{data.subtitle}</p>}
                
                {data.summary && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="border rounded p-3">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">KES {data.summary.totalRevenue.toLocaleString("en-KE", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold">{data.summary.totalOrders}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-sm text-gray-600">Average Order Value</p>
                      <p className="text-2xl font-bold">KES {data.summary.avgOrderValue.toLocaleString("en-KE", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-sm text-gray-600">Total VAT</p>
                      <p className="text-2xl font-bold">KES {data.summary.totalTax.toLocaleString("en-KE", { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Showing {Math.min(10, data.products?.length || 0)} of {data.products?.length || 0} products
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Product</th>
                      <th className="text-right py-2 px-2">Qty Sold</th>
                      <th className="text-right py-2 px-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products?.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{row[0]}</td>
                        <td className="py-2 px-2">{row[1]}</td>
                        <td className="text-right py-2 px-2">{row[2]}</td>
                        <td className="text-right py-2 px-2">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(data.products?.length || 0) > 10 && (
                  <p className="text-xs text-gray-500 mt-4">
                    ... and {(data.products?.length || 0) - 10} more products in the full report
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Payment Method</th>
                      <th className="text-right py-2 px-2">Orders</th>
                      <th className="text-right py-2 px-2">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.paymentMethods?.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{row[0]}</td>
                        <td className="text-right py-2 px-2">{row[1]}</td>
                        <td className="text-right py-2 px-2">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onExportExcel}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Export Excel
          </Button>
          <Button
            onClick={onExportPDF}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
