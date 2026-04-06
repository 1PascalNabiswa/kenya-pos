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
  ChevronRight, Printer
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
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

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
    setPaymentDialogOpen(false);
    setReceiptDialogOpen(true);
    clearCart();
  };

  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Category counts
  const totalProductCount = productsData?.total ?? 0;

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden gap-4 lg:gap-0">
      {/* Center: Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden lg:border-r border-border">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border bg-card">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Sales Transaction</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <Input
                placeholder="Search..."
                className="pl-9 w-full sm:w-64 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-card/50 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <div className="font-semibold">All Products</div>
            <div className="text-xs opacity-70">{totalProductCount} items</div>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <div className="font-semibold">{cat.name}</div>
              <div className="text-xs opacity-70">items</div>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1">
          <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {/* Add New Product Card */}
            <button
              onClick={() => setAddProductOpen(true)}
              className="product-card flex flex-col items-center justify-center p-6 min-h-[160px] border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Plus size={20} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Add New Product</span>
            </button>

            {productsLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="product-card h-[160px] animate-pulse bg-secondary/50" />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-4 flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package size={40} className="mb-3 opacity-30" />
                <p>No products found</p>
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
                    className={`product-card flex flex-col ${cartItem ? "selected" : ""}`}
                    onClick={() => addToCart(product)}
                  >
                    {/* Product Image */}
                    <div className="relative h-28 bg-secondary/50 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-muted-foreground/30" />
                        </div>
                      )}
                      {hasDiscount && (
                        <div className="absolute top-1.5 right-1.5 badge-discount">
                          {discountPct}% Off
                        </div>
                      )}
                      {product.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Out of Stock</span>
                        </div>
                      )}
                      {cartItem && (
                        <div className="absolute bottom-1.5 right-1.5 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {cartItem.quantity}
                        </div>
                      )}
                    </div>
                    {/* Product Info */}
                    <div className="p-2.5 flex-1">
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-1">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasDiscount && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            KES {Number(product.originalPrice).toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs font-bold text-primary">
                          KES {Number(product.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* Qty Controls (if in cart) */}
                    {cartItem && (
                      <div
                        className="flex items-center justify-between px-2 pb-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          onClick={() => updateQty(product.id, -1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-bold">{cartItem.quantity}</span>
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

      {/* Right: Order Panel */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-card border-t lg:border-t-0 lg:border-l border-border">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Detail Order</h2>
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
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Type or Select Customer" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search customers..."
                  className="h-7 text-xs mb-1"
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
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 px-4 py-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ShoppingCart size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Click products to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Your order:</p>
              {cart.map((item) => (
                <div key={item.productId} className="cart-item">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-medium text-foreground line-clamp-2">{item.productName}</p>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {item.originalPrice && item.originalPrice > item.unitPrice && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-muted-foreground line-through">
                          KES {item.originalPrice.toLocaleString()}
                        </span>
                        <span className="badge-discount text-[9px]">
                          {Math.round((1 - item.unitPrice / item.originalPrice) * 100)}% Off
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
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

        {/* Order Summary */}
        <div className="px-4 py-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({cartItemCount})</span>
            <span className="font-medium">KES {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT (16%)</span>
            <span className="font-medium">KES {taxAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total Payment</span>
            <span className="text-primary">KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Payment Method & Action */}
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Payment method: <span className="text-destructive">*</span>
            </p>
          </div>
          <Button
            className="w-full h-11 text-sm font-semibold"
            disabled={cart.length === 0}
            onClick={() => setPaymentDialogOpen(true)}
          >
            <ShoppingCart size={16} className="mr-2" />
            Make Order
            <ChevronRight size={16} className="ml-auto" />
          </Button>
          {cart.length > 0 && (
            <Button variant="outline" size="sm" className="w-full" onClick={clearCart}>
              Clear Cart
            </Button>
          )}
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

      {lastOrderId && (
        <ReceiptDialog
          open={receiptDialogOpen}
          onClose={() => setReceiptDialogOpen(false)}
          orderId={lastOrderId}
          orderNumber={lastOrderNumber}
        />
      )}

      <AddProductDialog
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
      />
    </div>
  );
}
