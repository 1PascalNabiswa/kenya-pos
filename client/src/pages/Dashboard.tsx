import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import {
  ShoppingCart, TrendingUp, Users, Package, AlertTriangle, ArrowRight, Eye
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.reports.dashboard.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Today's Revenue",
      value: `KES ${(stats?.todayRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: `${stats?.todayOrders ?? 0} orders today`,
      icon: <TrendingUp size={20} />,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Monthly Revenue",
      value: `KES ${(stats?.monthRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: `${stats?.monthOrders ?? 0} orders this month`,
      icon: <ShoppingCart size={20} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Customers",
      value: (stats?.customerCount ?? 0).toLocaleString(),
      sub: "Registered customers",
      icon: <Users size={20} />,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Active Products",
      value: (stats?.productCount ?? 0).toLocaleString(),
      sub: `${stats?.lowStockCount ?? 0} low stock`,
      icon: <Package size={20} />,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const weeklyData = stats?.weeklyRevenue?.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" }),
    revenue: Number(d.revenue),
    orders: Number(d.orderCount),
  })) ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/sales/pos">
          <Button>
            <ShoppingCart size={16} className="mr-2" />
            New Sale
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground mt-1 truncate">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No sales data yet</p>
                  <Link href="/sales/pos">
                    <Button size="sm" variant="outline" className="mt-2">Make your first sale</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                Low Stock
              </CardTitle>
              <Link href="/inventory/alerts">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View all <ArrowRight size={12} className="ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {stats.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">SKU: {p.sku ?? "N/A"}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] flex-shrink-0 ml-2 ${
                        p.stockQuantity === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {p.stockQuantity === 0 ? "Out of stock" : `${p.stockQuantity} left`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Package size={24} className="mx-auto mb-1 opacity-30" />
                  <p className="text-xs">All products well stocked</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link href="/sales/orders">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View all <ArrowRight size={12} className="ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left py-2 font-medium">Order #</th>
                    <th className="text-left py-2 font-medium">Customer</th>
                    <th className="text-left py-2 font-medium">Payment</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-right py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-2 font-mono text-xs text-primary">{order.orderNumber}</td>
                      <td className="py-2 text-xs">{order.customerId ?? "Walk-in"}</td>
                      <td className="py-2">
                        <span className="text-xs uppercase font-medium">{order.paymentMethod}</span>
                      </td>
                      <td className="py-2">
                        <span className={`status-${order.paymentStatus}`}>{order.paymentStatus}</span>
                      </td>
                      <td className="py-2 text-right font-medium text-xs">
                        KES {Number(order.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-KE")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
