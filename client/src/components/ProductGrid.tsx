import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Eye, EyeOff, Search, User, X, Wallet } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
  category?: string;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  wallet_balance?: number;
}

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (category: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: Product) => void;
  customers?: Customer[];
  selectedCustomer?: Customer | null;
  onSelectCustomer?: (customer: Customer | null) => void;
}

function getCategoryCount(products: Product[], categoryId: number | null): number {
  if (categoryId === null) return products.length;
  return products.filter((p) => p.categoryId === categoryId).length;
}

export default function ProductGrid({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddToCart,
  customers = [],
  selectedCustomer = null,
  onSelectCustomer = () => {},
}: ProductGridProps) {
  const [showImages, setShowImages] = useState(true);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
  );
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top controls: Customer Type | Search | Toggle */}
      <div className="flex gap-2 mb-4 items-center">
        {/* Customer Selector */}
        {selectedCustomer ? (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium truncate">{selectedCustomer.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-primary flex-shrink-0">
              <Wallet className="w-3.5 h-3.5" />
              KES {(selectedCustomer.wallet_balance || 0).toLocaleString()}
            </div>
            <button
              onClick={() => onSelectCustomer(null)}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-xs font-medium whitespace-nowrap bg-primary text-primary-foreground hover:opacity-90 transition-all rounded-lg px-3 py-2 flex-shrink-0">
                <User className="w-4 h-4" />
                <span>Walk-in</span>
                <span className="text-xs opacity-75">Change</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <Input
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="mb-2 text-xs"
              />
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      setCustomerSearchOpen(false);
                      setCustomerSearch("");
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-left text-xs"
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-muted-foreground text-xs">{c.phone}</p>
                    </div>
                    <span className="font-medium text-primary text-xs flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      KES {(c.wallet_balance || 0).toLocaleString()}
                    </span>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No customers found
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full bg-background text-foreground font-medium border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        {/* Show/Hide Images Toggle */}
        <button
          onClick={() => setShowImages(!showImages)}
          className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all bg-card border border-border text-muted-foreground hover:bg-muted flex items-center gap-2"
          title={showImages ? "Hide images" : "Show images"}
        >
          {showImages ? (
            <>
              <EyeOff size={14} />
              Hide
            </>
          ) : (
            <>
              <Eye size={14} />
              Show
            </>
          )}
        </button>
      </div>
      
      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          All <span className="text-xs opacity-75">({getCategoryCount(products, null)})</span>
        </button>
        {categories.map((cat) => {
          const count = getCategoryCount(products, cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.name} <span className="text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {products
            .filter((p) => {
              const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchCat = selectedCategory === null || p.categoryId === selectedCategory;
              return matchSearch && matchCat;
            })
            .map((product) => (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
              className="bg-card border border-border rounded-xl p-3 text-left hover:shadow-md hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {showImages && (
                <div className="w-full aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
              )}
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {product.name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-primary">
                  KES {product.price?.toLocaleString()}
                </span>
                <span
                  className={`text-xs ${
                    product.stock <= 5 ? "text-red-500" : "text-muted-foreground"
                  }`}
                >
                  {product.stock} left
                </span>
              </div>
            </button>
          ))}
        </div>
        {products.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No products found
          </div>
        )}
      </div>
    </div>
  );
}
