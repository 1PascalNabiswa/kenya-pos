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
import { useEffect, useState } from "react";
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
  const deductWallet = trpc.wallet.deduct.useMutation();
  const getWallet = trpc.wallet.get.useQuery(
    { customerId: customerId || 0 },
    { enabled: !!customerId && (method === "wallet") }
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

  const handleCardPayment = async () => {
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
        paymentMethod: "stripe",
      });
      toast.success(`Card payment processed! Order: ${result.orderNumber}`);
      setCompletedOrderId(result.orderId);
      setCompletedOrderNumber(result.orderNumber);
      setShowReceipt(true);
      onComplete(result.orderId, result.orderNumber);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to process card payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!customerId) {
      toast.error("No customer selected");
      return;
    }
    if (!getWallet.data || getWallet.data.balance < total) {
      toast.error("Insufficient wallet balance");
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
      });
      
      // Deduct from wallet balance
      await deductWallet.mutateAsync({
        customerId,
        amount: total,
      });
      
      // Invalidate wallet query to refresh balance
      utils.wallet.get.invalidate();
      
      toast.success(`Payment of KES ${total.toLocaleString()} deducted from wallet`);
      setCompletedOrderId(result.orderId);
      setCompletedOrderNumber(result.orderNumber);
      setShowReceipt(true);
      onComplete(result.orderId, result.orderNumber);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to process wallet payment");
    } finally {
      setIsProcessing(false);
    }
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
    // Calculate confirmed amounts (cash is always confirmed, M-Pesa is pending)
    const confirmedTotal = splitPayments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Check if we have enough confirmed payment (cash) to cover the order
    if (confirmedTotal < total) {
      const needed = total - confirmedTotal;
      toast.error(`Need at least KES ${needed} more in confirmed payments (cash)`);
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
      // Calculate total received and excess (change/refund)
      const totalReceived = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      const excessAmount = Math.max(0, totalReceived - total);
      
      // Determine order status: COMPLETED if all confirmed payments cover the total, PENDING if waiting for M-Pesa
      const hasMpesaPending = mpesaPayments.length > 0;
      const orderStatus = hasMpesaPending ? "pending" : "completed";

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
        cashReceived: String(confirmedTotal),
        cashChange: String(excessAmount),
        status: orderStatus,
      });

      // Record split payments with confirmation status
      for (const payment of splitPayments) {
        try {
          await addPaymentMethod.mutateAsync({
            id: result.orderId,
            method: payment.method,
            amount: Number(payment.amount),
            status: payment.method === "cash" ? "confirmed" : "pending",
            mpesaPhone: payment.mpesaPhone,
          });
        } catch (e) {
          console.error("Failed to record payment method:", e);
        }
      }

      const methods = splitPayments.map((p) => `${p.method}: KES ${p.amount}`).join(", ");
      const statusMsg = hasMpesaPending ? " (M-Pesa pending confirmation)" : " (Paid)";
      toast.success(`Payment split across: ${methods}${statusMsg}`);
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
        orderId: "",
        description: `Split payment - KES ${payment.amount}`,
        callbackUrl: "",
      });

      setSplitPayments(
        splitPayments.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                mpesaStatus: "waiting",
                checkoutRequestId: result.checkoutRequestId,
              }
            : p
        )
      );

      toast.info("M-Pesa prompt sent. Please complete payment on your phone.");
    } catch (e: any) {
      setSplitPayments(
        splitPayments.map((p) =>
          p.id === paymentId ? { ...p, mpesaStatus: "failed" } : p
        )
      );
      toast.error("Failed to send M-Pesa prompt: " + (e.message || "Unknown error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
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

          <Tabs
            value={paymentMode}
            onValueChange={(v) => setPaymentMode(v as "single" | "split")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Payment</TabsTrigger>
              <TabsTrigger value="split">Split Payment</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={method === "cash" ? "default" : "outline"}
                  onClick={() => setMethod("cash")}
                  className="flex-1"
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Cash
                </Button>
                <Button
                  variant={method === "mpesa" ? "default" : "outline"}
                  onClick={() => setMethod("mpesa")}
                  className="flex-1"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  M-Pesa
                </Button>
                <Button
                  variant={method === "stripe" ? "default" : "outline"}
                  onClick={() => setMethod("stripe")}
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card
                </Button>
                {customerId && (
                  <Button
                    variant={method === "wallet" ? "default" : "outline"}
                    onClick={() => setMethod("wallet")}
                    className="flex-1"
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Wallet
                  </Button>
                )}
              </div>

              {method === "cash" && (
                <div className="space-y-3">
                  <div>
                    <Label>Cash Received</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived("50")}
                      className={cashReceived === "50" ? "bg-blue-100" : ""}
                    >
                      50
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived("100")}
                      className={cashReceived === "100" ? "bg-blue-100" : ""}
                    >
                      100
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived("200")}
                      className={cashReceived === "200" ? "bg-blue-100" : ""}
                    >
                      200
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived("500")}
                      className={cashReceived === "500" ? "bg-blue-100" : ""}
                    >
                      500
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived("1000")}
                      className={cashReceived === "1000" ? "bg-blue-100" : ""}
                    >
                      1000
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived(String(total))}
                    className={cashReceived === String(total) ? "bg-blue-100" : ""}
                  >
                    Exact ({total})
                  </Button>

                  {cashReceived && (
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm">Amount Received: KES {Number(cashReceived).toLocaleString()}</div>
                      <div className={`text-sm font-bold ${cashChange > 0 ? "text-green-600" : ""}`}>
                        Change: KES {cashChange.toLocaleString()}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCashPayment}
                    disabled={!cashSufficient || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Cash Payment"
                    )}
                  </Button>
                </div>
              )}

              {method === "stripe" && (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-700">Card payment will open a secure payment gateway.</p>
                    <div className="mt-2 flex justify-between text-sm font-bold">
                      <span>Total Amount:</span>
                      <span>KES {total.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCardPayment}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Proceed to Card Payment"
                    )}
                  </Button>
                </div>
              )}

              {method === "wallet" && (
                <div className="space-y-3">
                  {getWallet.isLoading ? (
                    <div className="bg-blue-50 p-3 rounded text-sm">Loading wallet balance...</div>
                  ) : getWallet.data ? (
                    <>
                      <div className="bg-blue-50 p-3 rounded space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Wallet Balance:</span>
                          <span className="font-bold">KES {getWallet.data.balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Amount to Pay:</span>
                          <span className="font-bold">KES {total.toLocaleString()}</span>
                        </div>
                        {getWallet.data.balance >= total ? (
                          <div className="text-xs text-green-600">✓ Sufficient balance</div>
                        ) : (
                          <div className="text-xs text-red-600">✗ Insufficient balance (short by KES {(total - getWallet.data.balance).toLocaleString()})</div>
                        )}
                      </div>
                      <Button
                        onClick={handleWalletPayment}
                        disabled={!getWallet.data || getWallet.data.balance < total || isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Pay from Wallet"
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="bg-red-50 p-3 rounded text-sm text-red-600">Unable to load wallet information</div>
                  )}
                </div>
              )}

              {method === "mpesa" && (
                <div className="space-y-3">
                  <div>
                    <Label>M-Pesa Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="254712345678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                    />
                  </div>

                  {mpesaStatus === "waiting" && (
                    <div className="bg-yellow-50 p-3 rounded flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Waiting for M-Pesa confirmation...</span>
                    </div>
                  )}

                  {mpesaStatus === "success" && (
                    <div className="bg-green-50 p-3 rounded flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Payment confirmed!</span>
                    </div>
                  )}

                  {mpesaStatus === "failed" && (
                    <div className="bg-red-50 p-3 rounded flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Payment failed. Please try again.</span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleSplitMpesaPayment("")}
                    disabled={!mpesaPhone || isProcessing || mpesaStatus === "waiting"}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send M-Pesa Prompt"
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="split" className="space-y-4">
              <div className="bg-blue-50 p-3 rounded space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total to Collect:</span>
                  <span className="font-bold">KES {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Collected So Far:</span>
                  <span className="text-orange-600 font-bold">KES {splitTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Still Needed:</span>
                  <span className="text-red-600 font-bold">KES {splitRemaining.toLocaleString()}</span>
                </div>
              </div>

              {splitPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={payment.method}
                      onChange={(e) =>
                        handleUpdateSplitPayment(payment.id, "method", e.target.value as PaymentMethod)
                      }
                      className="flex-1 px-2 py-1 border rounded"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="stripe">Card</option>
                      <option value="wallet">Wallet</option>
                    </select>
                    <input
                      type="number"
                      placeholder="0"
                      value={payment.amount}
                      onChange={(e) =>
                        handleUpdateSplitPayment(payment.id, "amount", Number(e.target.value))
                      }
                      className="w-24 px-2 py-1 border rounded"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSplitPayment(payment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {payment.method === "mpesa" && (
                    <div className="space-y-2">
                      <input
                        type="tel"
                        placeholder="M-Pesa phone number"
                        value={payment.mpesaPhone || ""}
                        onChange={(e) =>
                          handleUpdateSplitPayment(payment.id, "mpesaPhone", e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                      {payment.mpesaStatus === "waiting" && (
                        <div className="text-xs text-orange-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Waiting for confirmation...
                        </div>
                      )}
                      {payment.mpesaStatus === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetrySplitMpesa(payment.id)}
                          className="w-full text-xs"
                        >
                          Retry M-Pesa
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={handleAddSplitPayment}
                disabled={splitRemaining <= 0}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>

              <Button
                onClick={handleSplitPayment}
                disabled={splitTotal === 0 || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Split Payment"
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>

        {showReceipt && completedOrderId && (
          <ReceiptDialog
            orderId={completedOrderId}
            orderNumber={completedOrderNumber}
            open={showReceipt}
            onClose={() => {
              setShowReceipt(false);
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
