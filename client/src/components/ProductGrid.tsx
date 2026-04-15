import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
  category?: string;
}

interface ProductGridProps {
  products: Product[];
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddToCart,
}: ProductGridProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
              className="bg-card border border-border rounded-xl p-3 text-left hover:shadow-md hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
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
