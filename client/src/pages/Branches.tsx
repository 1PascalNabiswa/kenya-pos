import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, MapPin, Phone, Edit, Trash2, Power } from "lucide-react";

export default function Branches() {
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
  });

  const { data: branchesData, refetch } = trpc.branches.list.useQuery();
  const createMutation = trpc.branches.create.useMutation();
  const updateMutation = trpc.branches.update.useMutation();
  const deleteMutation = trpc.branches.delete.useMutation();
  const setActiveMutation = trpc.branches.setActive.useMutation();

  const branches = branchesData ?? [];

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter branch name");
      return;
    }

    try {
      if (editingBranch) {
        await updateMutation.mutateAsync({ id: editingBranch.id, ...formData });
        toast.success("Branch updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Branch created successfully");
      }
      setFormData({ name: "", location: "", phone: "" });
      setEditingBranch(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create branch"
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Delete this inactive branch? Deletion is only possible when it has no sales, staff, or stock transfer history."
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Branch deleted successfully");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete branch"
      );
    }
  };

  const handleToggleActive = async (branch: any) => {
    try {
      await setActiveMutation.mutateAsync({
        id: branch.id,
        isActive: !branch.isActive,
      });
      toast.success(
        branch.isActive ? "Branch deactivated" : "Branch reactivated"
      );
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to change branch status"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">
            Manage multiple business locations
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} /> New Branch
        </Button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No branches created yet
          </div>
        ) : (
          branches.map((branch: any) => (
            <div
              key={branch.id}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-lg">{branch.name}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    branch.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {branch.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {branch.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} />
                    {branch.location}
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={14} />
                    {branch.phone}
                  </div>
                )}
                {branch.manager && (
                  <div className="text-muted-foreground">
                    Manager: {branch.manager}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Created {new Date(branch.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${branch.name}`}
                    onClick={() => {
                      setEditingBranch(branch);
                      setFormData({
                        name: branch.name,
                        location: branch.location ?? "",
                        phone: branch.phone ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                      branch.isActive
                        ? `Deactivate ${branch.name}`
                        : `Reactivate ${branch.name}`
                    }
                    title={
                      branch.isActive
                        ? "Deactivate branch"
                        : "Reactivate branch"
                    }
                    onClick={() => handleToggleActive(branch)}
                    disabled={setActiveMutation.isPending}
                  >
                    <Power
                      size={14}
                      className={
                        branch.isActive ? "text-amber-600" : "text-emerald-600"
                      }
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${branch.name}`}
                    onClick={() => handleDelete(branch.id)}
                    disabled={deleteMutation.isPending || branch.isActive}
                    title={
                      branch.isActive
                        ? "Deactivate the branch before deleting it"
                        : "Delete branch"
                    }
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? "Edit Branch" : "Create New Branch"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Branch Name *
              </label>
              <Input
                placeholder="e.g., Westlands Branch"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                placeholder="e.g., Westlands, Nairobi"
                value={formData.location}
                onChange={e =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Phone Number
              </label>
              <Input
                placeholder="+254 712 345 678"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingBranch
                    ? "Save Changes"
                    : "Create Branch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
