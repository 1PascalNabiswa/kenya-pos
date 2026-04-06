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

    const result = await caller.forms.create({
      title: "Team Lunch",
      code: "FORM-001",
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

    // Create a form first
    const created = await caller.forms.create({
      title: "Test Form",
      code: "TEST-001",
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
