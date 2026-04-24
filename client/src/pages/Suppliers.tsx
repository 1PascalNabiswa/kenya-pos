import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Mail, Phone, Edit2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Suppliers() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", phoneNumber: "", email: "" });

  const { data: suppliersData, refetch } = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation();
  const updateMutation = trpc.suppliers.update.useMutation();
  const deleteMutation = trpc.suppliers.delete.useMutation();

  const suppliers = suppliersData ?? [];

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter supplier name");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Supplier added successfully");
      setFormData({ name: "", phoneNumber: "", email: "" });
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to add supplier");
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingId(supplier.id);
    setFormData({ name: supplier.name, phoneNumber: supplier.phoneNumber || "", email: supplier.email || "" });
    setOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name) {
      toast.error("Please enter supplier name");
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: editingId!, name: formData.name, email: formData.email });
      toast.success("Supplier updated successfully");
      setFormData({ name: "", phoneNumber: "", email: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update supplier");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: deletingId! });
      toast.success("Supplier deleted successfully");
      setDeleteOpen(false);
      setDeletingId(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", phoneNumber: "", email: "" });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage vendor and supplier information</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="gap-2"
        >
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
                <th className="px-6 py-3 text-left text-sm font-semibold">Added Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
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
                      {supplier.phoneNumber ? (
                        <a href={`tel:${supplier.phoneNumber}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                          <Phone size={14} />
                          {supplier.phoneNumber}
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
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(supplier.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          className="gap-1"
                        >
                          <Edit2 size={14} /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingId(supplier.id);
                            setDeleteOpen(true);
                          }}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Supplier Name *</label>
              <Input
                placeholder="e.g., Fresh Produce Ltd"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <Input
                placeholder="+254 712 345 678"
                value={formData.phoneNumber || ""}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="supplier@example.com"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                    ? "Update Supplier"
                    : "Add Supplier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
