import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeactivationAlertProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export function DeactivationAlert({
  isOpen,
  onConfirm,
}: DeactivationAlertProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <DialogTitle>Account Deactivated</DialogTitle>
          </div>
          <DialogDescription className="mt-4 text-base">
            Your account has been deactivated by an administrator. You will be
            logged out now. Please contact an administrator if you believe this
            is an error.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
