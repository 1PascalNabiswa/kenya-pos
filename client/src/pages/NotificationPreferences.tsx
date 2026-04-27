import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface NotificationPreference {
  id: number;
  userId: number;
  notificationType: string;
  enabled: boolean;
  frequency: string;
}

const NOTIFICATION_TYPES = [
  {
    id: "low_stock_alert",
    label: "Low Stock Alerts",
    description: "Get notified when product stock falls below threshold",
    defaultFrequency: "instant",
  },
  {
    id: "large_transaction",
    label: "Large Transactions",
    description: "Get notified when a transaction exceeds a certain amount",
    defaultFrequency: "instant",
  },
  {
    id: "new_form_creation",
    label: "New Form Creations",
    description: "Get notified when a new form is created",
    defaultFrequency: "instant",
  },
  {
    id: "new_user_login",
    label: "New User Logins",
    description: "Get notified when a new user logs in",
    defaultFrequency: "instant",
  },
  {
    id: "payment_failure",
    label: "Payment Failures",
    description: "Get notified when a payment transaction fails",
    defaultFrequency: "instant",
  },
  {
    id: "daily_summary",
    label: "Daily Summaries",
    description: "Get a daily summary of key metrics and activities",
    defaultFrequency: "daily",
  },
];

export function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getPreferencesQuery = trpc.notificationPreferences.getPreferences.useQuery();
  const updatePreferenceMutation = trpc.notificationPreferences.updatePreference.useMutation();

  useEffect(() => {
    if (getPreferencesQuery.data) {
      const prefs: Record<string, NotificationPreference> = {};
      getPreferencesQuery.data.forEach((pref: NotificationPreference) => {
        prefs[pref.notificationType] = pref;
      });
      setPreferences(prefs);
      setLoading(false);
    }
  }, [getPreferencesQuery.data]);

  const handleToggle = async (notificationType: string, enabled: boolean) => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentPref = preferences[notificationType];
      await updatePreferenceMutation.mutateAsync({
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

      setSuccessMessage(`${notificationType.replace(/_/g, " ")} notification ${enabled ? "enabled" : "disabled"}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Failed to update notification preference: ${error}`);
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

      setSuccessMessage(`Notification frequency updated to ${frequency}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Failed to update notification frequency: ${error}`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-2 text-gray-600">Customize which notifications you receive and how often</p>
      </div>

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

      <div className="grid gap-4">
        {NOTIFICATION_TYPES.map((notificationType) => {
          const pref = preferences[notificationType.id];
          const isEnabled = pref?.enabled ?? true;
          const frequency = pref?.frequency ?? notificationType.defaultFrequency;

          return (
            <Card key={notificationType.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{notificationType.label}</CardTitle>
                    <CardDescription>{notificationType.description}</CardDescription>
                  </div>
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      handleToggle(notificationType.id, checked as boolean)
                    }
                    disabled={saving}
                    className="mt-1"
                  />
                </div>
              </CardHeader>

              {isEnabled && (
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Frequency</label>
                      <div className="mt-2 flex gap-2">
                        {["instant", "daily", "weekly"].map((freq) => (
                          <Button
                            key={freq}
                            variant={frequency === freq ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFrequencyChange(notificationType.id, freq)}
                            disabled={saving}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">About Notification Frequencies</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Instant:</strong> You will receive notifications immediately when the event occurs
          </p>
          <p>
            <strong>Daily:</strong> You will receive a summary notification once per day at 8:00 AM
          </p>
          <p>
            <strong>Weekly:</strong> You will receive a summary notification once per week on Monday at 8:00 AM
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
