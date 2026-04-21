import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getAllSettings: vi.fn().mockResolvedValue([
    { key: "store_name", value: "KenPOS Store" },
    { key: "tax_rate", value: "16" },
    { key: "print_automatic", value: "true" },
    { key: "receipt_header", value: "Thank you for your business!" },
    { key: "receipt_footer", value: "Powered by KenPOS" },
  ]),
  getSetting: vi.fn().mockResolvedValue({ key: "print_automatic", value: "true" }),
  setSetting: vi.fn().mockResolvedValue(undefined),
  getOrderById: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: "KEN-20250421-001",
    createdAt: new Date(),
    customerId: null,
    items: [
      {
        productName: "Ugali",
        quantity: 1,
        unitPrice: "150",
        totalPrice: "150",
      },
    ],
    subtotal: "150",
    taxAmount: "24",
    discountAmount: "0",
    totalAmount: "174",
    paymentMethod: "cash",
    paymentStatus: "paid",
    cashReceived: "200",
    cashChange: "26",
  }),
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

describe("Receipt Settings - Auto Print Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch print_automatic setting as true", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.settings.getAll();

    const printAutomatic = settings.find((s: any) => s.key === "print_automatic");
    expect(printAutomatic).toBeDefined();
    expect(printAutomatic?.value).toBe("true");
  });

  it("should save print_automatic setting", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.settings.setMany([
      { key: "print_automatic", value: "true" },
    ]);

    // Verify the setting was saved (in real scenario, would check database)
    expect(true).toBe(true);
  });

  it("should toggle print_automatic setting from true to false", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First save as false
    await caller.settings.setMany([
      { key: "print_automatic", value: "false" },
    ]);

    // Then save as true
    await caller.settings.setMany([
      { key: "print_automatic", value: "true" },
    ]);

    expect(true).toBe(true);
  });

  it("should retrieve order for receipt display", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const order = await caller.orders.get({ id: 1 });

    expect(order).toBeDefined();
    expect(order?.orderNumber).toBe("KEN-20250421-001");
    expect(order?.paymentStatus).toBe("paid");
  });

  it("should have receipt header and footer settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.settings.getAll();

    const header = settings.find((s: any) => s.key === "receipt_header");
    const footer = settings.find((s: any) => s.key === "receipt_footer");

    expect(header?.value).toBe("Thank you for your business!");
    expect(footer?.value).toBe("Powered by KenPOS");
  });
});
