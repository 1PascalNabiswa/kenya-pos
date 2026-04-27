import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Bell } from "lucide-react";

interface NotificationPreference {
  userId: number;
  notificationType: string;
  enabled: boolean;
  frequency: string;
}

interface AdminNotificationPreferencesProps {
  userId: number;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTIFICATION_TYPES = [
  { id: "low_stock_alert", label: "Low Stock Alerts" },
  { id: "large_transaction", label: "Large Transactions" },
  { id: "new_form_creation", label: "New Form Creations" },
  { id: "new_user_login", label: "New User Logins" },
  { id: "payment_failure", label: "Payment Failures" },
  { id: "daily_summary", label: "Daily Summaries" },
];

export function AdminNotificationPreferences({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
}: AdminNotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getUserPreferencesQuery = trpc.notificationPreferences.getUserPreferencesById.useQuery(
    { userId },
    { enabled: open }
  );
  const updatePreferenceMutation = trpc.notificationPreferences.adminUpdateUserPreference.useMutation();

  // Load preferences when dialog opens
  if (open && getUserPreferencesQuery.data && loading) {
    const prefs: Record<string, NotificationPreference> = {};
    getUserPreferencesQuery.data.forEach((pref: NotificationPreference) => {
      prefs[pref.notificationType] = pref;
    });
    setPreferences(prefs);
    setLoading(false);
  }

  const handleToggle = async (notificationType: string, enabled: boolean) => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentPref = preferences[notificationType];
      await updatePreferenceMutation.mutateAsync({
        userId,
        notificationType: notificationType as any,
        enabled,
        frequency: currentPref?.frequency || "instant",
      });

      setPreferences((prev) => ({
        ...prev,
        [notificationType]: {
          ...prev[notificationType],
          enabled,
        },
      }));

      setSuccessMessage(`Preference updated for ${notificationType.replace(/_/g, " ")}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Failed to update preference: ${error}`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleFrequencyChange = async (notificationType: string, frequency: string) => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentPref = preferences[notificationType];
      await updatePreferenceMutation.mutateAsync({
        userId,
        notificationType: notificationType as any,
        enabled: currentPref?.enabled ?? true,
        frequency: frequency as any,
      });

      setPreferences((prev) => ({
        ...prev,
        [notificationType]: {
          ...prev[notificationType],
          frequency,
        },
      }));

      setSuccessMessage(`Frequency updated to ${frequency}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Failed to update frequency: ${error}`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Manage Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Configure notifications for {userName} ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {NOTIFICATION_TYPES.map((notificationType) => {
                const pref = preferences[notificationType.id];
                const isEnabled = pref?.enabled ?? true;
                const frequency = pref?.frequency ?? "instant";

                return (
                  <Card key={notificationType.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notificationType.label}</p>
                      </div>
                      <Checkbox
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          handleToggle(notificationType.id, checked as boolean)
                        }
                        disabled={saving}
                      />
                    </div>

                    {isEnabled && (
                      <div className="flex gap-2 mt-2">
                        {["instant", "daily", "weekly"].map((freq) => (
                          <Button
                            key={freq}
                            variant={frequency === freq ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFrequencyChange(notificationType.id, freq)}
                            disabled={saving}
                            className="text-xs"
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
