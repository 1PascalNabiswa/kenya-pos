import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, MapPin, Phone } from "lucide-react";

export default function Branches() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", location: "", phone: "" });

  const { data: branchesData, refetch } = trpc.branches.list.useQuery();
  const createMutation = trpc.branches.create.useMutation();

  const branches = branchesData ?? [];

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter branch name");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Branch created successfully");
      setFormData({ name: "", location: "", phone: "" });
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to create branch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage multiple business locations</p>
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
            <div key={branch.id} className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-3">{branch.name}</h3>
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
              <div className="mt-4 text-xs text-muted-foreground">
                Created {new Date(branch.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Branch Name *</label>
              <Input
                placeholder="e.g., Westlands Branch"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                placeholder="e.g., Westlands, Nairobi"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Branch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
