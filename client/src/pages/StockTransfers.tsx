import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBranch } from "@/contexts/BranchContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pending approval",
  in_transit: "In transit",
  received: "Received",
  cancelled: "Cancelled",
};

const statusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  in_transit: "bg-blue-100 text-blue-800",
  received: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-600",
};

type TransferItem = {
  productId: number;
  productName: string;
  quantity: number;
};

export default function StockTransfers() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(
    null
  );
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);
  const [newProductId, setNewProductId] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [receivedItems, setReceivedItems] = useState<Record<number, number>>(
    {}
  );

  const { data: branches = [] } = trpc.branches.list.useQuery();
  const { data: productsData } = trpc.products.list.useQuery({
    isActive: true,
    limit: 200,
  });
  const transferInput =
    statusFilter === "all"
      ? {}
      : {
          status: statusFilter as
            | "pending"
            | "in_transit"
            | "received"
            | "cancelled",
        };
  const {
    data: transfers = [],
    isLoading,
    refetch,
  } = trpc.branches.getTransfers.useQuery(transferInput);
  const { data: transferDetails, isLoading: detailsLoading } =
    trpc.branches.getTransferDetails.useQuery(
      { transferId: selectedTransferId ?? 0 },
      { enabled: selectedTransferId !== null }
    );

  const createTransfer = trpc.branches.initiateTransfer.useMutation({
    onSuccess: () => {
      toast.success("Stock transfer initiated");
      setIsCreateOpen(false);
      setItems([]);
      setNotes("");
      refetch();
    },
    onError: error => toast.error(error.message),
  });
  const approveTransfer = trpc.branches.approveTransfer.useMutation({
    onSuccess: () => {
      toast.success("Transfer approved and marked in transit");
      refetch();
    },
    onError: error => toast.error(error.message),
  });
  const receiveTransfer = trpc.branches.receiveTransfer.useMutation({
    onSuccess: () => {
      toast.success("Transfer received");
      setSelectedTransferId(null);
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const products = productsData?.items ?? [];
  const availableProducts = useMemo(
    () =>
      products.filter(
        (product: any) => !items.some(item => item.productId === product.id)
      ),
    [products, items]
  );

  useEffect(() => {
    if (selectedBranch?.branchId && !fromBranchId)
      setFromBranchId(String(selectedBranch.branchId));
  }, [selectedBranch, fromBranchId]);

  useEffect(() => {
    if (transferDetails?.items) {
      setReceivedItems(
        Object.fromEntries(
          transferDetails.items.map((item: any) => [
            item.id,
            Number(item.receivedQuantity || item.quantity),
          ])
        )
      );
    }
  }, [transferDetails]);

  const addItem = () => {
    const product = products.find(
      (candidate: any) => candidate.id === Number(newProductId)
    );
    const quantity = Number(newQuantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      toast.error("Choose a product and enter a quantity of at least 1");
      return;
    }
    setItems(current => [
      ...current,
      { productId: product.id, productName: product.name, quantity },
    ]);
    setNewProductId("");
    setNewQuantity("1");
  };

  const submitTransfer = () => {
    if (!fromBranchId || !toBranchId || fromBranchId === toBranchId) {
      toast.error("Choose different source and destination branches");
      return;
    }
    if (!items.length) {
      toast.error("Add at least one product");
      return;
    }
    createTransfer.mutate({
      fromBranchId: Number(fromBranchId),
      toBranchId: Number(toBranchId),
      notes: notes.trim() || undefined,
      items,
    });
  };

  const canReceive = transferDetails && transferDetails.status === "in_transit";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-muted-foreground">
            Move products between branches with approval and receiving controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New transfer
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="transfer-status">Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="transfer-status" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All transfers</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer history</CardTitle>
          <CardDescription>
            {transfers.length} transfer{transfers.length === 1 ? "" : "s"}{" "}
            visible for your assigned locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading transfers...
            </p>
          ) : transfers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>No stock transfers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Transfer</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Initiated</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer: any) => (
                    <tr key={transfer.id} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="font-medium">
                          {transfer.transferNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transfer.initiatedByName || "Unknown"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{transfer.fromBranchName || "Unknown"}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span>{transfer.toBranchName || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={statusClasses[transfer.status] || ""}>
                          {statusLabels[transfer.status] || transfer.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {transfer.initiatedAt
                          ? new Date(transfer.initiatedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {user?.role === "admin" &&
                            transfer.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  approveTransfer.mutate({
                                    transferId: transfer.id,
                                  })
                                }
                                disabled={approveTransfer.isPending}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />{" "}
                                Approve
                              </Button>
                            )}
                          {transfer.status === "in_transit" && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedTransferId(transfer.id)}
                            >
                              <Truck className="mr-1 h-4 w-4" /> Receive
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTransferId(transfer.id)}
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Initiate stock transfer</DialogTitle>
            <DialogDescription>
              Select the source and destination branches, then add products.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From branch</Label>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Source branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To branch</Label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter((branch: any) => String(branch.id) !== fromBranchId)
                    .map((branch: any) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Products</Label>
            <div className="flex gap-2">
              <Select value={newProductId} onValueChange={setNewProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product: any) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="w-24"
                type="number"
                min="1"
                value={newQuantity}
                onChange={event => setNewQuantity(event.target.value)}
              />
              <Button type="button" variant="outline" onClick={addItem}>
                Add
              </Button>
            </div>
            {items.length > 0 && (
              <div className="space-y-2 rounded-md border p-3">
                {items.map(item => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{item.productName}</span>
                    <span className="font-medium">× {item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Notes (optional)</Label>
            <Textarea
              id="transfer-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Reason or handling instructions"
            />
          </div>
          <Button onClick={submitTransfer} disabled={createTransfer.isPending}>
            {createTransfer.isPending ? "Creating..." : "Initiate transfer"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedTransferId !== null}
        onOpenChange={open => !open && setSelectedTransferId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer details</DialogTitle>
            <DialogDescription>
              {transferDetails?.transferNumber || "Loading transfer..."}
            </DialogDescription>
          </DialogHeader>
          {detailsLoading || !transferDetails ? (
            <p className="py-6 text-center text-muted-foreground">
              Loading details...
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={statusClasses[transferDetails.status] || ""}>
                  {statusLabels[transferDetails.status] ||
                    transferDetails.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {transferDetails.notes || "No notes"}
                </span>
              </div>
              <div className="space-y-2">
                {transferDetails.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span>{item.productName}</span>
                    {canReceive ? (
                      <Input
                        className="w-24"
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={receivedItems[item.id] ?? item.quantity}
                        onChange={event =>
                          setReceivedItems(current => ({
                            ...current,
                            [item.id]: Math.min(
                              item.quantity,
                              Math.max(0, Number(event.target.value))
                            ),
                          }))
                        }
                      />
                    ) : (
                      <span>
                        {item.receivedQuantity || 0} / {item.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {canReceive && (
                <Button
                  className="w-full"
                  onClick={() =>
                    receiveTransfer.mutate({
                      transferId: transferDetails.id,
                      items: transferDetails.items.map((item: any) => ({
                        itemId: item.id,
                        receivedQuantity:
                          receivedItems[item.id] ?? item.quantity,
                      })),
                    })
                  }
                  disabled={receiveTransfer.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />{" "}
                  {receiveTransfer.isPending
                    ? "Receiving..."
                    : "Confirm receipt"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
