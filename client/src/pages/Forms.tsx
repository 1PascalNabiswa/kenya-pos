import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  not_issued: "bg-gray-100 text-gray-800",
  issued_not_approved: "bg-yellow-100 text-yellow-800",
  issued_approved: "bg-blue-100 text-blue-800",
  submitted_for_payment: "bg-purple-100 text-purple-800",
  pending_payment: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
};

export default function Forms() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", code: "", amount: "", servingDate: "" });
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: formsData, refetch } = trpc.forms.list.useQuery();
  const createMutation = trpc.forms.create.useMutation();
  const updateMutation = trpc.forms.updateStatus.useMutation();
  const editMutation = trpc.forms.update.useMutation();

  const forms = formsData ?? [];

  // Generate auto code
  const generateCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `FORM-${timestamp}-${random}`;
  };

  // Filter forms by month and status
  const filteredForms = useMemo(() => {
    return forms.filter((form: any) => {
      let matchesMonth = true;
      let matchesStatus = true;

      if (filterMonth) {
        const servingDate = form.servingDate ? new Date(form.servingDate) : null;
        if (servingDate) {
          const formMonth = `${servingDate.getFullYear()}-${String(servingDate.getMonth() + 1).padStart(2, "0")}`;
          matchesMonth = formMonth === filterMonth;
        } else {
          matchesMonth = false;
        }
      }

      if (filterStatus) {
        matchesStatus = form.status === filterStatus;
      }

      return matchesMonth && matchesStatus;
    });
  }, [forms, filterMonth, filterStatus]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: "", code: generateCode(), amount: "", servingDate: "" });
    setOpen(true);
  };

  const handleOpenEdit = (form: any) => {
    setEditingId(form.id);
    setFormData({
      title: form.title,
      code: form.code,
      amount: form.amount.toString(),
      servingDate: form.servingDate ? new Date(form.servingDate).toISOString().slice(0, 16) : "",
    });
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.code || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        code: formData.code,
        amount: parseFloat(formData.amount),
      };
      if (formData.servingDate) {
        payload.servingDate = new Date(formData.servingDate);
      }

      if (editingId) {
        await editMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("Form updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Form created successfully");
      }

      setFormData({ title: "", code: "", amount: "", servingDate: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error(editingId ? "Failed to update form" : "Failed to create form");
    }
  };

  const handleStatusChange = async (formId: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id: formId, status: newStatus });
      toast.success("Form status updated");
      refetch();
    } catch (error) {
      toast.error("Failed to update form");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Group Feeding Forms</h1>
          <p className="text-muted-foreground">Manage pre-agreed budget forms for group feeding</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> New Form
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <h3 className="font-semibold">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Serving Month</label>
            <Input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              placeholder="Select month"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filterStatus || "all"} onValueChange={(val) => setFilterStatus(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="not_issued">Not Issued</SelectItem>
                <SelectItem value="issued_not_approved">Issued (Not Approved)</SelectItem>
                <SelectItem value="issued_approved">Issued (Approved)</SelectItem>
                <SelectItem value="submitted_for_payment">Submitted</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Amount</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Spent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Serving Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No forms created yet
                  </td>
                </tr>
              ) : (
                filteredForms.map((form: any) => (
                  <tr key={form.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{form.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{form.code}</td>
                    <td className="px-6 py-4 text-right font-semibold">KES {Number(form.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm">KES {Number(form.spent || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {form.servingDate ? new Date(form.servingDate).toLocaleString() : "Not set"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[form.status] || "bg-gray-100 text-gray-800"}>
                        {form.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(form)}
                          disabled={editMutation.isPending}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Select value={form.status} onValueChange={(val) => handleStatusChange(form.id, val)} disabled={updateMutation.isPending}>
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_issued">Not Issued</SelectItem>
                            <SelectItem value="issued_not_approved">Issued (Not Approved)</SelectItem>
                            <SelectItem value="issued_approved">Issued (Approved)</SelectItem>
                            <SelectItem value="submitted_for_payment">Submitted</SelectItem>
                            <SelectItem value="pending_payment">Pending Payment</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Form" : "Create New Form"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Form Title</label>
              <Input
                placeholder="e.g., Team Lunch - March 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Form Code (Auto-generated)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Auto-generated code"
                  value={formData.code}
                  readOnly
                  className="bg-muted"
                />
                {!editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, code: generateCode() })}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Budget Amount (KES)</label>
              <Input
                type="number"
                placeholder="5000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Serving Date (Optional)</label>
              <Input
                type="datetime-local"
                value={formData.servingDate}
                onChange={(e) => setFormData({ ...formData, servingDate: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
