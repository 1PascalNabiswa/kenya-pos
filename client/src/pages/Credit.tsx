import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function Credit() {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("active");
  const [formData, setFormData] = useState({ studentName: "", studentId: "" });

  const { data: creditData, refetch } = trpc.credit.list.useQuery({ status: selectedStatus });
  const createMutation = trpc.credit.create.useMutation();

  const credits = creditData ?? [];

  const handleCreate = async () => {
    if (!formData.studentName) {
      toast.error("Please enter student name");
      return;
    }

    try {
      await createMutation.mutateAsync({
        studentName: formData.studentName,
        studentId: formData.studentId || undefined,
      });
      toast.success("Credit account created");
      setFormData({ studentName: "", studentId: "" });
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to create credit account");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit System</h1>
          <p className="text-muted-foreground">Manage student credit accounts</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} /> Add Student
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {["active", "settled", "suspended"].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            onClick={() => setSelectedStatus(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Credits Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Student Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Balance</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Total Credit</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Total Paid</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {credits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No credit accounts found
                  </td>
                </tr>
              ) : (
                credits.map((credit: any) => (
                  <tr key={credit.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{credit.studentName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{credit.studentId || "-"}</td>
                    <td className="px-6 py-4 text-right font-semibold">KES {Number(credit.balance).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">KES {Number(credit.totalCredit).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">KES {Number(credit.totalPaid).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          credit.status === "active"
                            ? "default"
                            : credit.status === "settled"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {credit.status}
                      </Badge>
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
            <DialogTitle>Add Student to Credit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Student Name *</label>
              <Input
                placeholder="John Doe"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Student ID</label>
              <Input
                placeholder="STU-001"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Add Student"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
