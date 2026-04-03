import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Wallet, Plus, TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";

export default function WalletPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [loadAmount, setLoadAmount] = useState("");
  const [loadDescription, setLoadDescription] = useState("");

  const utils = trpc.useUtils();

  // Get customers list
  const customers = trpc.customers.list.useQuery();

  // Get wallet for selected customer
  const wallet = trpc.wallet.get.useQuery(
    { customerId: selectedCustomerId || 0 },
    { enabled: !!selectedCustomerId }
  );

  // Get wallet transactions
  const transactions = trpc.wallet.transactions.useQuery(
    { customerId: selectedCustomerId || 0, limit: 50 },
    { enabled: !!selectedCustomerId }
  );

  // Mutations
  const loadWallet = trpc.wallet.load.useMutation({
    onSuccess: (data) => {
      utils.wallet.get.invalidate();
      utils.wallet.transactions.invalidate();
      toast.success(`Wallet loaded! New balance: KES ${data.newBalance.toLocaleString()}`);
      setLoadAmount("");
      setLoadDescription("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to load wallet");
    },
  });

  const handleLoadWallet = async () => {
    if (!selectedCustomerId || !loadAmount) {
      toast.error("Please select a customer and enter an amount");
      return;
    }

    await loadWallet.mutateAsync({
      customerId: selectedCustomerId,
      amount: Number(loadAmount),
      description: loadDescription || undefined,
    });
  };

  const currentWallet = wallet.data;
  const currentBalance = currentWallet ? Number(currentWallet.balance) : 0;
  const totalLoaded = currentWallet ? Number(currentWallet.totalLoaded) : 0;
  const totalSpent = currentWallet ? Number(currentWallet.totalSpent) : 0;

  const selectedCustomer = customers.data?.items?.find((c: any) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Customer Wallets
        </h1>
        <p className="text-muted-foreground">Manage customer wallet balances and load funds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Customer</CardTitle>
            <CardDescription>Choose a customer to manage their wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customers.isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : customers.data?.items?.length === 0 ? (
                <div className="text-center py-4">
                  <AlertCircle className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No customers found</p>
                </div>
              ) : (
                customers.data?.items?.map((customer: any) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCustomerId === customer.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted border-border"
                    }`}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm opacity-75">{customer.phone}</div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wallet Details</CardTitle>
            <CardDescription>
              {selectedCustomer ? `${selectedCustomer.name}'s wallet` : "Select a customer to view wallet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCustomerId ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Select a customer to view wallet details</p>
              </div>
            ) : wallet.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Balance Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
                    <div className="text-2xl font-bold text-blue-700">
                      KES {currentBalance.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Total Loaded
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      KES {totalLoaded.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <TrendingDown className="h-4 w-4" />
                      Total Spent
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      KES {totalSpent.toLocaleString()}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Load Funds Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Load Funds</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="loadAmount">Amount (KES)</Label>
                      <Input
                        id="loadAmount"
                        type="number"
                        placeholder="0"
                        value={loadAmount}
                        onChange={(e) => setLoadAmount(e.target.value)}
                        min="0"
                        step="100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="loadDescription">Description (Optional)</Label>
                      <Input
                        id="loadDescription"
                        placeholder="e.g., Monthly credit"
                        value={loadDescription}
                        onChange={(e) => setLoadDescription(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleLoadWallet}
                      disabled={loadWallet.isPending || !loadAmount}
                      className="w-full gap-2"
                    >
                      {loadWallet.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Plus className="h-4 w-4" />
                      Load Wallet
                    </Button>
                  </div>
                </div>

                {/* Quick Load Buttons */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Quick load amounts:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2000, 5000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setLoadAmount(String(amount))}
                      >
                        KES {amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      {selectedCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Transaction History</CardTitle>
            <CardDescription>Recent wallet activity for {selectedCustomer?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : transactions.data?.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No transaction history yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.data?.map((txn: any) => (
                  <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {txn.type === "load" ? (
                          <Badge className="bg-green-100 text-green-800">Load</Badge>
                        ) : txn.type === "spend" ? (
                          <Badge className="bg-red-100 text-red-800">Spend</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">Refund</Badge>
                        )}
                        <span className="font-medium">
                          {txn.type === "load" ? "+" : "-"}KES {Number(txn.amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {txn.description || (txn.orderId ? `Order #${txn.orderId}` : "Wallet transaction")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(txn.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div
                      className={`font-semibold ${
                        txn.type === "load" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {txn.type === "load" ? "+" : "-"}KES {Number(txn.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
