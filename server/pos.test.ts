import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Food", description: "Food items", color: "#3B82F6", icon: "🍽️", sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, name: "Beverages", description: "Drinks", color: "#10B981", icon: "🥤", sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getProducts: vi.fn().mockResolvedValue({
    items: [
      { id: 1, name: "Ugali & Sukuma Wiki", sku: "FOOD-001", categoryId: 1, price: "150", costPrice: "80", stockQuantity: 50, unit: "plate", isActive: true, description: "Traditional Kenyan ugali", imageUrl: null, lowStockThreshold: 5, createdAt: new Date(), updatedAt: new Date() },
    ],
    total: 1,
  }),
  getProductById: vi.fn().mockResolvedValue({ id: 1, name: "Ugali & Sukuma Wiki", price: "150", stockQuantity: 50 }),
  getCustomers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getOrders: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getOrderById: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    todayOrders: 5,
    todayRevenue: 2500,
    monthOrders: 120,
    monthRevenue: 65000,
    productCount: 25,
    customerCount: 10,
    lowStockCount: 2,
    weeklyRevenue: [],
    recentOrders: [],
    lowStockProducts: [],
  }),
  getAllSettings: vi.fn().mockResolvedValue([
    { key: "store_name", value: "KenPOS Store" },
    { key: "tax_rate", value: "16" },
  ]),
  getSetting: vi.fn().mockResolvedValue({ key: "store_name", value: "KenPOS Store" }),
  setSetting: vi.fn().mockResolvedValue(undefined),
  getLowStockProducts: vi.fn().mockResolvedValue([]),
  generateOrderNumber: vi.fn().mockResolvedValue("KEN-20250403-001"),
  createOrder: vi.fn().mockResolvedValue(1),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  updateCustomer: vi.fn().mockResolvedValue(undefined),
  getCustomerById: vi.fn().mockResolvedValue(undefined),
  createProduct: vi.fn().mockResolvedValue(1),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  adjustStock: vi.fn().mockResolvedValue(undefined),
  getInventoryLogs: vi.fn().mockResolvedValue([]),
  createCustomer: vi.fn().mockResolvedValue(1),
  deleteCustomer: vi.fn().mockResolvedValue(undefined),
  createCategory: vi.fn().mockResolvedValue(1),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getSalesReport: vi.fn().mockResolvedValue({
    summary: { totalOrders: 10, totalRevenue: 5000, totalTax: 693, avgOrderValue: 500 },
    paymentBreakdown: [{ paymentMethod: "cash", count: 8, total: 4000 }, { paymentMethod: "mpesa", count: 2, total: 1000 }],
    topProducts: [{ productName: "Ugali & Sukuma Wiki", totalQty: 20, totalRevenue: 3000 }],
    dailySales: [{ date: "2025-04-03", totalOrders: 5, totalRevenue: 2500 }],
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./mpesa", () => ({
  initiateStkPush: vi.fn().mockResolvedValue({
    CheckoutRequestID: "ws_CO_test123",
    MerchantRequestID: "merchant_test123",
    CustomerMessage: "STK Push sent",
  }),
  queryStkStatus: vi.fn().mockResolvedValue({ ResultCode: "0", ResultDesc: "Success" }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@kenpos.co.ke",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("KenPOS - Categories Router", () => {
  it("should list all categories", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe("KenPOS - Products Router", () => {
  it("should list products with pagination", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list({});
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should list products filtered by category", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list({ categoryId: 1 });
    expect(result).toHaveProperty("items");
  });

  it("should list products with search", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list({ search: "ugali" });
    expect(result).toHaveProperty("items");
  });
});

describe("KenPOS - Orders Router", () => {
  it("should create a cash order", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.create({
      items: [
        {
          productId: 1,
          productName: "Ugali & Sukuma Wiki",
          productSku: "FOOD-001",
          quantity: 2,
          unitPrice: "150",
          originalPrice: "150",
          discountAmount: "0",
          totalPrice: "300",
        },
      ],
      subtotal: "300",
      taxAmount: "41.38",
      totalAmount: "341.38",
      paymentMethod: "cash",
      cashReceived: "400",
      cashChange: "58.62",
    });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("orderId");
    expect(result).toHaveProperty("orderNumber");
  });

  it("should list orders with filters", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.list({ page: 1, limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });
});

describe("KenPOS - Payments Router", () => {
  it("should initiate M-Pesa STK push", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.payments.initiateMpesa({
      phone: "+254712345678",
      amount: 500,
      orderId: 1,
      orderNumber: "KEN-20250403-001",
    });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("checkoutRequestId");
  });
});

describe("KenPOS - Reports Router", () => {
  it("should return dashboard stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reports.dashboard();
    expect(result).toHaveProperty("todayOrders");
    expect(result).toHaveProperty("todayRevenue");
    expect(result).toHaveProperty("monthRevenue");
    expect(result).toHaveProperty("productCount");
  });

  it("should return sales report", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reports.salesReport({
      startDate: "2025-04-01",
      endDate: "2025-04-30",
      groupBy: "day",
    });
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("totalOrders");
    expect(result).toHaveProperty("timeline");
  });

  it("should return payment breakdown", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reports.paymentBreakdown({
      startDate: "2025-04-01",
      endDate: "2025-04-30",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return top products", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reports.topProducts({
      startDate: "2025-04-01",
      endDate: "2025-04-30",
      limit: 5,
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("KenPOS - Settings Router", () => {
  it("should get all settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should set a setting value", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.set({ key: "store_name", value: "My Test Store" });
    expect(result).toHaveProperty("success", true);
  });

  it("should set multiple settings at once", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.setMany([
      { key: "store_name", value: "My Test Store" },
      { key: "tax_rate", value: "16" },
    ]);
    expect(result).toHaveProperty("success", true);
  });
});

describe("KenPOS - Auth Router", () => {
  it("should return null for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("should return user for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("role", "admin");
  });
});
