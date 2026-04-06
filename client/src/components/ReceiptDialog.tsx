import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Printer, Download, X, Eye } from "lucide-react";
import { toast } from "sonner";

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
}

export default function ReceiptDialog({ open, onClose, orderId, orderNumber }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { data: order, isLoading } = trpc.orders.get.useQuery(
    { id: orderId },
    { enabled: open && !!orderId }
  );

  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Failed to open print window. Please check popup settings.");
      return;
    }

    const content = receiptRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Receipt - ${orderNumber}</title>
        <style>
          @page {
            size: 76mm auto;
            margin: 0;
            padding: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', 'Courier', monospace;
            font-size: 11px;
            width: 76mm;
            line-height: 1.3;
            background: white;
            color: black;
          }
          
          .receipt-container {
            width: 100%;
            padding: 3mm;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 2mm;
            font-weight: bold;
          }
          
          .receipt-header .store-name {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          
          .receipt-header .store-info {
            font-size: 9px;
            line-height: 1.2;
          }
          
          .receipt-divider {
            border-top: 1px dashed #000;
            margin: 2mm 0;
          }
          
          .receipt-section-title {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin: 2mm 0 1mm 0;
          }
          
          .receipt-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 1mm;
            word-break: break-word;
          }
          
          .receipt-row.item-name {
            font-weight: normal;
            margin-bottom: 0.5mm;
          }
          
          .receipt-row.item-details {
            font-size: 9px;
            margin-bottom: 1mm;
          }
          
          .receipt-total {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 12px;
            margin: 1mm 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 1mm 0;
          }
          
          .receipt-footer {
            text-align: center;
            font-size: 9px;
            margin-top: 2mm;
            line-height: 1.4;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-xs {
            font-size: 9px;
          }
          
          .text-sm {
            font-size: 10px;
          }
          
          .font-bold {
            font-weight: bold;
          }
          
          .mb-1 {
            margin-bottom: 1mm;
          }
          
          .mt-1 {
            margin-top: 1mm;
          }
          
          .uppercase {
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          ${content}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      toast.success("Printing receipt to 76mm thermal printer...");
    }, 500);
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleDownload = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: 76mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 10pt; width: 76mm; padding: 2mm; line-height: 1.3; }
          .receipt-container { width: 100%; }
          .receipt-header { text-align: center; margin-bottom: 2mm; }
          .receipt-divider { border-top: 1px dashed #000; margin: 2mm 0; }
          .receipt-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 1mm; }
          .receipt-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin: 1mm 0; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 1mm 0; }
          .receipt-footer { text-align: center; font-size: 9px; margin-top: 2mm; }
          .text-center { text-align: center; }
          .text-xs { font-size: 9px; }
          .font-bold { font-weight: bold; }
          .mb-1 { margin-bottom: 1mm; }
          .mt-1 { margin-top: 1mm; }
          .uppercase { text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          ${content}
        </div>
      </body>
      </html>
    `], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleString("en-KE", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const padLine = (left: string, right: string, width = 32) => {
    const spaces = Math.max(1, width - left.length - right.length);
    return left + " ".repeat(spaces) + right;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt - {orderNumber}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePreview}>
                <Eye size={14} className="mr-1" /> Preview
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download size={14} className="mr-1" /> Save
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Printer size={14} className="mr-1" /> Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : order ? (
          <>
            {showPreview && (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <div className="text-sm font-bold mb-2 text-center">76mm Thermal Receipt Preview</div>
                <div className="mx-auto bg-white p-2" style={{ width: "76mm", maxWidth: "100%", border: "1px solid #ccc" }}>
                  <div ref={receiptRef} style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", lineHeight: "1.3" }}>
                    {/* Header */}
                    <div className="text-center font-bold mb-1">
                      <div style={{ fontSize: "13px", fontWeight: "bold" }}>KenPOS</div>
                      <div style={{ fontSize: "9px" }}>Kenyan Point of Sale</div>
                      <div style={{ fontSize: "9px" }}>Tel: +254 700 000 000</div>
                      <div style={{ fontSize: "9px" }}>Nairobi, Kenya</div>
                    </div>

                    <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

                    <div className="text-center font-bold mb-1" style={{ fontSize: "11px" }}>RECEIPT</div>
                    <div style={{ fontSize: "10px" }}>Order: {order.orderNumber}</div>
                    <div style={{ fontSize: "10px" }}>Date: {formatDate(order.createdAt)}</div>
                    {order.customerId && (
                      <div style={{ fontSize: "10px" }}>Customer ID: {order.customerId}</div>
                    )}

                    <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

                    {/* Items */}
                    <div className="font-bold mb-1" style={{ fontSize: "11px" }}>ITEMS</div>
                    {order.items?.map((item, i) => (
                      <div key={i} className="mb-1">
                        <div style={{ fontSize: "10px" }}>{item.productName}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                          <span>{item.quantity} x KES {Number(item.unitPrice).toLocaleString()}</span>
                          <span>KES {Number(item.totalPrice).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}

                    <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

                    {/* Totals */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "1mm" }}>
                      <span>Subtotal</span>
                      <span>KES {Number(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "1mm" }}>
                      <span>VAT (16%)</span>
                      <span>KES {Number(order.taxAmount).toLocaleString()}</span>
                    </div>
                    {Number(order.discountAmount) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "1mm" }}>
                        <span>Discount</span>
                        <span>-KES {Number(order.discountAmount).toLocaleString()}</span>
                      </div>
                    )}

                    <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "12px", padding: "1mm 0", margin: "1mm 0" }}>
                      <span>TOTAL</span>
                      <span>KES {Number(order.totalAmount).toLocaleString()}</span>
                    </div>

                    {/* Payment Details */}
                    <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "1mm" }}>
                      <span>Payment</span>
                      <span className="uppercase font-bold">{order.paymentMethod}</span>
                    </div>
                    {order.paymentMethod === "cash" && order.cashReceived && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "1mm" }}>
                          <span>Cash Received</span>
                          <span>KES {Number(order.cashReceived).toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "bold", marginBottom: "1mm" }}>
                          <span>Change</span>
                          <span>KES {Number(order.cashChange ?? 0).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    {order.paymentStatus === "paid" && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "1mm" }}>
                        <span>Payment</span>
                        <span>Completed</span>
                      </div>
                    )}

                    <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

                    {/* Status */}
                    <div className="text-center font-bold" style={{ fontSize: "11px" }}>
                      {order.paymentStatus === "paid" ? "*** PAID ***" : order.paymentStatus.toUpperCase()}
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />
                    <div className="text-center" style={{ fontSize: "9px", marginTop: "2mm", lineHeight: "1.4" }}>
                      <div>Thank you for your business!</div>
                      <div>Asante kwa biashara yako!</div>
                      <div className="mt-1">Powered by KenPOS</div>
                      <div>{new Date().getFullYear()} © All Rights Reserved</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-auto max-h-[70vh]">
              {/* 76mm Thermal Receipt - Hidden by default, shown only in print */}
              <div id="thermal-receipt" ref={receiptRef} className="mx-auto" style={{ display: "none" }}>
                {/* Header */}
                <div className="receipt-header">
                  <div className="font-bold text-base">KenPOS</div>
                  <div className="text-xs">Kenyan Point of Sale</div>
                  <div className="text-xs">Tel: +254 700 000 000</div>
                  <div className="text-xs">Nairobi, Kenya</div>
                </div>

                <div className="receipt-divider" />

                <div className="text-center text-xs font-bold mb-1">RECEIPT</div>
                <div className="text-xs">Order: {order.orderNumber}</div>
                <div className="text-xs">Date: {formatDate(order.createdAt)}</div>
                {order.customerId && (
                  <div className="text-xs">Customer ID: {order.customerId}</div>
                )}

                <div className="receipt-divider" />

                {/* Items */}
                <div className="text-xs font-bold mb-1">ITEMS</div>
                {order.items?.map((item, i) => (
                  <div key={i} className="mb-1">
                    <div className="text-xs">{item.productName}</div>
                    <div className="receipt-row text-xs">
                      <span>{item.quantity} x KES {Number(item.unitPrice).toLocaleString()}</span>
                      <span>KES {Number(item.totalPrice).toLocaleString()}</span>
                    </div>
                  </div>
                ))}

                <div className="receipt-divider" />

                {/* Totals */}
                <div className="receipt-row text-xs">
                  <span>Subtotal</span>
                  <span>KES {Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="receipt-row text-xs">
                  <span>VAT (16%)</span>
                  <span>KES {Number(order.taxAmount).toLocaleString()}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="receipt-row text-xs">
                    <span>Discount</span>
                    <span>-KES {Number(order.discountAmount).toLocaleString()}</span>
                  </div>
                )}

                <div className="receipt-divider" />

                <div className="receipt-total">
                  <span>TOTAL</span>
                  <span>KES {Number(order.totalAmount).toLocaleString()}</span>
                </div>

                {/* Payment Details */}
                <div className="receipt-divider" />
                <div className="receipt-row text-xs">
                  <span>Payment</span>
                  <span className="uppercase font-bold">{order.paymentMethod}</span>
                </div>
                {order.paymentMethod === "cash" && order.cashReceived && (
                  <>
                    <div className="receipt-row text-xs">
                      <span>Cash Received</span>
                      <span>KES {Number(order.cashReceived).toLocaleString()}</span>
                    </div>
                    <div className="receipt-row text-xs font-bold">
                      <span>Change</span>
                      <span>KES {Number(order.cashChange ?? 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {order.paymentStatus === "paid" && (
                  <div className="receipt-row text-xs">
                    <span>Payment</span>
                    <span>Completed</span>
                  </div>
                )}

                <div className="receipt-divider" />

                {/* Status */}
                <div className="text-center text-xs font-bold">
                  {order.paymentStatus === "paid" ? "*** PAID ***" : order.paymentStatus.toUpperCase()}
                </div>

                {/* Footer */}
                <div className="receipt-divider" />
                <div className="receipt-footer">
                  <div>Thank you for your business!</div>
                  <div>Asante kwa biashara yako!</div>
                  <div className="mt-1">Powered by KenPOS</div>
                  <div>{new Date().getFullYear()} © All Rights Reserved</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Order not found</div>
        )}

        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
