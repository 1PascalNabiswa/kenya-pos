import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Store, Receipt, Smartphone, CreditCard, Bell, Shield } from "lucide-react";

type Tab = "store" | "receipt" | "payments" | "notifications" | "security";

export default function Settings() {
  const [tab, setTab] = useState<Tab>("store");
  const { data: allSettings, isLoading } = trpc.settings.getAll.useQuery();
  const setMany = trpc.settings.setMany.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: (e) => toast.error(e.message),
  });

  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeKRA, setStoreKRA] = useState("");
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [printAutomatic, setPrintAutomatic] = useState(false);
  const [receiptRollSize, setReceiptRollSize] = useState("68");
  const [servedBy, setServedBy] = useState("");
  const [mpesaShortcode, setMpesaShortcode] = useState("");
  const [mpesaPasskey, setMpesaPasskey] = useState("");
  const [mpesaConsumerKey, setMpesaConsumerKey] = useState("");
  const [mpesaConsumerSecret, setMpesaConsumerSecret] = useState("");
  const [mpesaEnv, setMpesaEnv] = useState("sandbox");
  const [stripeKey, setStripeKey] = useState("");
  const [taxRate, setTaxRate] = useState("16");
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [largeTransactionAlert, setLargeTransactionAlert] = useState(true);
  const [largeTransactionThreshold, setLargeTransactionThreshold] = useState("10000");

  useEffect(() => {
    if (!allSettings) return;
    const get = (key: string, def = "") => allSettings.find((s: any) => s.key === key)?.value ?? def;
    setStoreName(get("store_name", "KenPOS Store"));
    setStorePhone(get("store_phone", "+254 700 000 000"));
    setStoreEmail(get("store_email"));
    setStoreAddress(get("store_address", "Nairobi, Kenya"));
    setStoreKRA(get("store_kra_pin"));
    setReceiptHeader(get("receipt_header", "Thank you for your business!"));
    setReceiptFooter(get("receipt_footer", "Powered by KenPOS"));
    setPrintAutomatic(get("print_automatic") === "true");
    setReceiptRollSize(get("receipt_roll_size", "68"));
    setServedBy(get("served_by"));
    setMpesaShortcode(get("mpesa_shortcode"));
    setMpesaPasskey(get("mpesa_passkey"));
    setMpesaConsumerKey(get("mpesa_consumer_key"));
    setMpesaConsumerSecret(get("mpesa_consumer_secret"));
    setMpesaEnv(get("mpesa_env", "sandbox"));
    setStripeKey(get("stripe_publishable_key"));
    setTaxRate(get("tax_rate", "16"));
    setLowStockAlert(get("notify_low_stock", "true") === "true");
    setDailySummary(get("notify_daily_summary", "true") === "true");
    setLargeTransactionAlert(get("notify_large_transaction", "true") === "true");
    setLargeTransactionThreshold(get("notify_large_threshold", "10000"));
  }, [allSettings]);

  const saveStore = () => {
    setMany.mutate([
      { key: "store_name", value: storeName },
      { key: "store_phone", value: storePhone },
      { key: "store_email", value: storeEmail },
      { key: "store_address", value: storeAddress },
      { key: "store_kra_pin", value: storeKRA },
      { key: "tax_rate", value: taxRate },
    ]);
  };

  const saveReceipt = () => {
    setMany.mutate([
      { key: "receipt_header", value: receiptHeader },
      { key: "receipt_footer", value: receiptFooter },
      { key: "print_automatic", value: String(printAutomatic) },
      { key: "receipt_roll_size", value: receiptRollSize },
      { key: "served_by", value: servedBy },
    ]);
  };

  const savePayments = () => {
    setMany.mutate([
      { key: "mpesa_shortcode", value: mpesaShortcode },
      { key: "mpesa_passkey", value: mpesaPasskey },
      { key: "mpesa_consumer_key", value: mpesaConsumerKey },
      { key: "mpesa_consumer_secret", value: mpesaConsumerSecret },
      { key: "mpesa_env", value: mpesaEnv },
      { key: "stripe_publishable_key", value: stripeKey },
    ]);
  };

  const saveNotifications = () => {
    setMany.mutate([
      { key: "notify_low_stock", value: String(lowStockAlert) },
      { key: "notify_daily_summary", value: String(dailySummary) },
      { key: "notify_large_transaction", value: String(largeTransactionAlert) },
      { key: "notify_large_threshold", value: largeTransactionThreshold },
    ]);
  };

  const tabs = [
    { id: "store" as Tab, label: "Store", icon: <Store size={16} /> },
    { id: "receipt" as Tab, label: "Receipt", icon: <Receipt size={16} /> },
    { id: "payments" as Tab, label: "Payments", icon: <Smartphone size={16} /> },
    { id: "notifications" as Tab, label: "Notifications", icon: <Bell size={16} /> },
    { id: "security" as Tab, label: "Security", icon: <Shield size={16} /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your POS system</p>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Store Settings */}
      {tab === "store" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store size={16} /> Store Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Store Name</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>KRA PIN</Label>
                <Input value={storeKRA} onChange={(e) => setStoreKRA(e.target.value)} placeholder="e.g. P051234567A" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>VAT Rate (%)</Label>
                <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Standard Kenya VAT is 16%</p>
              </div>
            </div>
            <Button onClick={saveStore} disabled={setMany.isPending}>
              <Save size={14} className="mr-2" /> Save Store Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Receipt Settings */}
      {tab === "receipt" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt size={16} /> Receipt Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Thermal Roll Size</Label>
              <select value={receiptRollSize} onChange={(e) => setReceiptRollSize(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm mt-1">
                <option value="73">73mm</option>
                <option value="76">76mm</option>
                <option value="80">80mm</option>
              </select>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-xs font-mono space-y-1" style={{width: `${receiptRollSize}mm`, margin: '0 auto'}}>
              <p className="text-center font-bold">{storeName || "KenPOS Store"}</p>
              <p className="text-center text-muted-foreground">{storeAddress || "Nairobi, Kenya"}</p>
              <p className="text-center">Tel: {storePhone || "+254 700 000 000"}</p>
              <Separator className="my-1" />
              <p className="text-center">RECEIPT</p>
              <p>Order: KEN-20250403-001</p>
              <p>Date: 03 Apr 2025 14:30</p>
              <Separator className="my-1" />
              <p className="flex justify-between"><span>Product Name</span><span>KES 100</span></p>
              <Separator className="my-1" />
              <p className="flex justify-between font-bold"><span>TOTAL</span><span>KES 116</span></p>
              <Separator className="my-1" />
              <p className="text-center">{receiptHeader || "Thank you for your business!"}</p>
              <p className="text-center text-muted-foreground">{receiptFooter || "Powered by KenPOS"}</p>
            </div>
            <div>
              <Label>Receipt Header Message</Label>
              <Input value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Receipt Footer Message</Label>
              <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Served By (Staff Name)</Label>
              <Input value={servedBy} onChange={(e) => setServedBy(e.target.value)} placeholder="e.g. John" className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Print Receipt</Label>
                <p className="text-xs text-muted-foreground">Automatically open print dialog after each sale</p>
              </div>
              <Switch checked={printAutomatic} onCheckedChange={setPrintAutomatic} />
            </div>
            <Button onClick={saveReceipt} disabled={setMany.isPending}>
              <Save size={14} className="mr-2" /> Save Receipt Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Settings */}
      {tab === "payments" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Smartphone size={16} /> M-Pesa Daraja API</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                <p className="font-medium">M-Pesa STK Push (Lipa Na M-Pesa)</p>
                <p>Configure your Safaricom Daraja API credentials to enable M-Pesa payments.</p>
                <a href="https://developer.safaricom.co.ke" target="_blank" rel="noopener noreferrer" className="underline">
                  Get credentials at developer.safaricom.co.ke
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Shortcode</Label>
                  <Input value={mpesaShortcode} onChange={(e) => setMpesaShortcode(e.target.value)} placeholder="e.g. 174379" className="mt-1" />
                </div>
                <div>
                  <Label>Environment</Label>
                  <select
                    value={mpesaEnv}
                    onChange={(e) => setMpesaEnv(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>
                <div>
                  <Label>Consumer Key</Label>
                  <Input value={mpesaConsumerKey} onChange={(e) => setMpesaConsumerKey(e.target.value)} type="password" className="mt-1" />
                </div>
                <div>
                  <Label>Consumer Secret</Label>
                  <Input value={mpesaConsumerSecret} onChange={(e) => setMpesaConsumerSecret(e.target.value)} type="password" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Passkey (Lipa Na M-Pesa Online)</Label>
                  <Input value={mpesaPasskey} onChange={(e) => setMpesaPasskey(e.target.value)} type="password" className="mt-1" />
                </div>
              </div>
              <Button onClick={savePayments} disabled={setMany.isPending}>
                <Save size={14} className="mr-2" /> Save M-Pesa Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard size={16} /> Stripe Card Payments</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-medium">Stripe Integration</p>
                <p>Accept card payments via Stripe. Get your API keys from the Stripe dashboard.</p>
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">
                  Get keys at dashboard.stripe.com
                </a>
              </div>
              <div>
                <Label>Stripe Publishable Key</Label>
                <Input value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} placeholder="pk_live_..." className="mt-1" />
              </div>
              <Button onClick={savePayments} disabled={setMany.isPending}>
                <Save size={14} className="mr-2" /> Save Stripe Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell size={16} /> Owner Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure which events trigger notifications to the store owner.
            </p>
            <div className="space-y-4">
              {[
                { label: "Low Stock Alerts", desc: "Notify when products fall below threshold", value: lowStockAlert, onChange: setLowStockAlert },
                { label: "Daily Sales Summary", desc: "Send daily revenue and order summary", value: dailySummary, onChange: setDailySummary },
                { label: "Large Transaction Alerts", desc: "Notify for transactions above threshold", value: largeTransactionAlert, onChange: setLargeTransactionAlert },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.onChange} />
                </div>
              ))}
              {largeTransactionAlert && (
                <div>
                  <Label>Large Transaction Threshold (KES)</Label>
                  <Input
                    type="number"
                    value={largeTransactionThreshold}
                    onChange={(e) => setLargeTransactionThreshold(e.target.value)}
                    className="mt-1 w-48"
                  />
                </div>
              )}
            </div>
            <Button onClick={saveNotifications} disabled={setMany.isPending}>
              <Save size={14} className="mr-2" /> Save Notification Settings
            </Button>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium mb-2">Personal Notification Preferences</p>
              <p className="text-xs text-muted-foreground mb-3">Customize which notifications you receive personally</p>
              <Button variant="outline" onClick={() => window.location.href = '/settings/notifications'}>
                <Bell size={14} className="mr-2" /> Manage My Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      {tab === "security" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield size={16} /> Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Authentication</p>
                  <p className="text-xs text-muted-foreground">Secured via Manus OAuth</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Role-Based Access Control</p>
                  <p className="text-xs text-muted-foreground">Admin and user roles enforced</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">HTTPS Encryption</p>
                  <p className="text-xs text-muted-foreground">All data transmitted securely</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Active</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              For advanced security settings, contact your system administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
