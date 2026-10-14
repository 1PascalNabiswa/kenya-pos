import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Forms Router", () => {
  it("should create a new form", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const suffix = Date.now();

    const result = await caller.forms.create({
      title: `Team Lunch ${suffix}`,
      code: `FORM-${suffix}`,
      amount: 5000,
    });

    expect(result).toBeDefined();
  });

  it("should list all forms", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const forms = await caller.forms.list();
    expect(Array.isArray(forms)).toBe(true);
  });

  it("should update form status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const suffix = Date.now();

    // Create a form first
    const created = await caller.forms.create({
      title: `Test Form ${suffix}`,
      code: `TEST-${suffix}`,
      amount: 3000,
    });

    // Update its status
    const result = await caller.forms.updateStatus({
      id: 1,
      status: "paid",
    });

    expect(result.success).toBe(true);
  });
});

describe("Credit Router", () => {
  it("should create a credit account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credit.create({
      studentName: "John Doe",
      studentId: "STU-001",
    });

    expect(result).toBeDefined();
  });

  it("should list credit accounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const credits = await caller.credit.list({});
    expect(Array.isArray(credits)).toBe(true);
  });

  it("should filter credit accounts by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activeCredits = await caller.credit.list({ status: "active" });
    expect(Array.isArray(activeCredits)).toBe(true);
  });

  it("should get credit transaction history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.credit.history({ creditAccountId: 1 });
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Audit Router", () => {
  it("should list audit logs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.audit.list({});
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should filter audit logs by action", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.audit.list({ action: "CREATE" });
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should filter audit logs by module", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.audit.list({ module: "Sales" });
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should respect limit parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.audit.list({ limit: 10 });
    expect(logs.length).toBeLessThanOrEqual(10);
  });
});

describe("Branches Router", () => {
  it("should create a new branch", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.branches.create({
      name: "Westlands Branch",
      location: "Westlands, Nairobi",
      phone: "+254712345678",
    });

    expect(result).toBeDefined();
  });

  it("should list all branches", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const branches = await caller.branches.list();
    expect(Array.isArray(branches)).toBe(true);
  });
});

describe("Suppliers Router", () => {
  it("should create a new supplier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.suppliers.create({
      name: "Fresh Produce Ltd",
      phone: "+254712345678",
      email: "supplier@example.com",
    });

    expect(result).toBeDefined();
  });

  it("should list all suppliers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const suppliers = await caller.suppliers.list();
    expect(Array.isArray(suppliers)).toBe(true);
  });

  it("should create supplier without optional fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.suppliers.create({
      name: "Basic Supplier",
    });

    expect(result).toBeDefined();
  });
});

describe("Serving Points Router", () => {
  it("should create a serving point", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.servingPoints.create({
      branchId: 1,
      name: "Main Counter",
      description: "Main serving counter",
    });

    expect(result).toBeDefined();
  });

  it("should list serving points", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const points = await caller.servingPoints.list({});
    expect(Array.isArray(points)).toBe(true);
  });

  it("should filter serving points by branch", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const points = await caller.servingPoints.list({ branchId: 1 });
    expect(Array.isArray(points)).toBe(true);
  });
});

describe("Multi-branch rollout", () => {
  it("completes the stock transfer lifecycle", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const branches = await caller.branches.list();
    expect(branches.length).toBeGreaterThanOrEqual(2);
    const products = await caller.products.list({ isActive: true, limit: 1 });
    expect(products.items.length).toBeGreaterThan(0);

    const transfer = await caller.branches.initiateTransfer({
      fromBranchId: branches[0].id,
      toBranchId: branches[1].id,
      notes: `Automated lifecycle test ${Date.now()}`,
      items: [
        {
          productId: products.items[0].id,
          productName: products.items[0].name,
          quantity: 1,
        },
      ],
    });
    expect(transfer.transferId).toBeGreaterThan(0);

    await caller.branches.approveTransfer({ transferId: transfer.transferId });
    const inTransit = await caller.branches.getTransferDetails({
      transferId: transfer.transferId,
    });
    expect(inTransit?.status).toBe("in_transit");
    expect(inTransit?.items[0]?.id).toBeDefined();

    await caller.branches.receiveTransfer({
      transferId: transfer.transferId,
      items: [{ itemId: inTransit!.items[0].id, receivedQuantity: 1 }],
    });
    const received = await caller.branches.getTransferDetails({
      transferId: transfer.transferId,
    });
    expect(received?.status).toBe("received");
    expect(received?.items[0]?.receivedQuantity).toBe(1);
  });

  it("assigns and removes branch access for a user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const branches = await caller.branches.list();
    const branch = branches[0];

    await caller.branches.assignUser({
      userId: ctx.user!.id,
      branchId: branch.id,
      isPrimary: true,
    });
    const assigned = await caller.branches.getUserBranches({
      userId: ctx.user!.id,
    });
    expect(assigned.some(item => item.branchId === branch.id)).toBe(true);

    await caller.branches.removeUser({
      userId: ctx.user!.id,
      branchId: branch.id,
    });
    const afterRemoval = await caller.branches.getUserBranches({
      userId: ctx.user!.id,
    });
    expect(afterRemoval.some(item => item.branchId === branch.id)).toBe(false);
  });

  it("blocks branch enumeration and unscoped inventory for non-admin users", async () => {
    const { ctx } = createAuthContext();
    ctx.user = { ...ctx.user!, id: 999999, role: "cashier" };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.branches.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.products.list({})).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("returns dashboard KPIs for the selected branch", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const branches = await caller.branches.list();
    const stats = await caller.reports.dashboard({ branchId: branches[0].id });
    expect(stats).toEqual(
      expect.objectContaining({
        todayRevenue: expect.anything(),
        monthRevenue: expect.anything(),
        productCount: expect.any(Number),
      })
    );
  });
});
