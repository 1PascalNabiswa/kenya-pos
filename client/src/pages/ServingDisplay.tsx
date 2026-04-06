import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Check, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ServingDisplay() {
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [orders, setOrders] = useState<any[]>([]);

  const { data: queueData, isLoading, refetch } = trpc.kds.getQueue.useQuery(
    { status: selectedStatus as any },
    { refetchInterval: 5000 }
  );

  const updateStatus = trpc.kds.updateOrderStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error("Failed to update order status");
      console.error(error);
    },
  });

  useEffect(() => {
    if (queueData) {
      setOrders(queueData);
    }
  }, [queueData]);

  const handleMarkServed = (orderId: number) => {
    updateStatus.mutate({
      orderId,
      status: "served",
    });
  };

  const handleMarkCompleted = (orderId: number) => {
    updateStatus.mutate({
      orderId,
      status: "completed",
    });
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-100", textColor: "text-yellow-800" },
    preparing: { label: "Preparing", color: "bg-blue-100", textColor: "text-blue-800" },
    ready: { label: "Ready", color: "bg-green-100", textColor: "text-green-800" },
    served: { label: "Served", color: "bg-purple-100", textColor: "text-purple-800" },
    completed: { label: "Completed", color: "bg-gray-100", textColor: "text-gray-800" },
  };

  const currentConfig = statusConfig[selectedStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-700 p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Serving Order Display</h1>
          <p className="text-slate-400 mb-6">Manage and track orders ready for serving</p>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {["pending", "preparing", "ready", "served", "completed"].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() => setSelectedStatus(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No orders in {selectedStatus} status</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className={`p-6 border-2 ${currentConfig.color} ${currentConfig.textColor} rounded-lg shadow-lg hover:shadow-xl transition-shadow`}
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">{order.orderNumber}</h3>
                      <p className="text-sm opacity-75">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge className={currentConfig.color}>{order.status}</Badge>
                  </div>

                  {/* Customer Info */}
                  {order.customerName && (
                    <div className="mb-4 pb-4 border-b border-current opacity-50">
                      <p className="font-semibold">Customer: {order.customerName}</p>
                    </div>
                  )}

                  {/* Items */}
                  <div className="mb-4 space-y-2">
                    <p className="font-semibold text-sm opacity-75">Items:</p>
                    {order.items && order.items.length > 0 ? (
                      <ul className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx} className="text-sm flex justify-between">
                            <span>{item.productName}</span>
                            <span className="font-semibold">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm opacity-75">No items</p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mb-6 pb-6 border-b border-current opacity-50">
                    <p className="text-lg font-bold">
                      Total: KES {Number(order.totalAmount).toLocaleString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {selectedStatus === "pending" && (
                      <Button
                        onClick={() => handleMarkServed(order.id)}
                        disabled={updateStatus.isPending}
                        className="flex-1"
                      >
                        {updateStatus.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Ready to Serve
                      </Button>
                    )}
                    {selectedStatus === "ready" && (
                      <Button
                        onClick={() => handleMarkCompleted(order.id)}
                        disabled={updateStatus.isPending}
                        className="flex-1"
                      >
                        {updateStatus.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Mark Served
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
