import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";
import AddProductDialog from "@/components/AddProductDialog";

type Tab = "products" | "categories" | "alerts";

export default function Inventory({ tab: initialTab = "products" }: { tab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3B82F6");
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{ id: number; name: string; qty: number } | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"restock" | "adjustment" | "damage">("restock");
  const [adjustNotes, setAdjustNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: productsData, isLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId: categoryFilter ? Number(categoryFilter) : undefined,
    page,
    limit: 20,
  });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: lowStock } = trpc.products.lowStock.useQuery();

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Product deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const toggleProductActive = trpc.products.update.useMutation({
    onSuccess: (_, { isActive }) => {
      utils.products.list.invalidate();
      toast.success(isActive ? "Product activated" : "Product deactivated");
    },
    onError: (e) => toast.error(e.message),
  });

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Category created"); setAddCategoryOpen(false); setCategoryName(""); },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Category deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const adjustStock = trpc.products.adjustStock.useMutation({
    onSuccess: (data) => {
      utils.products.list.invalidate();
      toast.success(`Stock updated. New quantity: ${data.newQuantity}`);
      setAdjustStockOpen(false);
      setAdjustTarget(null);
      setAdjustQty("");
      setAdjustNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const products = productsData?.items ?? [];
  const total = productsData?.total ?? 0;

  const tabs = [
    { id: "products" as Tab, label: "Products", count: total },
    { id: "categories" as Tab, label: "Categories", count: categories?.length ?? 0 },
    { id: "alerts" as Tab, label: "Stock Alerts", count: lowStock?.length ?? 0, alert: true },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage products, categories, and stock levels</p>
        </div>
        <div className="flex gap-2">
          {tab === "products" && (
            <Button onClick={() => setAddProductOpen(true)}>
              <Plus size={16} className="mr-2" /> Add Product
            </Button>
          )}
          {tab === "categories" && (
            <Button onClick={() => setAddCategoryOpen(true)}>
              <Plus size={16} className="mr-2" /> Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <Badge
                variant="secondary"
                className={`text-[10px] ${t.alert && t.count > 0 ? "bg-orange-100 text-orange-700" : ""}`}
              >
                {t.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === "products" && (
        <>
          <div className="flex gap-4 items-center w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input placeholder="Search products..." className="pl-12 w-full h-12 text-base rounded-lg border-2" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-32 h-12 flex-shrink-0 rounded-lg">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">Stock</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="p-3"><div className="h-8 bg-secondary/50 rounded animate-pulse" /></td></tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No products found</p>
                  </td></tr>
                ) : products.map((p) => {
                  const cat = categories?.find((c) => c.id === p.categoryId);
                  const isLow = p.stockQuantity <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className={`border-t border-border/50 hover:bg-secondary/20 transition-colors ${!p.isActive ? "opacity-60" : ""}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                              <Package size={14} className="text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{p.name}</p>
                            {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                              <span className="badge-discount text-[9px]">
                                {Math.round((1 - Number(p.price) / Number(p.originalPrice)) * 100)}% Off
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground font-mono">{p.sku ?? "—"}</td>
                      <td className="p-3 text-xs">{cat?.name ?? "—"}</td>
                      <td className="p-3 text-right font-medium">KES {Number(p.price).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <span className={`font-medium ${isLow ? "text-orange-600" : "text-foreground"}`}>
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {!p.isActive ? (
                          <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                        ) : p.stockQuantity === 0 ? (
                          <Badge className="bg-red-100 text-red-700 text-[10px]">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge className="bg-orange-100 text-orange-700 text-[10px]">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-[10px]">In Stock</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title={p.isActive ? "Deactivate" : "Activate"}
                            onClick={() => toggleProductActive.mutate({ id: p.id, isActive: !p.isActive })}
                            disabled={toggleProductActive.isPending}
                          >
                            {p.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Adjust Stock"
                            onClick={() => { setAdjustTarget({ id: p.id, name: p.name, qty: p.stockQuantity }); setAdjustStockOpen(true); }}
                          >
                            <RefreshCw size={13} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => { setEditProduct(p); setAddProductOpen(true); }}
                          >
                            <Edit size={13} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProduct.mutate({ id: p.id }); }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        </>
      )}

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories?.map((cat) => (
            <Card key={cat.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg mb-2" style={{ backgroundColor: cat.color ?? "#3B82F6" }} />
                    <p className="font-medium text-sm">{cat.name}</p>
                    {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
                  </div>
                  <Button
                    size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                    onClick={() => { if (confirm(`Delete category "${cat.name}"?`)) deleteCategory.mutate({ id: cat.id }); }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!categories || categories.length === 0) && (
            <div className="col-span-4 text-center py-12 text-muted-foreground">
              <p>No categories yet. Add your first category.</p>
            </div>
          )}
        </div>
      )}

      {/* Stock Alerts Tab */}
      {tab === "alerts" && (
        <div className="space-y-3">
          {lowStock && lowStock.length > 0 ? (
            lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.stockQuantity === 0 ? "bg-red-100" : "bg-orange-100"}`}>
                    <AlertTriangle size={18} className={p.stockQuantity === 0 ? "text-red-600" : "text-orange-600"} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {p.sku ?? "N/A"} · Threshold: {p.lowStockThreshold}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold text-lg ${p.stockQuantity === 0 ? "text-red-600" : "text-orange-600"}`}>
                      {p.stockQuantity}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.unit} remaining</p>
                  </div>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => { setAdjustTarget({ id: p.id, name: p.name, qty: p.stockQuantity }); setAdjustType("restock"); setAdjustStockOpen(true); }}
                  >
                    <RefreshCw size={13} className="mr-1" /> Restock
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>All products are well stocked!</p>
            </div>
          )}
        </div>
      )}

      {/* Add Product Dialog */}
      <AddProductDialog
        open={addProductOpen}
        onClose={() => { setAddProductOpen(false); setEditProduct(null); }}
        editProduct={editProduct}
      />

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Category Name</Label>
              <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Foods" className="mt-1" />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={categoryColor} onChange={(e) => setCategoryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-border" />
                <span className="text-sm text-muted-foreground">{categoryColor}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddCategoryOpen(false)} className="flex-1">Cancel</Button>
              <Button
                className="flex-1"
                disabled={!categoryName || createCategory.isPending}
                onClick={() => createCategory.mutate({ name: categoryName, color: categoryColor })}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adjust Stock — {adjustTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current: <strong>{adjustTarget?.qty}</strong> units</p>
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock (Add)</SelectItem>
                  <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="damage">Damage/Loss (Deduct)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity Change</Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder={adjustType === "damage" ? "Units lost (positive)" : "Units to add"}
                className="mt-1"
              />
              {adjustQty && (
                <p className="text-xs text-muted-foreground mt-1">
                  New quantity: {(adjustTarget?.qty ?? 0) + (adjustType === "damage" ? -Number(adjustQty) : Number(adjustQty))}
                </p>
              )}
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} className="mt-1 h-16" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAdjustStockOpen(false)} className="flex-1">Cancel</Button>
              <Button
                className="flex-1"
                disabled={!adjustQty || adjustStock.isPending}
                onClick={() => adjustStock.mutate({ productId: adjustTarget!.id, changeType: adjustType, quantityChange: Number(adjustQty), notes: adjustNotes })}
              >
                {adjustStock.isPending ? "Updating..." : "Update Stock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
