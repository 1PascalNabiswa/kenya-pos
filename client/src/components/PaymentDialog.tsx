import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Smartphone, Banknote, CreditCard, Loader2, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReceiptDialog from "./ReceiptDialog";
import { useEffect } from "react";
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

type PaymentMethod = "cash" | "mpesa" | "stripe" | "wallet";

interface SplitPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  mpesaPhone?: string;
  mpesaStatus?: "idle" | "sending" | "waiting" | "success" | "failed";
  checkoutRequestId?: string;
}

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
  const [paymentMode, setPaymentMode] = useState<"single" | "split">("single");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "sending" | "waiting" | "success" | "failed">("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string>("");

  const utils = trpc.useUtils();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset all state variables
      setPaymentMode("single");
      setMethod("cash");
      setCashReceived("");
      setMpesaPhone("");
      setMpesaStatus("idle");
      setCheckoutRequestId("");
      setIsProcessing(false);
      setSplitPayments([]);
      setShowReceipt(false);
      setCompletedOrderId(null);
      setCompletedOrderNumber("");
    }
  }, [open]);

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      utils.reports.dashboard.invalidate();
      utils.orders.list.invalidate();
    },
  });

  const initiateMpesa = trpc.payments.initiateMpesa.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const addPaymentMethod = trpc.payments.addMethod.useMutation();
  const queryMpesaStatus = trpc.payments.queryMpesaStatus.useMutation();
  const getWallet = trpc.wallet.get.useQuery(
    { customerId: customerId || 0 },
    { enabled: !!customerId && paymentMode === "split" && method === "wallet" }
  );

  const cashChange = cashReceived ? Math.max(0, Number(cashReceived) - total) : 0;
  const cashSufficient = !cashReceived || Number(cashReceived) >= total;

  const splitTotal = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const splitRemaining = Math.max(0, total - splitTotal);

  const handleAddSplitPayment = () => {
    if (splitRemaining <= 0) {
      toast.error("Total amount already covered");
      return;
    }
    setSplitPayments([
      ...splitPayments,
      {
        id: Date.now().toString(),
        method: "cash",
        amount: 0,
      },
    ]);
  };

  const handleRemoveSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter((p) => p.id !== id));
  };

  const handleRetrySplitMpesa = (paymentId: string) => {
    setSplitPayments(
      splitPayments.map((p) =>
        p.id === paymentId ? { ...p, mpesaStatus: "idle" } : p
      )
    );
  };

  const handleUpdateSplitPayment = (id: string, field: string, value: any) => {
    setSplitPayments(
      splitPayments.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          // Reset M-Pesa status if method changes away from mpesa
          if (field === "method" && value !== "mpesa") {
            updated.mpesaStatus = "idle";
            updated.mpesaPhone = "";
          }
          return updated;
        }
        return p;
      })
    );
  };

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
      setCompletedOrderId(result.orderId);
      setCompletedOrderNumber(result.orderNumber);
      setShowReceipt(true);
      onComplete(result.orderId, result.orderNumber);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitPayment = async () => {
    if (splitTotal !== total) {
      toast.error(`Total split payments (KES ${splitTotal}) must equal order total (KES ${total})`);
      return;
    }

    // Verify all M-Pesa payments have phone numbers
    const mpesaPayments = splitPayments.filter((p) => p.method === "mpesa");
    for (const payment of mpesaPayments) {
      if (!payment.mpesaPhone) {
        toast.error(`Please enter M-Pesa phone number for KES ${payment.amount} payment`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      // Determine primary payment method from first split payment
      const primaryMethod = splitPayments[0]?.method || "cash";
      let cashReceivedAmount = "0";
      let cashChangeAmount = "0";

      // Calculate cash if any split payment is cash
      const cashPayment = splitPayments.find((p) => p.method === "cash");
      if (cashPayment) {
        cashReceivedAmount = String(cashPayment.amount);
        cashChangeAmount = "0";
      }

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
        paymentMethod: "mixed",
        cashReceived: cashReceivedAmount,
        cashChange: cashChangeAmount,
      });

      // Record split payments
      for (const payment of splitPayments) {
        try {
          await addPaymentMethod.mutateAsync({
            id: result.orderId,
            method: payment.method,
            amount: Number(payment.amount),
          });
        } catch (e) {
          console.error("Failed to record payment method:", e);
        }
      }

      const methods = splitPayments.map((p) => `${p.method}: KES ${p.amount}`).join(", ");
      toast.success(`Payment split across: ${methods}`);
      setCompletedOrderId(result.orderId);
      setCompletedOrderNumber(result.orderNumber);
      setShowReceipt(true);
      onComplete(result.orderId, result.orderNumber);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to process split payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitMpesaPayment = async (paymentId: string) => {
    const payment = splitPayments.find((p) => p.id === paymentId);
    if (!payment || !payment.mpesaPhone) {
      toast.error("Please enter M-Pesa phone number");
      return;
    }

    // Update payment status to sending
    setSplitPayments(
      splitPayments.map((p) =>
        p.id === paymentId ? { ...p, mpesaStatus: "sending" } : p
      )
    );

    try {
      const result = await initiateMpesa.mutateAsync({
        phone: payment.mpesaPhone,
        amount: payment.amount,
        orderId: customerId || 0,
        orderNumber: `SPLIT-${Date.now()}`,
      });

      setCheckoutRequestId(result.CheckoutRequestID);

      // Update to waiting status
      setSplitPayments(
        splitPayments.map((p) =>
          p.id === paymentId
            ? { ...p, mpesaStatus: "waiting", checkoutRequestId: result.CheckoutRequestID }
            : p
        )
      );

      // Poll for payment status
      const pollInterval = setInterval(async () => {
        try {
          const statusResult = await queryMpesaStatus.mutateAsync({
            checkoutRequestId: result.CheckoutRequestID,
          });

          if (statusResult.ResultCode === "0") {
            clearInterval(pollInterval);
            setSplitPayments(
              splitPayments.map((p) =>
                p.id === paymentId ? { ...p, mpesaStatus: "success" } : p
              )
            );
            toast.success(`M-Pesa payment of KES ${payment.amount} confirmed!`);
          }
        } catch (e) {
          console.error("Status check error:", e);
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        const currentPayment = splitPayments.find((p) => p.id === paymentId);
        if (currentPayment?.mpesaStatus === "waiting") {
          setSplitPayments(
            splitPayments.map((p) =>
              p.id === paymentId ? { ...p, mpesaStatus: "failed" } : p
            )
          );
          toast.error("M-Pesa payment timeout");
        }
      }, 60000);
    } catch (e: any) {
      setSplitPayments(
        splitPayments.map((p) =>
          p.id === paymentId ? { ...p, mpesaStatus: "failed" } : p
        )
      );
      toast.error(e.message ?? "Failed to initiate M-Pesa payment");
    }
  };

  const handleMpesaPayment = async () => {
    if (!mpesaPhone) {
      toast.error("Please enter M-Pesa phone number");
      return;
    }
    setMpesaStatus("sending");
    try {
      const result = await initiateMpesa.mutateAsync({
        phone: mpesaPhone,
        amount: total,
        orderId: customerId || 0,
        orderNumber: `ORD-${Date.now()}`,
      });
      setCheckoutRequestId(result.checkoutRequestId);
      setMpesaStatus("waiting");
      toast.info("M-Pesa prompt sent to " + mpesaPhone);

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResult = await queryMpesaStatus.mutateAsync({
            checkoutRequestId: result.checkoutRequestId,
          });
          if (statusResult.success) {
            setMpesaStatus("success");
            clearInterval(pollInterval);

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
            });

            toast.success("M-Pesa payment successful!");
            setCompletedOrderId(orderResult.orderId);
            setCompletedOrderNumber(orderResult.orderNumber);
            setShowReceipt(true);
            onComplete(orderResult.orderId, orderResult.orderNumber);
          }
        } catch (e) {
          console.error("Status check error:", e);
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (mpesaStatus === "waiting") {
          setMpesaStatus("failed");
          toast.error("M-Pesa payment timeout");
        }
      }, 60000);
    } catch (e: any) {
      setMpesaStatus("failed");
      toast.error(e.message ?? "Failed to initiate M-Pesa payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (16%):</span>
              <span>KES {taxAmount.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <Tabs value={paymentMode} onValueChange={(v) => setPaymentMode(v as "single" | "split")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Payment</TabsTrigger>
              <TabsTrigger value="split">Split Payment</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={method === "cash" ? "default" : "outline"}
                  onClick={() => setMethod("cash")}
                  className="flex items-center gap-2"
                >
                  <Banknote className="w-4 h-4" />
                  Cash
                </Button>
                <Button
                  variant={method === "mpesa" ? "default" : "outline"}
                  onClick={() => setMethod("mpesa")}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  M-Pesa
                </Button>
                <Button
                  variant={method === "stripe" ? "default" : "outline"}
                  onClick={() => setMethod("stripe")}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </Button>
              </div>

              {/* Cash Payment */}
              {method === "cash" && (
                <div className="space-y-4">
                  <div>
                    <Label>Cash Received</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      min="0"
                    />
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div>
                    <Label className="text-xs text-gray-600">Quick Select</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[50, 100, 200, 500, 1000].map((amount) => (
                        <Button
                          key={amount}
                          variant={Number(cashReceived) === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCashReceived(String(amount))}
                          className="text-sm"
                        >
                          {amount}
                        </Button>
                      ))}
                      <Button
                        variant={Number(cashReceived) === total ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCashReceived(String(total))}
                        className="text-sm col-span-3"
                      >
                        Exact ({total})
                      </Button>
                    </div>
                  </div>
                  {cashReceived && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span>Amount Received:</span>
                        <span className="font-semibold">KES {Number(cashReceived).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span className={`font-semibold ${cashSufficient ? "text-green-600" : "text-red-600"}`}>
                          KES {cashChange.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleCashPayment}
                    disabled={!cashSufficient || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm Cash Payment
                  </Button>
                </div>
              )}

              {/* M-Pesa Payment */}
              {method === "mpesa" && (
                <div className="space-y-4">
                  <div>
                    <Label>M-Pesa Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="254700000000"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                    />
                  </div>
                  {mpesaStatus === "success" && (
                    <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">Payment successful!</span>
                    </div>
                  )}
                  {mpesaStatus === "failed" && (
                    <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600">Payment failed. Please try again.</span>
                    </div>
                  )}
                  <Button
                    onClick={handleMpesaPayment}
                    disabled={mpesaStatus !== "idle" || isProcessing}
                    className="w-full"
                  >
                    {mpesaStatus === "sending" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {mpesaStatus === "waiting" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {mpesaStatus === "idle" ? "Send M-Pesa Prompt" : "Processing..."}
                  </Button>
                </div>
              )}

              {/* Stripe Payment */}
              {method === "stripe" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Stripe integration ready. Card details would be collected here in production.
                    </p>
                  </div>
                  <Button disabled className="w-full">
                    Stripe Payment (Coming Soon)
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="split" className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Total to Collect:</span>
                  <span className="font-semibold">KES {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Collected So Far:</span>
                  <span className={`font-semibold ${splitTotal === total ? "text-green-600" : "text-orange-600"}`}>
                    KES {splitTotal.toLocaleString()}
                  </span>
                </div>
                {splitRemaining > 0 && (
                  <div className="flex justify-between mt-2 text-red-600">
                    <span>Still Needed:</span>
                    <span className="font-semibold">KES {splitRemaining.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Split Payments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {splitPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Method</Label>
                        <select
                          value={payment.method}
                          onChange={(e) =>
                            handleUpdateSplitPayment(payment.id, "method", e.target.value as PaymentMethod)
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="cash">Cash</option>
                          <option value="mpesa">M-Pesa</option>
                          <option value="stripe">Card</option>
                          <option value="wallet">Wallet</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Amount</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={payment.amount}
                          onChange={(e) =>
                            handleUpdateSplitPayment(payment.id, "amount", Number(e.target.value))
                          }
                          min="0"
                          max={splitRemaining + payment.amount}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSplitPayment(payment.id)}
                        className="text-red-600 hover:text-red-700 mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* M-Pesa specific UI */}
                    {payment.method === "mpesa" && (
                      <div className="space-y-2 bg-blue-50 p-2 rounded">
                        <Input
                          type="tel"
                          placeholder="254700000000"
                          value={payment.mpesaPhone || ""}
                          onChange={(e) =>
                            handleUpdateSplitPayment(payment.id, "mpesaPhone", e.target.value)
                          }
                          className="text-sm"
                        />
                        {payment.mpesaStatus === "idle" && (
                          <Button
                            size="sm"
                            onClick={() => handleSplitMpesaPayment(payment.id)}
                            className="w-full text-xs"
                          >
                            Send M-Pesa Prompt
                          </Button>
                        )}
                        {payment.mpesaStatus === "sending" && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending prompt...</span>
                          </div>
                        )}
                        {payment.mpesaStatus === "waiting" && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Waiting for payment...</span>
                          </div>
                        )}
                        {payment.mpesaStatus === "success" && (
                          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Payment confirmed!</span>
                          </div>
                        )}
                        {payment.mpesaStatus === "failed" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                              <AlertCircle className="w-4 h-4" />
                              <span>Payment failed</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetrySplitMpesa(payment.id)}
                              className="w-full text-xs"
                            >
                              Retry
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleAddSplitPayment}
                disabled={splitRemaining <= 0}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Payment Method
              </Button>

              <Button
                onClick={handleSplitPayment}
                disabled={splitTotal !== total || isProcessing}
                className="w-full"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Split Payment
              </Button>
            </TabsContent>
          </Tabs>

          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          onClose();
        }}
        orderId={completedOrderId || 0}
        orderNumber={completedOrderNumber}
      />
    </Dialog>
  );
}
