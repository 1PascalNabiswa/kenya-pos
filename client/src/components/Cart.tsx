import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (productId: number, change: number) => void;
  onRemove: (productId: number) => void;
  onCheckout: () => void;
}

export default function Cart({
  items,
  total,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: CartProps) {
  return (
    <div className="w-full lg:w-96 bg-card border border-border rounded-xl flex flex-col h-screen lg:h-auto lg:max-h-[calc(100vh-2rem)]">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2 flex-shrink-0">
        <ShoppingBag className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Cart</h3>
        <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <ShoppingBag className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  KES {item.price.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateQuantity(item.product_id, -1)}
                  className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-7 text-center text-sm font-semibold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.product_id, 1)}
                  className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  KES {item.subtotal.toLocaleString()}
                </p>
                <button
                  onClick={() => onRemove(item.product_id)}
                  className="text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-4 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="font-semibold">KES {total.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">KES {total.toLocaleString()}</span>
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Complete Order
        </Button>
      </div>
    </div>
  );
}
