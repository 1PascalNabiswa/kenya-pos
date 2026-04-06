import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { customerWallets } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  adjustStock,
  createCategory,
  createCustomer,
  createOrder,
  deleteCategory,
  deleteCustomer,
  deleteProduct,
  generateOrderNumber,
  getAllSettings,
  getCategories,
  getCustomerById,
  getCustomers,
  getDashboardStats,
  getInventoryLogs,
  getCustomerSpendingByWeek,
  getCustomerSpendingByMonth,
  getCustomerSpendingTrends,
  getCustomerPaymentMethodBreakdown,
  getTopCustomersBySpending,
  getCustomerSpendingComparison,
  getLowStockProducts,
  getOrderById,
  getOrders,
  getProductById,
  getProducts,
  getSalesReport,
  getSetting,
  setSetting,
  updateCategory,
  updateCustomer,
  updateOrderStatus,
  updateProduct,
  createProduct,
  getOrCreateWallet,
  getWallet,
  loadWalletBalance,
  spendFromWallet,
  getWalletTransactions,
  addPaymentMethod,
  getPaymentMethods,
  recordTransaction,
  getUnusedTransactions,
  getTransactionsByAmount,
  matchTransaction,
  getTransactionHistory,
  searchTransactionsByCustomer,
  createForm,
  getForm,
  listForms,
  updateFormSpent,
  updateFormStatus,
  updateForm,
  createCreditAccount,
  getCreditAccount,
  listCreditAccounts,
  updateCreditBalance,
  recordCreditTransaction,
  getCreditTransactionHistory,
  recordAuditLog,
  getAuditLogs,
  createBranch,
  listBranches,
  createServingPoint,
  listServingPoints,
  createSupplier,
  listSuppliers,
  assignUserRole,
  getUserRoles,
  createKitchenStaff,
  getKitchenStaff,
  listKitchenStaff,
  updateKitchenStaffStatus,
  updateKitchenStaffMetrics,
  recordOrderStatus,
  getOrderStatusHistory,
  getKitchenQueue,
  updateOrderStatusInKDS,
  getKdsSettings,
  updateKdsSettings,
  createKdsSettings,
  createStaffProfile,
  getStaffProfile,
  getStaffProfileByUserId,
  listStaffProfiles,
  updateStaffProfile,
  deleteStaffProfile,
  recordStaffActivity,
  getStaffActivityLogs,
  getUserActivitySummary,
} from "./db";
import { initiateStkPush, queryStkStatus } from "./mpesa";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";

// ─── Categories Router ─────────────────────────────────────────────────────
const categoriesRouter = router({
  list: publicProcedure.query(() => getCategories()),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ input }) => {
      await createCategory(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCategory(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { success: true };
    }),
});

// ─── Products Router ───────────────────────────────────────────────────────
const productsRouter = router({
  list: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      search: z.string().optional(),
      isActive: z.boolean().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(({ input }) => getProducts(input ?? {})),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProductById(input.id)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      sku: z.string().optional(),
      price: z.string(),
      originalPrice: z.string().optional(),
      categoryId: z.number().optional(),
      imageUrl: z.string().optional(),
      stockQuantity: z.number().default(0),
      lowStockThreshold: z.number().default(10),
      barcode: z.string().optional(),
      unit: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createProduct({ ...input, isActive: true });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      sku: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional().nullable(),
      categoryId: z.number().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      stockQuantity: z.number().optional(),
      lowStockThreshold: z.number().optional(),
      barcode: z.string().optional(),
      unit: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateProduct(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteProduct(input.id);
      return { success: true };
    }),

  lowStock: protectedProcedure.query(() => getLowStockProducts()),

  adjustStock: protectedProcedure
    .input(z.object({
      productId: z.number(),
      changeType: z.enum(["restock", "adjustment", "return", "damage"]),
      quantityChange: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const newQty = await adjustStock(
        input.productId,
        input.changeType,
        input.quantityChange,
        undefined,
        input.notes,
        ctx.user?.id
      );
      return { success: true, newQuantity: newQty };
    }),

  uploadImage: protectedProcedure
    .input(z.object({ base64: z.string(), filename: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `products/${Date.now()}-${input.filename}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});

// ─── Customers Router ──────────────────────────────────────────────────────
const customersRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), page: z.number().optional(), limit: z.number().optional() }).optional())
    .query(({ input }) => getCustomers(input ?? {})),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCustomerById(input.id)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      address: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await createCustomer(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCustomer(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCustomer(input.id);
      return { success: true };
    }),

  purchaseHistory: protectedProcedure
    .input(z.object({ customerId: z.number(), page: z.number().optional() }))
    .query(({ input }) => getOrders({ customerId: input.customerId, page: input.page })),
});

// ─── Orders Router ─────────────────────────────────────────────────────────
const ordersRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      paymentStatus: z.string().optional(),
      customerId: z.number().optional(),
      fromDate: z.date().optional(),
      toDate: z.date().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
      search: z.string().optional(),
    }).optional())
    .query(({ input }) => getOrders(input ?? {})),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getOrderById(input.id)),

  create: protectedProcedure
    .input(z.object({
      customerId: z.number().optional(),
      customerName: z.string().optional(),
      items: z.array(z.object({
        productId: z.number().optional(),
        productName: z.string(),
        productSku: z.string().optional(),
        quantity: z.number().min(1),
        unitPrice: z.string(),
        originalPrice: z.string().optional(),
        discountAmount: z.string().optional(),
        totalPrice: z.string(),
      })),
      subtotal: z.string(),
      taxAmount: z.string(),
      discountAmount: z.string().optional(),
      totalAmount: z.string(),
      paymentMethod: z.enum(["cash", "mpesa", "stripe", "mixed", "wallet"]),
      cashReceived: z.string().optional(),
      cashChange: z.string().optional(),
      status: z.enum(["pending", "completed"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const orderNumber = await generateOrderNumber();
      const id = await createOrder(
        {
          orderNumber,
          customerId: input.customerId,
          customerName: input.customerName || "Walk-in Customer",
          subtotal: input.subtotal,
          taxAmount: input.taxAmount,
          discountAmount: input.discountAmount ?? "0",
          totalAmount: input.totalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus: "paid",
          orderStatus: "completed",
          notes: input.notes,
        },
        input.items.map((item) => ({
          ...item,
          discountAmount: item.discountAmount ?? "0",
        }))
      );

      // Update customer total spent
      if (input.customerId && input.paymentMethod === "cash") {
        const customer = await getCustomerById(input.customerId);
        if (customer) {
          const newTotal = Number(customer.totalSpent || 0) + Number(input.totalAmount);
          await updateCustomer(input.customerId, { totalSpent: String(newTotal) });
        }
      }

      // Notify owner for large transactions
      const amount = Number(input.totalAmount);
      if (amount >= 10000) {
        await notifyOwner({
          title: "Large Transaction Alert",
          content: `Order ${orderNumber} for KES ${amount.toLocaleString()} via ${input.paymentMethod.toUpperCase()}`,
        }).catch(console.error);
      }

      // Check low stock and notify
      const lowStock = await getLowStockProducts();
      if (lowStock.length > 0) {
        const names = lowStock.slice(0, 3).map((p) => `${p.name} (${p.stockQuantity} left)`).join(", ");
        await notifyOwner({
          title: "Low Stock Alert",
          content: `${lowStock.length} product(s) running low: ${names}`,
        }).catch(console.error);
      }

      return { success: true, orderId: id, orderNumber };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      orderStatus: z.string().optional(),
      paymentStatus: z.string().optional(),
      mpesaTransactionId: z.string().optional(),
      receiptUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateOrderStatus(id, data);
      // Update customer total spent when order paid
      if (data.paymentStatus === "paid") {
        const order = await getOrderById(id);
        if (order?.customerId) {
          const customer = await getCustomerById(order.customerId);
          if (customer) {
            const newTotal = Number(customer.totalSpent || 0) + Number(order.totalAmount);
            await updateCustomer(order.customerId, { totalSpent: String(newTotal) });
          }
        }
      }
      return { success: true };
    }),
});

// ─── Payments Router ───────────────────────────────────────────────────────
const paymentsRouter = router({
  initiateMpesa: protectedProcedure
    .input(z.object({
      phone: z.string(),
      amount: z.number(),
      id: z.number(),
      orderNumber: z.string(),
      callbackUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const callbackUrl = input.callbackUrl ?? `${process.env.APP_URL ?? "https://example.com"}/api/mpesa/callback`;
      try {
        const result = await initiateStkPush({
          phone: input.phone,
          amount: input.amount,
          id: input.orderNumber,
          description: `KenPOS Order ${input.orderNumber}`,
          callbackUrl,
        });
        return {
          success: true,
          checkoutRequestId: result.CheckoutRequestID,
          merchantRequestId: result.MerchantRequestID,
          message: result.CustomerMessage,
        };
      } catch (error: any) {
        // In sandbox/dev mode without real credentials, simulate success
        if (process.env.MPESA_CONSUMER_KEY === "sandbox" || !process.env.MPESA_CONSUMER_KEY) {
          return {
            success: true,
            checkoutRequestId: `sim_${Date.now()}`,
            merchantRequestId: `sim_merchant_${Date.now()}`,
            message: "STK Push sent (simulation mode)",
            simulated: true,
          };
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  queryMpesaStatus: protectedProcedure
    .input(z.object({ checkoutRequestId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await queryStkStatus(input.checkoutRequestId);
        return result;
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  createStripeIntent: protectedProcedure
    .input(z.object({ amount: z.number(), id: z.number(), orderNumber: z.string() }))
    .mutation(async ({ input }) => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe not configured" });
      }
      const stripe = new Stripe(stripeKey);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(input.amount * 100), // cents
        currency: "kes",
        metadata: { id: String(input.id), orderNumber: input.orderNumber },
      });
      return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
    }),

  addMethod: protectedProcedure
    .input(z.object({
      id: z.number(),
      method: z.enum(["cash", "mpesa", "wallet", "card"]),
      amount: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      await addPaymentMethod(input.id, {
        methodType: input.method as any,
      });
      return { success: true };
    }),

  confirmStripe: protectedProcedure
    .input(z.object({ id: z.number(), paymentIntentId: z.string() }))
    .mutation(async ({ input }) => {
      await updateOrderStatus(input.id, {
        paymentStatus: "paid",
        orderStatus: "completed",
        stripePaymentIntentId: input.paymentIntentId,
      } as any);
      return { success: true };
    }),
});

// ─── Reports Router ────────────────────────────────────────────────────────
const reportsRouter = router({
  dashboard: protectedProcedure.query(() => getDashboardStats()),

  sales: protectedProcedure
    .input(z.object({
      fromDate: z.date(),
      toDate: z.date(),
    }))
    .query(({ input }) => getSalesReport(input.fromDate, input.toDate)),

  salesReport: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    }))
    .query(async ({ input }) => {
      const from = new Date(input.startDate + "T00:00:00");
      const to = new Date(input.endDate + "T23:59:59");
      const data = await getSalesReport(from, to);
      if (!data) return null;
      const timeline = (data.dailySales ?? []).map((d: any) => ({
        date: d.date,
        revenue: d.totalRevenue,
        orderCount: d.totalOrders,
        tax: Number(d.totalRevenue) * 0.16 / 1.16,
      }));
      return {
        totalRevenue: data.summary?.totalRevenue ?? 0,
        totalOrders: Number(data.summary?.totalOrders ?? 0),
        totalTax: data.summary?.totalTax ?? 0,
        avgOrderValue: data.summary?.avgOrderValue ?? 0,
        timeline,
      };
    }),

  paymentBreakdown: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      const from = new Date(input.startDate + "T00:00:00");
      const to = new Date(input.endDate + "T23:59:59");
      const data = await getSalesReport(from, to);
      if (!data) return [];
      return (data.paymentBreakdown ?? []).map((p: any) => ({
        method: p.paymentMethod,
        revenue: p.total,
        count: p.count,
      }));
    }),

  topProducts: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const from = new Date(input.startDate + "T00:00:00");
      const to = new Date(input.endDate + "T23:59:59");
      const data = await getSalesReport(from, to);
      if (!data) return [];
      return (data.topProducts ?? []).slice(0, input.limit ?? 10).map((p: any) => ({
        productId: 0,
        productName: p.productName,
        totalQuantity: p.totalQty,
        totalRevenue: p.totalRevenue,
      }));
    }),

  inventoryLogs: protectedProcedure
    .input(z.object({ productId: z.number().optional(), limit: z.number().optional() }))
    .query(({ input }) => getInventoryLogs(input.productId, input.limit)),

  customerSpendingWeekly: protectedProcedure
    .input(z.object({ customerId: z.number(), weeksBack: z.number().optional() }))
    .query(async ({ input }) => {
      const { getCustomerSpendingByWeek } = await import("./db");
      return getCustomerSpendingByWeek(input.customerId, input.weeksBack ?? 12);
    }),

  customerSpendingMonthly: protectedProcedure
    .input(z.object({ customerId: z.number(), monthsBack: z.number().optional() }))
    .query(async ({ input }) => {
      const { getCustomerSpendingByMonth } = await import("./db");
      return getCustomerSpendingByMonth(input.customerId, input.monthsBack ?? 12);
    }),

  customerSpendingTrends: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const { getCustomerSpendingTrends } = await import("./db");
      return getCustomerSpendingTrends(input.customerId);
    }),

  customerPaymentBreakdown: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const { getCustomerPaymentMethodBreakdown } = await import("./db");
      return getCustomerPaymentMethodBreakdown(input.customerId);
    }),

  topCustomers: protectedProcedure
    .input(z.object({ limit: z.number().optional(), monthsBack: z.number().optional() }))
    .query(async () => {
      const { getTopCustomersBySpending } = await import("./db");
      return getTopCustomersBySpending(10, 3);
    }),

  customerComparison: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const { getCustomerSpendingComparison } = await import("./db");
      return getCustomerSpendingComparison(input.customerId);
    }),
});

// ─── Settings Router ───────────────────────────────────────────────────────
const settingsRouter = router({
  getAll: protectedProcedure.query(() => getAllSettings()),

  get: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(({ input }) => getSetting(input.key)),

  set: protectedProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ input }) => {
      await setSetting(input.key, input.value);
      return { success: true };
    }),

  setMany: protectedProcedure
    .input(z.array(z.object({ key: z.string(), value: z.string() })))
    .mutation(async ({ input }) => {
      await Promise.all(input.map((s) => setSetting(s.key, s.value)));
      return { success: true };
    }),
});

// ─── Wallet Router ────────────────────────────────────────────────────────
const walletRouter = router({
  get: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const wallet = await getWallet(input.customerId);
      return wallet;
    }),

  load: protectedProcedure
    .input(z.object({ customerId: z.number(), amount: z.number().positive(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const newBalance = await loadWalletBalance(input.customerId, input.amount, input.description || "Wallet load");
      await notifyOwner({
        title: "Wallet Loaded",
        content: `Customer wallet loaded with KES ${input.amount}. New balance: KES ${newBalance}`,
      });
      return { success: true, newBalance };
    }),

  transactions: protectedProcedure
    .input(z.object({ customerId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getWalletTransactions(input.customerId, input.limit);
    }),

  deduct: protectedProcedure
    .input(z.object({ customerId: z.number(), amount: z.number().positive() }))
    .mutation(async ({ input }) => {
      const wallet = await getWallet(input.customerId);
      if (!wallet || Number(wallet.balance) < input.amount) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Insufficient wallet balance",
        });
      }
      const newBalance = Number(wallet.balance) - input.amount;
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(customerWallets)
        .set({
          balance: newBalance.toString(),
          totalSpent: (Number(wallet.totalSpent) + input.amount).toString(),
        })
        .where(eq(customerWallets.id, wallet.id));
      return { success: true, newBalance };
    }),
});

// ─── Transactions Router ───────────────────────────────────────────────────
const transactionsRouter = router({
  record: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        method: z.enum(["mpesa", "wallet", "card"]),
        amount: z.number().positive(),
        customerName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await recordTransaction({
        transactionId: input.transactionId,
        paymentMethod: input.method,
        amount: input.amount.toString(),
        notes: input.customerName,
        status: "unused",
      });
      return { success: true };
    }),

  unused: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      return getUnusedTransactions(input.search);
    }),

  byAmount: protectedProcedure
    .input(z.object({ amount: z.number().positive(), method: z.string().optional() }))
    .query(async ({ input }) => {
      return getTransactionsByAmount(input.amount, input.method);
    }),

  match: protectedProcedure
    .input(z.object({ transactionId: z.string(), customerId: z.number(), id: z.number() }))
    .mutation(async ({ input }) => {
      await matchTransaction(input.transactionId, input.customerId, input.id);
      return { success: true };
    }),

  history: protectedProcedure
    .input(z.object({ customerId: z.number().optional(), method: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getTransactionHistory(input.customerId, input.method, input.limit);
    }),

  search: protectedProcedure
    .input(z.object({ customerName: z.string() }))
    .query(async ({ input }) => {
      return searchTransactionsByCustomer(input.customerName);
    }),
});

// ─── Forms Router ──────────────────────────────────────────────────────────
const formsRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string(), code: z.string(), amount: z.number().positive(), servingDate: z.date().optional(), servingPointId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const result = await createForm({
        title: input.title,
        code: input.code,
        amount: input.amount.toString(),
        servingDate: input.servingDate,
        servingPointId: input.servingPointId,
      });
      await recordAuditLog({
        module: "POS",
        userId: ctx.user?.id,
        action: "CREATE",
        entityType: "Form",
        beforeValue: input,
      });
      return result;
    }),

  list: protectedProcedure.query(async () => {
    return listForms();
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getForm(input.id);
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await updateFormStatus(input.id, input.status);
      await recordAuditLog({
        module: "POS",
        userId: ctx.user?.id,
        action: "UPDATE",
        entityType: "Form",
        entityId: input.id,
        beforeValue: { status: input.status },
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string(), code: z.string(), amount: z.number().positive(), servingDate: z.date().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const result = await updateForm(id, {
        title: data.title,
        code: data.code,
        amount: data.amount.toString(),
        servingDate: data.servingDate,
      });
      await recordAuditLog({
        module: "POS",
        userId: ctx.user?.id,
        action: "UPDATE",
        entityType: "Form",
        entityId: id,
        beforeValue: data,
      });
      return result;
    }),
});

// ─── Credit Router ──────────────────────────────────────────────────────────
const creditRouter = router({
  create: protectedProcedure
    .input(z.object({ studentName: z.string(), studentId: z.string().optional(), customerId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const result = await createCreditAccount({
        customerId: input.customerId || 0,
        creditLimit: "0",
      });
      await recordAuditLog({
        module: "POS",
        userId: ctx.user?.id,
        action: "CREATE",
        entityType: "CreditAccount",
        beforeValue: input,
      });
      return result;
    }),

  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ input }) => {
      return listCreditAccounts(input.status);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCreditAccount(input.id);
    }),

  history: protectedProcedure
    .input(z.object({ creditAccountId: z.number() }))
    .query(async ({ input }) => {
      return getCreditTransactionHistory(input.creditAccountId);
    }),
});

// ─── Audit Router ──────────────────────────────────────────────────────────
const auditRouter = router({
  list: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      action: z.string().optional(),
      module: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return getAuditLogs(input);
    }),
});

// ─── Branches Router ────────────────────────────────────────────────────────
const branchesRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string(), location: z.string().optional(), phone: z.string().optional() }))
    .mutation(async ({ input }) => {
      return createBranch(input);
    }),

  list: protectedProcedure.query(async () => {
    return listBranches();
  }),
});

// ─── Serving Points Router ─────────────────────────────────────────────────
const servingPointsRouter = router({
  create: protectedProcedure
    .input(z.object({ branchId: z.number(), name: z.string(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      return createServingPoint(input);
    }),

  list: protectedProcedure
    .input(z.object({ branchId: z.number().optional() }))
    .query(async ({ input }) => {
      return listServingPoints(input.branchId);
    }),
});

// ─── Suppliers Router ──────────────────────────────────────────────────────
const suppliersRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string(), phone: z.string().optional(), email: z.string().optional() }))
    .mutation(async ({ input }) => {
      return createSupplier(input);
    }),

  list: protectedProcedure.query(async () => {
    return listSuppliers();
  }),
});

const kdsRouter = router({
  listStaff: protectedProcedure
    .input(z.object({ active: z.boolean().optional() }))
    .query(async ({ input }) => {
      return listKitchenStaff(input.active);
    }),

  updateOrderStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string(), staffId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      await updateOrderStatusInKDS(input.id, input.status, input.staffId);
      await recordAuditLog({
        module: "POS",
        userId: ctx.user?.id,
        action: "UPDATE",
        entityType: "Order",
        entityId: input.id,
        beforeValue: { status: input.status },
      });
      return { success: true };
    }),

  getQueue: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ input }) => {
      return getKitchenQueue(input.status);
    }),

  getOrderHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getOrderStatusHistory(input.id);
    }),
});

// ─── Staff Management Router ───────────────────────────────────────────────
const staffRouter = router({
  createProfile: protectedProcedure
    .input(z.object({
      userId: z.number(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phoneNumber: z.string().optional(),
      employeeId: z.string().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      hireDate: z.date().optional(),
      branchId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const profile = await createStaffProfile(input);
      await recordStaffActivity({
        userId: ctx.user?.id,
        activityType: "manage_user",
        description: `Created staff profile for user ${input.userId}`,
        status: "success",
      });
      return profile;
    }),

  getProfile: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getStaffProfile(input.id);
    }),

  getByUserId: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return getStaffProfileByUserId(input.userId);
    }),

  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      branchId: z.number().optional(),
      department: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return listStaffProfiles(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phoneNumber: z.string().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended", "on_leave"]).optional(),
      branchId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      await updateStaffProfile(id, updateData as any);
      await recordStaffActivity({
        userId: ctx.user?.id,
        activityType: "status_change",
        description: `Updated staff profile ${id}`,
        entityType: "StaffProfile",
        entityId: id,
        status: "success",
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteStaffProfile(input.id);
      await recordStaffActivity({
        userId: ctx.user?.id,
        activityType: "manage_user",
        description: `Deleted staff profile ${input.id}`,
        entityType: "StaffProfile",
        entityId: input.id,
        status: "success",
      });
      return { success: true };
    }),

  getActivityLogs: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      activityType: z.string().optional(),
      days: z.number().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      if (input.userId && input.days) {
        return getUserActivitySummary(input.userId, input.days);
      }
      return getStaffActivityLogs({
        userId: input.userId,
        activityType: input.activityType,
        limit: input.limit,
      });
    }),
});

// ─── App Router ────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  categories: categoriesRouter,
  products: productsRouter,
  customers: customersRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
  reports: reportsRouter,
  settings: settingsRouter,
  wallet: walletRouter,
  transactions: transactionsRouter,
  forms: formsRouter,
  credit: creditRouter,
  audit: auditRouter,
  branches: branchesRouter,
  servingPoints: servingPointsRouter,
  suppliers: suppliersRouter,
  kds: kdsRouter,
  staff: staffRouter,
});

export type AppRouter = typeof appRouter;
