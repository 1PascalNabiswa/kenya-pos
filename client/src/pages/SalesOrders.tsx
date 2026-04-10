import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, FileText, Eye, Printer, RefreshCw } from "lucide-react";
import ReceiptDialog from "@/components/ReceiptDialog";

export default function SalesOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
  const [receiptOrderNumber, setReceiptOrderNumber] = useState("");

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.orders.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
    page,
    limit: 20,
  });

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Order updated"); },
    onError: (e) => toast.error(e.message),
  });

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;

  const paymentBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: "bg-green-100 text-green-700",
      mpesa: "bg-emerald-100 text-emerald-700",
      stripe: "bg-blue-100 text-blue-700",
      mixed: "bg-purple-100 text-purple-700",
    };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${colors[method] ?? "bg-secondary"}`}>{method}</span>;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Orders</h1>
          <p className="text-sm text-muted-foreground">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input placeholder="Search order number..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 font-medium">Order #</th>
              <th className="text-left p-3 font-medium">Customer</th>
              <th className="text-left p-3 font-medium">Payment</th>
              <th className="text-center p-3 font-medium">Pay Status</th>
              <th className="text-center p-3 font-medium">Order Status</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-right p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="p-3"><div className="h-8 bg-secondary/50 rounded animate-pulse" /></td></tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p>No orders found</p>
              </td></tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                <td className="p-3 font-mono text-xs text-primary font-medium">{order.orderNumber}</td>
                <td className="p-3 text-xs">{order.customerName ?? "Walk-in"}</td>
                <td className="p-3 text-xs uppercase font-medium">{paymentBadge(order.paymentMethod)}</td>
                <td className="p-3 text-center">
                  <span className={`status-${order.paymentStatus}`}>{order.paymentStatus}</span>
                </td>
                <td className="p-3 text-center">
                  <span className={`status-${order.orderStatus}`}>{order.orderStatus}</span>
                </td>
                <td className="p-3 text-right font-medium">KES {Number(order.totalAmount).toLocaleString()}</td>
                <td className="p-3 text-right text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-KE")}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View Details" onClick={() => setViewOrder(order)}>
                      <Eye size={13} />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 w-7 p-0" title="Print Receipt"
                      onClick={() => { setReceiptOrderId(order.id); setReceiptOrderNumber(order.orderNumber); }}
                    >
                      <Printer size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* View Order Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order {viewOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewOrder.customerName ?? "Walk-in"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(viewOrder.createdAt).toLocaleDateString("en-KE")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  {viewOrder.paymentStatus}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`status-${viewOrder.paymentStatus}`}>{viewOrder.paymentStatus}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>KES {Number(viewOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (16%)</span>
                  <span>KES {Number(viewOrder.taxAmount).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">KES {Number(viewOrder.totalAmount).toLocaleString()}</span>
                </div>
              </div>
              {viewOrder.paymentStatus === "paid" && (
                <div className="bg-green-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Cash Received</span>
                    <span>KES {Number(viewOrder.cashReceived).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-700">
                    <span>Change</span>
                    <span>KES {Number(viewOrder.cashChange ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
              {viewOrder.mpesaTransactionId && (
                <div className="bg-emerald-50 rounded-lg p-3 text-sm">
                  <p className="text-xs text-muted-foreground">M-Pesa Transaction ID</p>
                  <p className="font-mono font-medium">{viewOrder.mpesaTransactionId}</p>
                </div>
              )}
              <div className="flex gap-2">
                {viewOrder.paymentStatus === "pending" && (
                  <Button
                    size="sm" variant="outline" className="flex-1"
                    onClick={() => { updateStatus.mutate({ id: viewOrder.id, paymentStatus: "paid", orderStatus: "completed" }); setViewOrder(null); }}
                  >
                    Mark as Paid
                  </Button>
                )}
                <Button
                  size="sm" className="flex-1"
                  onClick={() => { setReceiptOrderId(viewOrder.id); setReceiptOrderNumber(viewOrder.orderNumber); setViewOrder(null); }}
                >
                  <Printer size={13} className="mr-1" /> Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {receiptOrderId && (
        <ReceiptDialog
          open={!!receiptOrderId}
          onClose={() => { setReceiptOrderId(null); setReceiptOrderNumber(""); }}
          orderId={receiptOrderId}
          orderNumber={receiptOrderNumber}
        />
      )}
    </div>
  );
}
