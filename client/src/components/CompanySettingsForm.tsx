import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export const CompanySettingsForm: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    logo: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch company settings from database
  const { data: settings, isLoading: isLoadingSettings } = trpc.companySettings.get.useQuery();
  const saveSettings = trpc.companySettings.set.useMutation({
    onSuccess: () => {
      toast.success("Company settings saved successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  // Load settings when they're fetched
  useEffect(() => {
    if (settings) {
      setCompanyInfo({
        name: settings.name || "",
        logo: settings.logo || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        website: settings.website || "",
        taxId: settings.taxId || "",
      });
      if (settings.logo) {
        setLogoPreview(settings.logo);
      }
    }
  }, [settings]);

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogoPreview(dataUrl);
        setCompanyInfo((prev) => ({
          ...prev,
          logo: dataUrl,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!companyInfo.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setIsSaving(true);
    try {
      // Extract base64 from data URL if needed
      let logoToSave = companyInfo.logo;
      if (logoToSave && logoToSave.startsWith("data:")) {
        const base64Part = logoToSave.split(",")[1];
        if (base64Part) {
          logoToSave = base64Part;
        }
      }

      // Limit logo size to 50KB
      if (logoToSave && logoToSave.length > 50000) {
        toast.error("Logo image is too large. Please use a smaller image.");
        setIsSaving(false);
        return;
      }

      await saveSettings.mutateAsync({
        ...companyInfo,
        logo: logoToSave,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSettings) {
    return <div className="text-center py-8">Loading company settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Settings</CardTitle>
        <CardDescription>
          Configure company information that will appear on exported documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Logo</label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <div className="w-32 h-32 border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended size: 120x60 pixels. Supported formats: PNG, JPG, GIF
          </p>
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Name *</label>
          <Input
            value={companyInfo.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., KenPOS Ltd"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Address</label>
          <Input
            value={companyInfo.address || ""}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="e.g., 123 Main Street, Nairobi, Kenya"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <Input
            value={companyInfo.phone || ""}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="e.g., +254 (0) 123 456 789"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={companyInfo.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="e.g., info@company.com"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Website</label>
          <Input
            value={companyInfo.website || ""}
            onChange={(e) => handleInputChange("website", e.target.value)}
            placeholder="e.g., www.company.com"
          />
        </div>

        {/* Tax ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tax ID / VAT Number</label>
          <Input
            value={companyInfo.taxId || ""}
            onChange={(e) => handleInputChange("taxId", e.target.value)}
            placeholder="e.g., P051234567A"
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving || saveSettings.isPending} className="w-full">
          {isSaving ? "Saving..." : "Save Company Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
