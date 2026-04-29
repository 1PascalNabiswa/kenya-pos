import { useState, useCallback, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Cart from "@/components/Cart";
import CustomerSelector from "@/components/CustomerSelector";
import ProductGrid from "@/components/ProductGrid";
import PaymentDialog from "@/components/PaymentDialog";
import ReceiptDialog from "@/components/ReceiptDialog";

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  wallet_balance?: number;
}

export default function SalesTransaction() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
  const [receiptOrderNumber, setReceiptOrderNumber] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [taxRate, setTaxRate] = useState(0.16); // Default 16% VAT
  const [printAutomatic, setPrintAutomatic] = useState(false);
  const [receiptRollSize, setReceiptRollSize] = useState("76");

  // Fetch data
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const { data: productsData } = trpc.products.list.useQuery({
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
    isActive: true,
    limit: 100,
  });
  const { data: customersData } = trpc.customers.list.useQuery({
    search: customerSearch || undefined,
    limit: 20,
  });
  const { data: settingsData } = trpc.settings.getAll.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();

  // Update tax rate and print settings when settings change
  useEffect(() => {
    if (settingsData) {
      const taxRateSetting = settingsData.find((s: any) => s.key === "tax_rate")?.value;
      if (taxRateSetting) {
        setTaxRate(Number(taxRateSetting) / 100);
      }
      const printAutomaticSetting = settingsData.find((s: any) => s.key === "print_automatic")?.value;
      setPrintAutomatic(printAutomaticSetting === "true");
      const rollSizeSetting = settingsData.find((s: any) => s.key === "receipt_roll_size")?.value;
      if (rollSizeSetting) {
        setReceiptRollSize(rollSizeSetting);
      }
    }
  }, [settingsData]);

  // Transform data
  const categories = useMemo(
    () =>
      categoriesData?.map((c) => ({
        id: c.id,
        name: c.name,
      })) || [],
    [categoriesData]
  );

  const products = useMemo(
    () =>
      productsData?.items?.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        stock: p.stockQuantity ?? 0,
        image_url: p.imageUrl,
        category: p.category?.name,
        categoryId: p.categoryId,
      })) || [],
    [productsData]
  );

  const customers = useMemo(
    () =>
      customersData?.items?.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        wallet_balance: c.walletBalance ?? 0,
      })) || [],
    [customersData]
  );

  // Cart calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const taxAmount = useMemo(() => subtotal * taxRate, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  // Cart operations
  const addToCart = useCallback((product: (typeof products)[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: i.price * (i.quantity + 1) }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ];
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const updateQuantity = useCallback((productId: number, change: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product_id === productId
            ? {
                ...i,
                quantity: Math.max(0, i.quantity + change),
                subtotal: i.price * Math.max(0, i.quantity + change),
              }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setPaymentDialogOpen(true);
  }, [cart.length]);

  const handlePaymentSuccess = useCallback(
    (orderId: number, orderNumber: string) => {
      setPaymentDialogOpen(false);
      setReceiptOrderId(orderId);
      setReceiptOrderNumber(orderNumber);
      setShowReceiptDialog(true);
      setCart([]);
      setSelectedCustomer(null);
    },
    []
  );

  const handleReceiptClose = useCallback(() => {
    setShowReceiptDialog(false);
    setReceiptOrderId(null);
    setReceiptOrderNumber("");
  }, []);

  return (
    <div className="h-screen flex flex-col lg:flex-row gap-2 p-2 min-h-0">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Customer Selector */}
        <CustomerSelector
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
        />

        {/* Product Grid */}
        <ProductGrid
          products={products}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
          }))}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={addToCart}
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
        />
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 lg:max-w-96 lg:flex-shrink-0 flex flex-col min-h-0 h-full">
        <Cart
          items={cart}
          total={total}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Payment Dialog */}
      {paymentDialogOpen && (
        <PaymentDialog
          open={true}
          customerId={selectedCustomer?.id}
          customerName={selectedCustomer?.name}
          total={total}
          subtotal={subtotal}
          taxAmount={taxAmount}
          cart={cart.map(item => ({
            productId: item.product_id,
            productName: item.product_name,
            unitPrice: item.price,
            quantity: item.quantity,
          }))}
          onClose={() => setPaymentDialogOpen(false)}
          onComplete={handlePaymentSuccess}
        />
      )}

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceiptDialog}
        orderId={receiptOrderId || 0}
        orderNumber={receiptOrderNumber}
        onClose={handleReceiptClose}
        autoPrint={printAutomatic}
        rollSize={receiptRollSize}
      />
    </div>
  );
}
