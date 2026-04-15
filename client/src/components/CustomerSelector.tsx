import { useState } from "react";
import { User, X, Wallet } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  wallet_balance?: number;
}

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export default function CustomerSelector({
  customers,
  selectedCustomer,
  onSelect,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="mb-4">
      {selectedCustomer ? (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
          <User className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <span className="text-sm font-medium">{selectedCustomer.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {selectedCustomer.phone}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            <Wallet className="w-3.5 h-3.5" />
            KES {(selectedCustomer.wallet_balance || 0).toLocaleString()}
          </div>
          <button
            onClick={() => onSelect(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-4 py-2.5 w-full sm:w-auto transition-colors">
              <User className="w-4 h-4" />
              <span>Walk-in Customer</span>
              <span className="text-xs text-primary ml-1">Change</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  <span className="text-xs font-medium text-primary">
                    KES {(c.wallet_balance || 0).toLocaleString()}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No customers found
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
