import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Users, Phone, Mail, MapPin, ShoppingBag, ChevronRight } from "lucide-react";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.customers.list.useQuery({ search: search || undefined, page, limit: 20 });
  const { data: history } = trpc.customers.purchaseHistory.useQuery(
    { customerId: viewCustomer?.id ?? 0 },
    { enabled: !!viewCustomer }
  );

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer added"); setAddOpen(false); setForm({ name: "", phone: "", email: "", address: "", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer updated"); setEditCustomer(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const customers = data?.items ?? [];
  const total = data?.total ?? 0;

  const openEdit = (c: any) => {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }
    if (editCustomer) {
      updateCustomer.mutate({ id: editCustomer.id, ...form });
    } else {
      createCustomer.mutate(form);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{total} registered customers</p>
        </div>
        <Button onClick={() => { setEditCustomer(null); setForm({ name: "", phone: "", email: "", address: "", notes: "" }); setAddOpen(true); }}>
          <Plus size={16} className="mr-2" /> Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
        <Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 font-medium">Customer</th>
              <th className="text-left p-3 font-medium">Contact</th>
              <th className="text-right p-3 font-medium">Total Spent</th>
              <th className="text-right p-3 font-medium">Loyalty Pts</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="p-3"><div className="h-8 bg-secondary/50 rounded animate-pulse" /></td></tr>
              ))
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p>No customers found</p>
              </td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      {c.address && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{c.address}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="space-y-0.5">
                    {c.phone && <p className="text-xs flex items-center gap-1"><Phone size={10} /> {c.phone}</p>}
                    {c.email && <p className="text-xs flex items-center gap-1 text-muted-foreground"><Mail size={10} /> {c.email}</p>}
                  </div>
                </td>
                <td className="p-3 text-right font-medium">KES {Number(c.totalSpent).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <Badge variant="secondary" className="text-[10px]">{c.loyaltyPoints} pts</Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewCustomer(c)}>
                      <ChevronRight size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                      <Edit size={13} />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Delete customer "${c.name}"?`)) deleteCustomer.mutate({ id: c.id }); }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
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

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) { setAddOpen(false); setEditCustomer(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Kamau" className="mt-1" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="07xx xxx xxx" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Westlands, Nairobi" className="mt-1" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 h-16" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditCustomer(null); }} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createCustomer.isPending || updateCustomer.isPending}>
                {editCustomer ? "Update" : "Add Customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={!!viewCustomer} onOpenChange={() => setViewCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewCustomer?.name}</DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="font-bold text-lg">KES {Number(viewCustomer.totalSpent).toLocaleString()}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Loyalty Points</p>
                  <p className="font-bold text-lg">{viewCustomer.loyaltyPoints}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                {viewCustomer.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground" /> {viewCustomer.phone}</p>}
                {viewCustomer.email && <p className="flex items-center gap-2"><Mail size={14} className="text-muted-foreground" /> {viewCustomer.email}</p>}
                {viewCustomer.address && <p className="flex items-center gap-2"><MapPin size={14} className="text-muted-foreground" /> {viewCustomer.address}</p>}
              </div>
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2"><ShoppingBag size={14} /> Purchase History</p>
                <ScrollArea className="h-48">
                  {history?.items && history.items.length > 0 ? (
                    <div className="space-y-1.5">
                      {history.items.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-xs">
                          <div>
                            <p className="font-mono font-medium">{order.orderNumber}</p>
                            <p className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-KE")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">KES {Number(order.totalAmount).toLocaleString()}</p>
                            <span className={`status-${order.paymentStatus}`}>{order.paymentStatus}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6 text-xs">No purchase history</p>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
