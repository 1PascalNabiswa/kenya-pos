import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";


interface CreditAccount {
  id: number;
  studentName: string;
  studentId: string;
  balance: number;
  totalCredit: number;
  totalPaid: number;
  status: "active" | "settled" | "suspended";
}

interface CreditAccountModalProps {
  account: CreditAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreditAccountModal({
  account,
  isOpen,
  onClose,
  onSuccess,
}: CreditAccountModalProps) {

  const [balance, setBalance] = useState(account?.balance.toString() || "0");
  const [totalCredit, setTotalCredit] = useState(
    account?.totalCredit.toString() || "0"
  );
  const [totalPaid, setTotalPaid] = useState(
    account?.totalPaid.toString() || "0"
  );
  const [status, setStatus] = useState(account?.status || "active");
  const [isLoading, setIsLoading] = useState(false);

  const updateMutation = trpc.credit.update.useMutation();

  const handleSave = async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      await updateMutation.mutateAsync({
        id: account.id,
        balance: parseFloat(balance),
        totalCredit: parseFloat(totalCredit),
        totalPaid: parseFloat(totalPaid),
        status: status as "active" | "settled" | "suspended",
      });

alert("Credit account updated successfully");

      onSuccess();
      onClose();
    } catch (error) {
alert("Error: " + (error instanceof Error ? error.message : "Failed to update account"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Credit Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Student Name</Label>
            <Input value={account?.studentName || ""} disabled />
          </div>

          <div>
            <Label className="text-sm font-medium">Student ID</Label>
            <Input value={account?.studentId || ""} disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="balance" className="text-sm font-medium">
                Balance (KES)
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="totalCredit" className="text-sm font-medium">
                Total Credit (KES)
              </Label>
              <Input
                id="totalCredit"
                type="number"
                step="0.01"
                value={totalCredit}
                onChange={(e) => setTotalCredit(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalPaid" className="text-sm font-medium">
              Total Paid (KES)
            </Label>
            <Input
              id="totalPaid"
              type="number"
              step="0.01"
              value={totalPaid}
              onChange={(e) => setTotalPaid(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
