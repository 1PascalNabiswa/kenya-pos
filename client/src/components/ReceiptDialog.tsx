import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Printer, Download, X } from "lucide-react";
import { toast } from "sonner";

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  autoPrint?: boolean;
}

export default function ReceiptDialog({ open, onClose, orderId, orderNumber, autoPrint = false }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { data: order, isLoading } = trpc.orders.get.useQuery(
    { id: orderId },
    { enabled: open && !!orderId }
  );

  // Auto-print when dialog opens and order is loaded
  useEffect(() => {
    if (autoPrint && open && order && !isLoading) {
      // Small delay to ensure dialog is rendered
      const timer = setTimeout(() => {
        window.print();
        toast.success("Printing receipt...");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, open, order, isLoading]);

  const handlePrint = () => {
    window.print();
    toast.success("Printing receipt...");
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
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 10pt; width: 78mm; padding: 4mm; }
          .center { text-align: center; }
          .row { display: flex; justify-content: space-between; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 2mm 0; }
          .small { font-size: 8pt; }
        </style>
      </head>
      <body>${content}</body>
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt - {orderNumber}</span>
            <div className="flex gap-2">
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
          <div className="overflow-auto max-h-[70vh]">
            {/* 78mm Thermal Receipt */}
            <div id="thermal-receipt" ref={receiptRef} className="mx-auto">
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
