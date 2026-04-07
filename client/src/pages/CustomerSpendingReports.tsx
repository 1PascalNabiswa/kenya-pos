import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, PieChart as PieChartIcon } from "lucide-react";

export default function CustomerSpendingReports() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Fetch customers for selection
  const { data: customersData } = trpc.customers.list.useQuery({ limit: 100 });

  // Fetch spending reports with date range
  const { data: monthlyData } = trpc.reports.customerSpendingMonthly.useQuery(
    { customerId: selectedCustomerId ?? 0, monthsBack: 12 },
    { enabled: !!selectedCustomerId }
  );

  const { data: trendsData } = trpc.reports.customerSpendingTrends.useQuery(
    { customerId: selectedCustomerId ?? 0 },
    { enabled: !!selectedCustomerId }
  );

  const { data: paymentBreakdown } = trpc.reports.customerPaymentBreakdown.useQuery(
    { customerId: selectedCustomerId ?? 0 },
    { enabled: !!selectedCustomerId }
  );

  const { data: topCustomers } = trpc.reports.topCustomers.useQuery({});
  const { data: comparison } = trpc.reports.customerComparison.useQuery(
    { customerId: selectedCustomerId ?? 0 },
    { enabled: !!selectedCustomerId }
  );

  const selectedCustomer = customersData?.items?.find((c: any) => c.id === selectedCustomerId);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Customer Spending Reports</h1>
          <p className="text-muted-foreground">Analyze customer spending patterns and trends</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Customer</label>
            <Select value={selectedCustomerId?.toString() ?? ""} onValueChange={(v) => setSelectedCustomerId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer..." />
              </SelectTrigger>
              <SelectContent>
                {customersData?.items?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {selectedCustomerId && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">
                      KES {Number(trendsData?.totalSpent ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-foreground">{trendsData?.totalOrders ?? 0}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      KES {Number(trendsData?.avgOrderValue ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Days Active</p>
                    <p className="text-2xl font-bold text-foreground">{trendsData?.daysSinceFirstOrder ?? 0}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </Card>
            </div>

            {/* Spending Trend Chart */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Spending Trend (Monthly)</h2>
              {monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="totalSpent" stroke="#3B82F6" name="Total Spent" />
                    <Line type="monotone" dataKey="orderCount" stroke="#10B981" name="Order Count" yAxisId="right" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">No data available for selected period</p>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Payment Method Breakdown */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Payment Methods
                </h2>
                {paymentBreakdown && paymentBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        dataKey="totalAmount"
                        nameKey="paymentMethod"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {paymentBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">No payment data</p>
                )}
              </Card>

              {/* Order Value Distribution */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Order Value Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Max Order</span>
                    <span className="font-bold">KES {Number(trendsData?.maxOrderValue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Min Order</span>
                    <span className="font-bold">KES {Number(trendsData?.minOrderValue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Average Order</span>
                    <span className="font-bold">KES {Number(trendsData?.avgOrderValue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Spending Variance</span>
                    <span className="font-bold">KES {Number(trendsData?.spendingVariance ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Customer Comparison */}
            {comparison && (
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Customer Comparison</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Customer Total</p>
                    <p className="text-2xl font-bold">KES {Number(comparison.customerTotal ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Customer Spending</p>
                    <p className="text-2xl font-bold">KES {Number(comparison.averageCustomerSpending ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Percentile</p>
                    <p className="text-2xl font-bold">
                      {comparison.customerTotal && comparison.averageCustomerSpending
                        ? Math.round((Number(comparison.customerTotal) / Number(comparison.averageCustomerSpending)) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Top Customers */}
        {!selectedCustomerId && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Top Customers (Last 3 Months)</h2>
            {topCustomers && topCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-semibold">Customer</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Total Spent</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Orders</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Avg Order</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer: any) => (
                      <tr key={customer.id} className="border-b hover:bg-secondary/50">
                        <td className="py-2 px-4">{customer.name}</td>
                        <td className="text-right py-2 px-4 font-bold">KES {Number(customer.totalSpent ?? 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{customer.orderCount}</td>
                        <td className="text-right py-2 px-4">KES {Number(customer.avgOrderValue ?? 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-4 text-sm text-muted-foreground">
                          {customer.daysSinceLastOrder} days ago
                        </td>
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
