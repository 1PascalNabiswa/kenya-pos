import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User, Calendar, Package,
  ChevronRight, Printer, X, Check
} from "lucide-react";
import PaymentDialog from "@/components/PaymentDialog";
import ReceiptDialog from "@/components/ReceiptDialog";
import AddProductDialog from "@/components/AddProductDialog";

interface CartItem {
  productId: number;
  productName: string;
  productSku?: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
}

const TAX_RATE = 0.16; // 16% VAT Kenya

export default function SalesTransaction() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
  const [receiptOrderNumber, setReceiptOrderNumber] = useState<string>("");

  const { data: categoriesData } = trpc.categories.list.useQuery();
  const { data: productsData, isLoading: productsLoading } = trpc.products.list.useQuery({
    categoryId: selectedCategory ?? undefined,
    search: search || undefined,
    isActive: true,
    limit: 100,
  });
  const { data: customersData } = trpc.customers.list.useQuery({
    search: customerSearch || undefined,
    limit: 20,
  });

  const categories = categoriesData ?? [];
  const products = productsData?.items ?? [];
  const customers = customersData?.items ?? [];

  // Cart calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const taxAmount = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const addToCart = useCallback((product: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku ?? undefined,
          unitPrice: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          quantity: 1,
          imageUrl: product.imageUrl ?? undefined,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomerId(null);
    setSelectedCustomerName("");
  }, []);

  const handleOrderComplete = (orderId: number, orderNumber: string) => {
    setLastOrderId(orderId);
    setLastOrderNumber(orderNumber);
    setReceiptOrderId(orderId);
    setReceiptOrderNumber(orderNumber);
    setShowReceiptDialog(true);
    setPaymentDialogOpen(false);
    clearCart();
  };

  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalProductCount = productsData?.total ?? 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart size={24} className="text-primary" />
            Sales Transaction
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search products..."
              className="pl-9 w-full sm:w-64 h-10 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-0">
        {/* Left: Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Category Tabs */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-card/50 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === null
                  ? "bg-primary text-white shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <div className="font-semibold">All</div>
              <div className="text-xs opacity-70">{totalProductCount}</div>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <div className="font-semibold">{cat.name}</div>
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-1">
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* Add New Product Card */}
              <button
                onClick={() => setAddProductOpen(true)}
                className="product-card flex flex-col items-center justify-center p-6 min-h-[180px] border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-all rounded-lg"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Plus size={24} className="text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Add Product</span>
              </button>

              {productsLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="product-card h-[180px] animate-pulse bg-secondary/50 rounded-lg" />
                ))
              ) : products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package size={48} className="mb-3 opacity-30" />
                  <p className="text-lg font-medium">No products found</p>
                </div>
              ) : (
                products.map((product) => {
                  const cartItem = cart.find((i) => i.productId === product.id);
                  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
                  const discountPct = hasDiscount
                    ? Math.round((1 - Number(product.price) / Number(product.originalPrice!)) * 100)
                    : 0;

                  return (
                    <div
                      key={product.id}
                      className={`product-card flex flex-col rounded-lg border transition-all cursor-pointer ${
                        cartItem
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-card hover:shadow-md"
                      }`}
                      onClick={() => addToCart(product)}
                    >
                      {/* Product Image */}
                      <div className="relative h-32 bg-secondary/50 overflow-hidden rounded-t-lg">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={36} className="text-muted-foreground/30" />
                          </div>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            -{discountPct}%
                          </div>
                        )}
                        {product.stockQuantity <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                            <span className="text-white text-xs font-bold">Out of Stock</span>
                          </div>
                        )}
                        {cartItem && (
                          <div className="absolute bottom-2 right-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                            {cartItem.quantity}
                          </div>
                        )}
                      </div>
                      {/* Product Info */}
                      <div className="p-3 flex-1 flex flex-col">
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-2">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-auto">
                          {hasDiscount && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              KES {Number(product.originalPrice).toLocaleString()}
                            </span>
                          )}
                          <span className="text-sm font-bold text-primary">
                            KES {Number(product.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {/* Qty Controls (if in cart) */}
                      {cartItem && (
                        <div
                          className="flex items-center justify-center gap-2 px-2 pb-2 border-t border-border"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            onClick={() => updateQty(product.id, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{cartItem.quantity}</span>
                          <button
                            className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            onClick={() => updateQty(product.id, 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Order Summary Panel - Fixed Height */}
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col bg-card border-t lg:border-t-0 lg:border-l border-border">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border">
            <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
              <ShoppingCart size={18} />
              Order Summary
            </h2>
          </div>

          {/* Customer Selector */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Customer</p>
            <Select
              value={selectedCustomerId ? String(selectedCustomerId) : ""}
              onValueChange={(val) => {
                if (val === "walk-in") {
                  setSelectedCustomerId(null);
                  setSelectedCustomerName("Walk-in Customer");
                } else {
                  const cust = customers.find((c) => String(c.id) === val);
                  setSelectedCustomerId(cust?.id ?? null);
                  setSelectedCustomerName(cust?.name ?? "");
                }
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search customers..."
                    className="h-8 text-xs mb-1"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomerName && selectedCustomerName !== "Walk-in Customer" && (
              <div className="mt-2 p-2 bg-primary/10 rounded-lg">
                <p className="text-xs font-medium text-foreground">{selectedCustomerName}</p>
              </div>
            )}
          </div>

          {/* Cart Items - Scrollable */}
          <ScrollArea className="flex-1 px-4 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart size={40} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs">Click products to add items</p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-2 bg-secondary/30 rounded-lg">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs font-medium text-foreground line-clamp-2">{item.productName}</p>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {item.originalPrice && item.originalPrice > item.unitPrice && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] text-muted-foreground line-through">
                            KES {item.originalPrice.toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="text-[9px]">
                            {Math.round((1 - item.unitPrice / item.originalPrice) * 100)}% Off
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            onClick={() => updateQty(item.productId, -1)}
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            onClick={() => updateQty(item.productId, 1)}
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          KES {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Order Summary - Fixed at Bottom */}
          <div className="border-t border-border bg-card/50 p-4 space-y-3">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (16%)</span>
                <span className="font-medium">KES {taxAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold bg-primary/10 p-2 rounded-lg">
                <span>Total</span>
                <span className="text-primary">KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full h-12 text-base font-semibold"
                disabled={cart.length === 0}
                onClick={() => setPaymentDialogOpen(true)}
              >
                <Check size={18} className="mr-2" />
                Finish Order
              </Button>
              {cart.length > 0 && (
                <Button variant="outline" className="w-full h-10" onClick={clearCart}>
                  <X size={16} className="mr-2" />
                  Clear Cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        cart={cart}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        customerId={selectedCustomerId ?? undefined}
        customerName={selectedCustomerName || undefined}
        onComplete={handleOrderComplete}
      />

      <AddProductDialog
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
      />

      <ReceiptDialog
        open={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        orderId={receiptOrderId || 0}
        orderNumber={receiptOrderNumber}
      />
    </div>
  );
}
