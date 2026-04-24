import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingDown, DollarSign, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function InventoryReport() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"stock" | "value" | "turnover">("stock");

  const { data: productsData } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId: categoryFilter ? Number(categoryFilter) : undefined,
    limit: 1000,
  });
  
  const products = productsData?.items ?? [];

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: lowStock } = trpc.products.lowStock.useQuery();

  // Calculate inventory metrics
  const inventoryMetrics = {
    totalProducts: productsData?.total ?? 0,
    totalItems: products.reduce((sum, p) => sum + (Number(p.stockQuantity) || 0), 0),
    totalValue: products.reduce((sum, p) => sum + ((Number(p.stockQuantity) || 0) * (Number(p.price) || 0)), 0),
    lowStockCount: lowStock?.length ?? 0,
  };

  // Stock level distribution
  const stockDistribution = [
    { name: "Overstocked (>100)", value: products.filter((p) => (Number(p.stockQuantity) || 0) > 100).length },
    { name: "Adequate (20-100)", value: products.filter((p) => (Number(p.stockQuantity) || 0) >= 20 && (Number(p.stockQuantity) || 0) <= 100).length },
    { name: "Low (5-19)", value: products.filter((p) => (Number(p.stockQuantity) || 0) >= 5 && (Number(p.stockQuantity) || 0) < 20).length },
    { name: "Critical (<5)", value: products.filter((p) => (Number(p.stockQuantity) || 0) < 5).length },
  ];

  // Top products by value
  const topByValue = products
    .map((p) => ({
      name: p.name,
      value: (Number(p.stockQuantity) || 0) * (Number(p.price) || 0),
      quantity: Number(p.stockQuantity) || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Low stock products
  const lowStockProducts = (lowStock ?? []).slice(0, 10);

  // Category distribution by value
  const categoryValue = products.reduce((acc: any, p) => {
    const catId = p.categoryId;
    const catName = categories?.find((c) => c.id === catId)?.name || "Uncategorized";
    const existing = acc.find((c: any) => c.name === catName);
    const value = (Number(p.stockQuantity) || 0) * (Number(p.price) || 0);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: catName, value });
    }
    return acc;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Inventory Report</h1>
        <p className="text-sm text-muted-foreground">Stock levels, valuation, and inventory health</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{inventoryMetrics.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items in Stock</p>
                <p className="text-2xl font-bold">{inventoryMetrics.totalItems.toLocaleString()}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">KES {(inventoryMetrics.totalValue / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{inventoryMetrics.lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Distribution & Category Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock Level Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stock Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Value by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={categoryValue.sort((a: any, b: any) => b.value - a.value).slice(0, 8)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products by Value */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top 10 Products by Inventory Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">Product Name</th>
                  <th className="text-right py-2 px-2">Quantity</th>
                  <th className="text-right py-2 px-2">Inventory Value</th>
                </tr>
              </thead>
              <tbody>
                {topByValue.map((p, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{p.name}</td>
                    <td className="text-right py-2 px-2">{p.quantity.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 font-medium">KES {p.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              Low Stock Alert ({lowStockProducts.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-2">Product</th>
                    <th className="text-right py-2 px-2">Current Stock</th>
                    <th className="text-right py-2 px-2">Reorder Level</th>
                    <th className="text-center py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 px-2">{p.name}</td>
                      <td className="text-right py-2 px-2 font-medium">{p.quantity}</td>
                      <td className="text-right py-2 px-2">{p.reorderLevel}</td>
                      <td className="text-center py-2 px-2">
                        <Badge variant="destructive">Critical</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
