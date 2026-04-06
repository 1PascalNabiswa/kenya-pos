import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Mail, Phone } from "lucide-react";

export default function Suppliers() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

  const { data: suppliersData, refetch } = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation();

  const suppliers = suppliersData ?? [];

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter supplier name");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Supplier added successfully");
      setFormData({ name: "", phone: "", email: "" });
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to add supplier");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage vendor and supplier information</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} /> Add Supplier
        </Button>
      </div>

      {/* Suppliers Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Supplier Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Payment Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Added Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No suppliers added yet
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier: any) => (
                  <tr key={supplier.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{supplier.name}</td>
                    <td className="px-6 py-4">
                      {supplier.phone ? (
                        <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                          <Phone size={14} />
                          {supplier.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                          <Mail size={14} />
                          {supplier.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={supplier.paymentStatus === "paid" ? "secondary" : "outline"}>
                        {supplier.paymentStatus || "pending"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(supplier.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Supplier Name *</label>
              <Input
                placeholder="e.g., Fresh Produce Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <Input
                placeholder="+254 712 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="supplier@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Supplier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
