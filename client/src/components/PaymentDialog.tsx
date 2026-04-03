import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Smartphone, Banknote, CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CartItem {
  productId: number;
  productName: string;
  productSku?: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  customerId?: number;
  customerName?: string;
  onComplete: (orderId: number, orderNumber: string) => void;
}

type PaymentMethod = "cash" | "mpesa" | "stripe";

export default function PaymentDialog({
  open,
  onClose,
  cart,
  subtotal,
  taxAmount,
  total,
  customerId,
  customerName,
  onComplete,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "sending" | "waiting" | "success" | "failed">("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const utils = trpc.useUtils();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      utils.reports.dashboard.invalidate();
      utils.orders.list.invalidate();
    },
  });

  const initiateMpesa = trpc.payments.initiateMpesa.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();

  const cashChange = cashReceived ? Math.max(0, Number(cashReceived) - total) : 0;
  const cashSufficient = !cashReceived || Number(cashReceived) >= total;

  const handleCashPayment = async () => {
    if (!cashReceived || Number(cashReceived) < total) {
      toast.error("Cash received must be at least KES " + total.toLocaleString());
      return;
    }
    setIsProcessing(true);
    try {
      const result = await createOrder.mutateAsync({
        customerId,
        customerName: customerName || "Walk-in Customer",
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          originalPrice: item.originalPrice ? String(item.originalPrice) : undefined,
          totalPrice: String(item.unitPrice * item.quantity),
        })),
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        totalAmount: String(total),
        paymentMethod: "cash",
        cashReceived: cashReceived,
        cashChange: String(cashChange),
      });
      toast.success(`Payment received! Change: KES ${cashChange.toLocaleString()}`);
      onComplete(result.orderId, result.orderNumber);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!mpesaPhone || mpesaPhone.length < 9) {
      toast.error("Enter a valid M-Pesa phone number");
      return;
    }
    setIsProcessing(true);
    setMpesaStatus("sending");
    try {
      // First create the order
      const orderResult = await createOrder.mutateAsync({
        customerId,
        customerName: customerName || "Walk-in Customer",
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          originalPrice: item.originalPrice ? String(item.originalPrice) : undefined,
          totalPrice: String(item.unitPrice * item.quantity),
        })),
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        totalAmount: String(total),
        paymentMethod: "mpesa",
        notes: `M-Pesa: ${mpesaPhone}`,
      });

      // Initiate STK Push
      const mpesaResult = await initiateMpesa.mutateAsync({
        phone: mpesaPhone,
        amount: total,
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        callbackUrl: `${window.location.origin}/api/mpesa/callback`,
      });

      setCheckoutRequestId(mpesaResult.checkoutRequestId);
      setMpesaStatus("waiting");

      if (mpesaResult.simulated) {
        // Simulation mode - auto-confirm after 3s
        setTimeout(async () => {
          await updateStatus.mutateAsync({
            id: orderResult.orderId,
            paymentStatus: "paid",
            orderStatus: "completed",
            mpesaTransactionId: `SIM${Date.now()}`,
          });
          setMpesaStatus("success");
          toast.success("M-Pesa payment confirmed (simulation)!");
          setTimeout(() => onComplete(orderResult.orderId, orderResult.orderNumber), 1500);
        }, 3000);
      } else {
        toast.info(mpesaResult.message ?? "STK Push sent. Waiting for customer to confirm...");
        // Poll for status
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const status = await trpc.payments.queryMpesaStatus.useMutation().mutateAsync({
              checkoutRequestId: mpesaResult.checkoutRequestId,
            });
            if (status.ResultCode === "0") {
              clearInterval(poll);
              await updateStatus.mutateAsync({
                id: orderResult.orderId,
                paymentStatus: "paid",
                orderStatus: "completed",
                mpesaTransactionId: status.MpesaReceiptNumber,
              });
              setMpesaStatus("success");
              toast.success("M-Pesa payment confirmed!");
              setTimeout(() => onComplete(orderResult.orderId, orderResult.orderNumber), 1500);
            } else if (status.ResultCode !== undefined && status.ResultCode !== "0") {
              clearInterval(poll);
              setMpesaStatus("failed");
              toast.error("M-Pesa payment failed: " + status.ResultDesc);
            }
          } catch {}
          if (attempts >= 12) {
            clearInterval(poll);
            setMpesaStatus("failed");
            toast.error("M-Pesa payment timed out. Please check manually.");
          }
        }, 5000);
      }
    } catch (e: any) {
      toast.error(e.message ?? "M-Pesa initiation failed");
      setMpesaStatus("failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    setIsProcessing(true);
    try {
      const orderResult = await createOrder.mutateAsync({
        customerId,
        customerName: customerName || "Walk-in Customer",
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          originalPrice: item.originalPrice ? String(item.originalPrice) : undefined,
          totalPrice: String(item.unitPrice * item.quantity),
        })),
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        totalAmount: String(total),
        paymentMethod: "stripe",
      });

      const intentResult = await trpc.payments.createStripeIntent.useMutation().mutateAsync({
        amount: total,
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
      });

      // In a real implementation, you'd use Stripe.js here
      // For now, show the client secret and simulate confirmation
      toast.info("Stripe payment initiated. Client secret: " + intentResult.clientSecret?.slice(0, 20) + "...");
      
      // Simulate confirmation for demo
      setTimeout(async () => {
        await updateStatus.mutateAsync({
          id: orderResult.orderId,
          paymentStatus: "paid",
          orderStatus: "completed",
          stripePaymentIntentId: intentResult.paymentIntentId,
        } as any);
        toast.success("Stripe payment confirmed!");
        onComplete(orderResult.orderId, orderResult.orderNumber);
      }, 2000);
    } catch (e: any) {
      toast.error(e.message ?? "Stripe payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (method === "cash") handleCashPayment();
    else if (method === "mpesa") handleMpesaPayment();
    else if (method === "stripe") handleStripePayment();
  };

  const handleClose = () => {
    if (!isProcessing && mpesaStatus !== "waiting") {
      setMpesaStatus("idle");
      setCashReceived("");
      setMpesaPhone("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        {/* Order Summary */}
        <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT (16%)</span>
            <span>KES {taxAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-primary">KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "cash" as const, label: "Cash", icon: <Banknote size={20} />, color: "text-green-600" },
            { id: "mpesa" as const, label: "M-Pesa", icon: <Smartphone size={20} />, color: "text-green-500" },
            { id: "stripe" as const, label: "Card", icon: <CreditCard size={20} />, color: "text-blue-600" },
          ].map((pm) => (
            <button
              key={pm.id}
              onClick={() => { setMethod(pm.id); setMpesaStatus("idle"); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                method === pm.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className={pm.color}>{pm.icon}</span>
              <span className="text-xs font-medium">{pm.label}</span>
            </button>
          ))}
        </div>

        {/* Payment Method Forms */}
        {method === "cash" && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Cash Received (KES)</Label>
              <Input
                type="number"
                placeholder={`Min: ${Math.ceil(total).toLocaleString()}`}
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="mt-1"
              />
            </div>
            {cashReceived && Number(cashReceived) >= total && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-green-700 font-medium">Change</span>
                <span className="text-lg font-bold text-green-700">
                  KES {cashChange.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            {cashReceived && Number(cashReceived) < total && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">
                  Insufficient cash. Need KES {(total - Number(cashReceived)).toLocaleString(undefined, { maximumFractionDigits: 0 })} more.
                </p>
              </div>
            )}
            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCashReceived(String(amt))}
                  className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 font-medium"
                >
                  KES {amt.toLocaleString()}
                </button>
              ))}
              <button
                onClick={() => setCashReceived(String(Math.ceil(total)))}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium"
              >
                Exact
              </button>
            </div>
          </div>
        )}

        {method === "mpesa" && (
          <div className="space-y-3">
            {mpesaStatus === "idle" && (
              <div>
                <Label className="text-sm">M-Pesa Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="e.g. 0712345678 or 254712345678"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Customer will receive an STK Push prompt on their phone
                </p>
              </div>
            )}
            {mpesaStatus === "sending" && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="animate-spin text-blue-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-700">Sending STK Push...</p>
                  <p className="text-xs text-blue-600">Please wait</p>
                </div>
              </div>
            )}
            {mpesaStatus === "waiting" && (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <Loader2 className="animate-spin text-yellow-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-700">Waiting for payment...</p>
                  <p className="text-xs text-yellow-600">Customer should confirm on their phone</p>
                </div>
              </div>
            )}
            {mpesaStatus === "success" && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="text-green-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-green-700">Payment Confirmed!</p>
                  <p className="text-xs text-green-600">M-Pesa transaction successful</p>
                </div>
              </div>
            )}
            {mpesaStatus === "failed" && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="text-red-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-red-700">Payment Failed</p>
                  <p className="text-xs text-red-600">Please try again</p>
                </div>
              </div>
            )}
          </div>
        )}

        {method === "stripe" && (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Card Payment via Stripe</span>
              </div>
              <p className="text-xs text-blue-600">
                Amount: KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Stripe card terminal or online payment will be initiated
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isProcessing || mpesaStatus === "waiting"}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handlePayment}
            disabled={
              isProcessing ||
              mpesaStatus === "waiting" ||
              mpesaStatus === "success" ||
              (method === "cash" && (!cashReceived || Number(cashReceived) < total))
            }
          >
            {isProcessing ? (
              <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
            ) : (
              `Confirm ${method === "cash" ? "Cash" : method === "mpesa" ? "M-Pesa" : "Card"} Payment`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
