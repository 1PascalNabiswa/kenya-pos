import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Search, Filter, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon } from "lucide-react";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [matchCustomerId, setMatchCustomerId] = useState("");
  const [matchOrderId, setMatchOrderId] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const unusedTransactions = trpc.transactions.unused.useQuery(
    { search: searchTerm },
    { refetchInterval: 5000 }
  );

  const transactionHistory = trpc.transactions.history.useQuery(
    { limit: 100 },
    { refetchInterval: 10000 }
  );

  // Mutations
  const matchTransaction = trpc.transactions.match.useMutation({
    onSuccess: () => {
      utils.transactions.unused.invalidate();
      utils.transactions.history.invalidate();
      toast.success("Transaction matched and moved to used");
      setSelectedTransaction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to match transaction");
    },
  });

  const recordTransaction = trpc.transactions.record.useMutation({
    onSuccess: () => {
      utils.transactions.unused.invalidate();
      toast.success("Transaction recorded");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record transaction");
    },
  });

  const handleMatchTransaction = async () => {
    if (!selectedTransaction || !matchCustomerId || !matchOrderId) {
      toast.error("Please fill in all fields");
      return;
    }

    await matchTransaction.mutateAsync({
      transactionId: selectedTransaction.transactionId,
      customerId: Number(matchCustomerId),
      orderId: Number(matchOrderId),
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "used") return <Badge className="bg-green-600">Used</Badge>;
    if (status === "unused") return <Badge className="bg-yellow-600">Unused</Badge>;
    return <Badge className="bg-red-600">Disputed</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      mpesa: "bg-green-100 text-green-800",
      stripe: "bg-blue-100 text-blue-800",
      bank: "bg-purple-100 text-purple-800",
    };
    return <Badge className={colors[method] || "bg-gray-100"}>{method.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction Reconciliation</h1>
        <p className="text-muted-foreground">Manage and reconcile payment transactions</p>
      </div>

      <Tabs defaultValue="unused" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unused">
            Unused Transactions ({unusedTransactions.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="record">Record Transaction</TabsTrigger>
        </TabsList>

        {/* Unused Transactions Tab */}
        <TabsContent value="unused" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unused Transactions</CardTitle>
              <CardDescription>
                Transactions that haven't been matched to orders yet. Search by customer name or transaction ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Methods</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="stripe">Stripe</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              {/* Transactions List */}
              {unusedTransactions.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : unusedTransactions.data?.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No unused transactions found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unusedTransactions.data?.map((txn: any) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm">{txn.transactionId}</span>
                          {getMethodBadge(txn.method)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {txn.customerName || "Unknown Customer"} • KES {Number(txn.amount).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(txn.createdAt).toLocaleString("en-KE", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                            hour12: false,
                          })}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedTransaction(txn)}
                            className="gap-2"
                          >
                            <LinkIcon className="h-4 w-4" />
                            Match
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Match Transaction to Order</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Transaction Details</Label>
                              <div className="bg-muted p-3 rounded text-sm space-y-1">
                                <div>ID: {selectedTransaction?.transactionId}</div>
                                <div>Method: {selectedTransaction?.method.toUpperCase()}</div>
                                <div>Amount: KES {Number(selectedTransaction?.amount).toLocaleString()}</div>
                                <div>Customer: {selectedTransaction?.customerName || "Unknown"}</div>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="customerId">Customer ID</Label>
                              <Input
                                id="customerId"
                                type="number"
                                placeholder="Enter customer ID"
                                value={matchCustomerId}
                                onChange={(e) => setMatchCustomerId(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="orderId">Order ID</Label>
                              <Input
                                id="orderId"
                                type="number"
                                placeholder="Enter order ID"
                                value={matchOrderId}
                                onChange={(e) => setMatchOrderId(e.target.value)}
                              />
                            </div>

                            <Button
                              onClick={handleMatchTransaction}
                              disabled={matchTransaction.isPending}
                              className="w-full"
                            >
                              {matchTransaction.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              )}
                              Confirm Match
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All recorded transactions and their reconciliation status</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionHistory.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactionHistory.data?.map((txn: any) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm">{txn.transactionId}</span>
                          {getMethodBadge(txn.method)}
                          {getStatusBadge(txn.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {txn.customerName || "Unknown"} • KES {Number(txn.amount).toLocaleString()}
                        </div>
                        {txn.orderId && (
                          <div className="text-xs text-muted-foreground">
                            Order ID: {txn.orderId}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {txn.matchedAt
                            ? `Matched: ${new Date(txn.matchedAt).toLocaleString("en-KE", {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit", second: "2-digit",
                                hour12: false,
                              })}`
                            : `Recorded: ${new Date(txn.createdAt).toLocaleString("en-KE", {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit", second: "2-digit",
                                hour12: false,
                              })}`}
                        </div>
                      </div>
                      {txn.status === "used" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Record Transaction Tab */}
        <TabsContent value="record" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record New Transaction</CardTitle>
              <CardDescription>Manually record a payment transaction for reconciliation</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionRecordForm onSuccess={() => setSearchTerm("")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TransactionRecordForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    transactionId: "",
    method: "mpesa",
    amount: "",
    customerName: "",
  });

  const recordTransaction = trpc.transactions.record.useMutation({
    onSuccess: () => {
      toast.success("Transaction recorded successfully");
      setFormData({ transactionId: "", method: "mpesa", amount: "", customerName: "" });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record transaction");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transactionId || !formData.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    await recordTransaction.mutateAsync({
      transactionId: formData.transactionId,
      method: formData.method as any,
      amount: Number(formData.amount),
      customerName: formData.customerName || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="transactionId">Transaction ID *</Label>
        <Input
          id="transactionId"
          placeholder="e.g., TXN123456789"
          value={formData.transactionId}
          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="method">Payment Method *</Label>
        <select
          id="method"
          value={formData.method}
          onChange={(e) => setFormData({ ...formData, method: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="mpesa">M-Pesa</option>
          <option value="stripe">Stripe</option>
          <option value="bank">Bank Transfer</option>
        </select>
      </div>

      <div>
        <Label htmlFor="amount">Amount (KES) *</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <Label htmlFor="customerName">Customer Name (Optional)</Label>
        <Input
          id="customerName"
          placeholder="Customer name"
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={recordTransaction.isPending} className="w-full">
        {recordTransaction.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Record Transaction
      </Button>
    </form>
  );
}
