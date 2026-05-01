import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ShoppingCart, Calendar, Wallet } from "lucide-react";

export default function CustomerSpendingReports() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Fetch top customers - this is our source of truth for customer spending
  const { data: topCustomers = [] } = trpc.reports.topCustomers.useQuery({});

  // Get the selected customer's data from topCustomers
  const selectedCustomerData = useMemo(() => {
    if (!selectedCustomerId || !topCustomers || topCustomers.length === 0) return null;
    return topCustomers.find((c: any) => c?.id === selectedCustomerId);
  }, [selectedCustomerId, topCustomers]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Customer Spending Reports</h1>
          <p className="text-muted-foreground">Analyze customer spending patterns and trends by payment method</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Customer</label>
            <Select 
              value={selectedCustomerId ? String(selectedCustomerId) : ""} 
              onValueChange={(v) => setSelectedCustomerId(v ? Number(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(topCustomers) && topCustomers.length > 0 && topCustomers.map((customer: any) => {
                  if (!customer || !customer.id) return null;
                  return (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name || "Unknown Customer"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCustomerData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">
                      KES {Number(selectedCustomerData.totalSpent ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Spent</p>
                    <p className="text-2xl font-bold text-blue-600">
                      KES {Number(selectedCustomerData.walletSpent ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Other Payment</p>
                    <p className="text-2xl font-bold text-green-600">
                      KES {Number(selectedCustomerData.otherSpent ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-foreground">{selectedCustomerData.orderCount ?? 0}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      KES {Number(selectedCustomerData.avgOrderValue ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-primary" />
                </div>
              </Card>
            </div>

            {/* Customer Details */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">{selectedCustomerData.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-lg font-semibold">{selectedCustomerData.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-lg font-semibold">{selectedCustomerData.email || "N/A"}</p>
                </div>
              </div>
            </Card>

            {/* Payment Method Breakdown */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Payment Method Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Wallet className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="font-semibold text-foreground">Wallet Payments</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    KES {Number(selectedCustomerData.walletSpent ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedCustomerData.totalSpent > 0 
                      ? `${((selectedCustomerData.walletSpent / selectedCustomerData.totalSpent) * 100).toFixed(1)}% of total`
                      : "0% of total"
                    }
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                    <p className="font-semibold text-foreground">Other Payment Methods</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    KES {Number(selectedCustomerData.otherSpent ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedCustomerData.totalSpent > 0 
                      ? `${((selectedCustomerData.otherSpent / selectedCustomerData.totalSpent) * 100).toFixed(1)}% of total`
                      : "0% of total"
                    }
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Top Customers */}
        {!selectedCustomerId && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Top Customers (Last 3 Months)</h2>
            {Array.isArray(topCustomers) && topCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-semibold">Customer</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Total Spent</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Wallet</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Other</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Orders</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer: any, index: number) => (
                      <tr 
                        key={customer?.id ?? `customer-${index}`} 
                        className="border-b hover:bg-secondary/50 cursor-pointer" 
                        onClick={() => customer?.id && setSelectedCustomerId(customer.id)}
                      >
                        <td className="py-2 px-4">{customer?.name || "Unknown"}</td>
                        <td className="text-right py-2 px-4 font-bold">KES {Number(customer?.totalSpent ?? 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-4 text-blue-600 font-semibold">KES {Number(customer?.walletSpent ?? 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-4 text-green-600 font-semibold">KES {Number(customer?.otherSpent ?? 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{customer?.orderCount ?? 0}</td>
                        <td className="text-right py-2 px-4">KES {Number(customer?.avgOrderValue ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
