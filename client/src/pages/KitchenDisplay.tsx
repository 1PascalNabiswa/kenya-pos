import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

interface OrderWithItems {
  id: number;
  orderNumber: string;
  customerName?: string;
  items: Array<{
    id: number;
    productId: number;
    quantity: number;
    product?: { name: string; price: string };
  }>;
  currentStatus?: string;
  createdAt: Date;
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const getQueueQuery = trpc.kds.getQueue.useQuery({ status: selectedStatus });
  const updateStatusMutation = trpc.kds.updateOrderStatus.useMutation();

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      getQueueQuery.refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, getQueueQuery]);

  // Update orders when query data changes
  useEffect(() => {
    if (getQueueQuery.data) {
      const formattedOrders = (getQueueQuery.data as any[]).map((item: any) => ({
        id: item.order?.id,
        orderNumber: item.order?.orderNumber,
        customerName: item.order?.customerName,
        items: item.items ? [item.items] : [],
        currentStatus: item.status?.status,
        createdAt: item.order?.createdAt,
      }));
      setOrders(formattedOrders);
    }
  }, [getQueueQuery.data]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus,
      });
      toast.success(`Order moved to ${newStatus}`);
      getQueueQuery.refetch();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-red-100 text-red-800",
    preparing: "bg-yellow-100 text-yellow-800",
    ready: "bg-green-100 text-green-800",
    served: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <AlertCircle className="w-4 h-4" />,
    preparing: <Zap className="w-4 h-4" />,
    ready: <CheckCircle2 className="w-4 h-4" />,
    served: <Clock className="w-4 h-4" />,
    completed: <CheckCircle2 className="w-4 h-4" />,
  };

  const statuses = ["pending", "preparing", "ready", "served", "completed"];

  return (
    <div className="h-screen bg-gray-900 text-white p-6">
      <div className="max-w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Kitchen Display System</h1>
            <p className="text-gray-400 mt-1">Real-time order management</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
            <Button
              onClick={() => getQueueQuery.refetch()}
              variant="outline"
              className="border-gray-600 hover:bg-gray-800"
            >
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {statuses.map((status) => (
            <Button
              key={status}
              onClick={() => setSelectedStatus(status)}
              variant={selectedStatus === status ? "default" : "outline"}
              className={`capitalize ${
                selectedStatus === status
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-gray-600 hover:bg-gray-800"
              }`}
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Orders Grid */}
        {getQueueQuery.isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-xl">No orders in this status</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="bg-gray-800 border-gray-700 p-4 hover:border-blue-500 transition-colors"
              >
                {/* Order Header */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-400">{order.customerName || "Walk-in"}</p>
                    </div>
                    <Badge className={`${statusColors[order.currentStatus || "pending"]} capitalize`}>
                      {statusIcons[order.currentStatus || "pending"]}
                      <span className="ml-1">{order.currentStatus || "pending"}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {/* Order Items */}
                <div className="bg-gray-700 rounded p-3 mb-4 max-h-48 overflow-y-auto">
                  {order.items.length === 0 ? (
                    <p className="text-gray-400 text-sm">No items</p>
                  ) : (
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-200">
                          <span className="font-semibold">{item.quantity}x</span>{" "}
                          {item.product?.name || `Item ${item.productId}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {statuses
                    .filter((s) => statuses.indexOf(s) > statuses.indexOf(order.currentStatus || "pending"))
                    .slice(0, 2)
                    .map((status) => (
                      <Button
                        key={status}
                        onClick={() => handleStatusChange(order.id, status)}
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 text-xs capitalize bg-blue-600 hover:bg-blue-700"
                      >
                        {status}
                      </Button>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
