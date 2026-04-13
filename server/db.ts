import { and, desc, eq, gte, ilike, like, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Category,
  Customer,
  InsertCategory,
  InsertCustomer,
  InsertOrder,
  InsertOrderItem,
  InsertProduct,
  InsertUser,
  Order,
  Product,
  CustomerWallet,
  InsertCustomerWallet,
  InsertWalletTransaction,
  InsertPaymentMethod,
  InsertTransactionReconciliation,
  categories,
  customers,
  inventoryLogs,
  orderItems,
  orders,
  products,
  settings,
  users,
  customerWallets,
  walletTransactions,
  paymentMethods,
  transactionReconciliation,
  forms,
  creditAccounts,
  creditTransactions,
  auditLogs,
  branches,
  servingPoints,
  suppliers,
  userRoles,
  Form,
  InsertForm,
  CreditAccount,
  InsertCreditAccount,
  AuditLog,
  InsertAuditLog,
  kitchenStaff,
  orderStatusHistory,
  kdsSettings,
  KitchenStaff,
  InsertKitchenStaff,
  OrderStatusHistory,
  InsertOrderStatusHistory,
  KdsSettings,
  InsertKdsSettings,
  staffProfiles,
  staffActivityLogs,
  StaffProfile,
  InsertStaffProfile,
  InsertStaffActivityLog,
  employmentTypes,
  staffEmployment,
  deductionTypes,
  payrollDeductions,
  bonusTypes,
  payrollBonuses,
  attendanceRecords,
  payrollRecords,
  payslips,
  payrollSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ─────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Categories ────────────────────────────────────────────────────────────
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(categories).values(data);
  return result;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Products ──────────────────────────────────────────────────────────────
export async function getProducts(opts?: {
  categoryId?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts?.categoryId) conditions.push(eq(products.categoryId, opts.categoryId));
  if (opts?.isActive !== undefined) conditions.push(eq(products.isActive, opts.isActive));
  if (opts?.search) {
    // Case-insensitive search: find letters anywhere in name or SKU
    conditions.push(
      or(
        like(products.name, `%${opts.search}%`),
        like(products.sku, `%${opts.search}%`)
      )
    );
  }

  // Build the query with proper where clause handling
  let query = db.select().from(products);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(products);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(products.name).limit(limit).offset(offset),
    countQuery,
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
}

export async function getLowStockProducts(threshold?: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        lte(products.stockQuantity, products.lowStockThreshold)
      )
    )
    .orderBy(products.stockQuantity);
}

export async function adjustStock(
  productId: number,
  changeType: "sale" | "restock" | "adjustment" | "return" | "damage",
  quantityChange: number,
  orderId?: number,
  notes?: string,
  createdBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const product = await getProductById(productId);
  if (!product) throw new Error("Product not found");
  const quantityBefore = product.stockQuantity ?? 0;
  const quantityAfter = quantityBefore + quantityChange;
  await db
    .update(products)
    .set({ stockQuantity: quantityAfter })
    .where(eq(products.id, productId));
  await db.insert(inventoryLogs).values({
    productId,
    changeType,
    quantityBefore,
    quantityChange,
    quantityAfter,
    orderId,
    notes,
    createdBy,
  });
  return quantityAfter;
}

// ─── Customers ─────────────────────────────────────────────────────────────
export async function getCustomers(opts?: { search?: string; page?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (opts?.search) {
    // Case-insensitive search: find letters anywhere in name, phone, or email
    conditions.push(
      or(
        like(customers.name, `%${opts.search}%`),
        like(customers.phone, `%${opts.search}%`),
        like(customers.email, `%${opts.search}%`)
      )
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult, walletData] = await Promise.all([
    db.select().from(customers).where(whereClause).orderBy(desc(customers.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(customers).where(whereClause),
    db.select().from(customerWallets),
  ]);
  
  // Create a map of customer ID to wallet data for quick lookup
  const walletMap = new Map(walletData.map(w => [w.customerId, w]));
  
  // Merge wallet totalSpent with customer data
  const itemsWithWalletData = items.map(customer => ({
    ...customer,
    totalSpent: walletMap.get(customer.id)?.totalSpent ?? "0",
  }));
  
  return { items: itemsWithWalletData, total: Number(countResult[0]?.count ?? 0) };
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(customers).values(data);
  return result;
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(customers).where(eq(customers.id, id));
}

// ─── Orders ────────────────────────────────────────────────────────────────
export async function generateOrderNumber() {
  const now = new Date();
  const prefix = `KEN${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const db = await getDb();
  if (!db) return `${prefix}0001`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(like(orders.orderNumber, `${prefix}%`));
  const count = Number(result[0]?.count ?? 0) + 1;
  return `${prefix}${String(count).padStart(4, "0")}`;
}

export async function createOrder(
  orderData: InsertOrder,
  items: Omit<InsertOrderItem, 'orderId' | 'id'>[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(orders).values(orderData);
  const id = (result as any)[0]?.insertId as number;
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map((item) => ({ ...item, orderId: id })));
  }
  // Deduct stock for each item
  for (const item of items) {
    if (item.productId) {
      await adjustStock(item.productId, "sale", -item.quantity, id, "POS sale");
    }
  }
  return id;
}

export async function getOrders(opts?: {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  customerId?: number;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (opts?.status) conditions.push(eq(orders.orderStatus, opts.status as any));
  if (opts?.paymentStatus) conditions.push(eq(orders.paymentStatus, opts.paymentStatus as any));
  if (opts?.paymentMethod) conditions.push(eq(orders.paymentMethod, opts.paymentMethod as any));
  if (opts?.customerId) conditions.push(eq(orders.customerId, opts.customerId));
  if (opts?.fromDate) conditions.push(gte(orders.createdAt, opts.fromDate));
  if (opts?.toDate) conditions.push(lte(orders.createdAt, opts.toDate));
  if (opts?.search) conditions.push(like(orders.orderNumber, `%${opts.search}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.name,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      orderStatus: orders.orderStatus,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
    }).from(orders).leftJoin(customers, eq(orders.customerId, customers.id)).where(whereClause).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(whereClause),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function updateOrderStatus(
  id: number,
  data: Partial<InsertOrder>,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

// ─── Reports ───────────────────────────────────────────────────────────────
export async function getSalesReport(fromDate: Date, toDate: Date) {
  const db = await getDb();
  if (!db) return null;
  const [summary] = await db
    .select({
      totalOrders: sql<number>`count(*)`,
      totalRevenue: sql<number>`sum(${orders.totalAmount})`,
      totalTax: sql<number>`sum(${orders.taxAmount})`,
      avgOrderValue: sql<number>`avg(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate),
      )
    );

  const paymentBreakdown = await db
    .select({
      methodType: orders.paymentMethod,
      count: sql<number>`count(*)`,
      total: sql<number>`sum(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate),
      )
    )
    .groupBy(orders.paymentMethod);

  const topProducts = await db
    .select({
      productName: orderItems.productName,
      totalQty: sql<number>`sum(${orderItems.quantity})`,
      totalRevenue: sql<number>`sum(${orderItems.totalPrice})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate),
      )
    )
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.totalPrice})`))
    .limit(10);

  const dailySales = await db
    .select({
      date: sql<string>`DATE(orders.createdAt)`,
      totalOrders: sql<number>`count(*)`,
      totalRevenue: sql<number>`sum(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate),
      )
    )
    .groupBy(sql`DATE(orders.createdAt)`)
    .orderBy(sql`DATE(orders.createdAt)`);

  return { summary, paymentBreakdown, topProducts, dailySales };
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayStats] = await db
    .select({
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
    })
    .from(orders)

  const [monthStats] = await db
    .select({
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
    })
    .from(orders)

  const [productCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, true));

  const [customerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers);

  const lowStock = await getLowStockProducts();

  const weeklyRevenue = await db
    .select({
      date: sql<string>`DATE(orders.createdAt)`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      orderCount: sql<number>`count(*)`,
    })
    .from(orders)
    .groupBy(sql`DATE(orders.createdAt)`)
    .orderBy(sql`DATE(orders.createdAt)`);

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.name,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      orderStatus: orders.orderStatus,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const paymentBreakdown = await db
    .select({
      paymentMethod: orders.paymentMethod,
      total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.orderStatus, 'completed'),
        gte(orders.createdAt, today),
        lt(orders.createdAt, tomorrow)
      )
    )
    .groupBy(orders.paymentMethod);

  return {
    todayOrders: Number(todayStats?.orders ?? 0),
    todayRevenue: Number(todayStats?.revenue ?? 0),
    monthOrders: Number(monthStats?.orders ?? 0),
    monthRevenue: Number(monthStats?.revenue ?? 0),
    productCount: Number(productCount?.count ?? 0),
    customerCount: Number(customerCount?.count ?? 0),
    lowStockCount: lowStock.length,
    weeklyRevenue,
    recentOrders,
    lowStockProducts: lowStock.slice(0, 5),
    paymentBreakdown,
  };
}

// ─── Settings ──────────────────────────────────────────────────────────────
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(settings);
}

// ─── Inventory Logs ────────────────────────────────────────────────────────
export async function getInventoryLogs(productId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const conditions = productId ? [eq(inventoryLogs.productId, productId)] : [];
  return db
    .select()
    .from(inventoryLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(inventoryLogs.createdAt))
    .limit(limit);
}


// ─── Customer Wallets ──────────────────────────────────────────────────────
export async function getOrCreateWallet(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const existing = await db
    .select()
    .from(customerWallets)
    .where(eq(customerWallets.customerId, customerId))
    .limit(1);
  
  if (existing.length > 0) return existing[0];
  
  const result = await db.insert(customerWallets).values({
    customerId,
    creditLimit: "0",
    totalLoaded: "0",
    totalSpent: "0",
  });
  
  return db
    .select()
    .from(customerWallets)
    .where(eq(customerWallets.customerId, customerId))
    .limit(1)
    .then((rows) => rows[0]);
}

export async function getWallet(customerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(customerWallets)
    .where(eq(customerWallets.customerId, customerId))
    .limit(1);
  return result[0] ?? null;
}

export async function loadWalletBalance(customerId: number, amount: number, description: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const wallet = await getOrCreateWallet(customerId);
  const newTotalLoaded = Number(wallet.totalLoaded) + amount;
  const newBalance = newTotalLoaded - Number(wallet.totalSpent);
  
  await db
    .update(customerWallets)
    .set({
      balance: newBalance.toString(),
      totalLoaded: newTotalLoaded.toString(),
    })
    .where(eq(customerWallets.id, wallet.id));
  
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    customerId,
    type: "load",
    amount: amount.toString(),
    description,
  });
  
  return newBalance;
}

export async function spendFromWallet(customerId: number, amount: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const wallet = await getWallet(customerId);
  if (!wallet) throw new Error("Wallet not found");
  
  const newTotalSpent = Number(wallet.totalSpent) + amount;
  const newBalance = Number(wallet.totalLoaded) - newTotalSpent;
  
  await db
    .update(customerWallets)
    .set({
      balance: newBalance.toString(),
      totalSpent: newTotalSpent.toString(),
    })
    .where(eq(customerWallets.id, wallet.id));
  
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    customerId,
    type: "spend",
    amount: amount.toString(),
    id,
  });
  
  return newBalance;
}

export async function getWalletTransactions(customerId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: walletTransactions.id,
      walletId: walletTransactions.walletId,
      customerId: walletTransactions.customerId,
      customerName: customers.name,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      description: walletTransactions.description,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .leftJoin(customers, eq(walletTransactions.customerId, customers.id))
    .where(eq(walletTransactions.customerId, customerId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

// ─── Payment Methods (Combined Payments) ────────────────────────────────────
export async function addPaymentMethod(id: number, data: Omit<InsertPaymentMethod, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(paymentMethods).values({ id, ...data });
}

export async function getPaymentMethods(id: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
}

// ─── Transaction Reconciliation ────────────────────────────────────────────
export async function recordTransaction(data: InsertTransactionReconciliation) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(transactionReconciliation).values(data);
  return result;
}

export async function getUnusedTransactions(search?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(transactionReconciliation.status, "unused")];
  if (search) {
    conditions.push(
      or(
        like(transactionReconciliation.transactionId, `%${search}%`)
      )
    );
  }
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionReconciliation.createdAt))
}

export async function getTransactionsByAmount(amount: number, method?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(transactionReconciliation.amount, amount.toString()),
    eq(transactionReconciliation.status, "unused"),
  ];
  
  if (method) {
    conditions.push(eq(transactionReconciliation.paymentMethod, method as any));
  }
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(and(...conditions))
    .orderBy(desc(transactionReconciliation.createdAt));
}

export async function matchTransaction(transactionId: string, customerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db
    .update(transactionReconciliation)
    .set({
      customerId,
      id,
      createdAt: new Date(),
    })
    .where(eq(transactionReconciliation.transactionId, transactionId));
}

export async function getTransactionHistory(customerId?: number, method?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (customerId) conditions.push(eq(transactionReconciliation.customerId, customerId));
  if (method) conditions.push(eq(transactionReconciliation.paymentMethod, method as any));
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionReconciliation.createdAt))
    .limit(limit);
}

export async function getUnusedTransactionReconciliation() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(
      and(
        eq(transactionReconciliation.status, "unused")
      )
    )
    .orderBy(desc(transactionReconciliation.createdAt));
}


// ─── Forms (Group Feeding) ─────────────────────────────────────────────────
export async function createForm(data: InsertForm) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(forms).values(data);
  return result;
}

export async function getForm(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  return result[0] || null;
}

export async function listForms() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(forms).orderBy(desc(forms.createdAt));
}

export async function updateFormSpent(id: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.update(forms).set({ spent: amount.toString() }).where(eq(forms.id, id));
}

export async function updateFormStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.update(forms).set({ status: status as any }).where(eq(forms.id, id));
}

export async function updateForm(id: number, data: { title: string; code: string; amount: string; servingDate?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const updateData: any = {
    title: data.title,
    code: data.code,
    amount: data.amount,
  };
  
  if (data.servingDate) {
    updateData.servingDate = data.servingDate;
  }
  
  await db.update(forms).set(updateData).where(eq(forms.id, id));
  return getForm(id);
}

// ─── Credit Accounts ───────────────────────────────────────────────────────
export async function createCreditAccount(data: InsertCreditAccount) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(creditAccounts).values(data);
  return result;
}

export async function getCreditAccount(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(creditAccounts).where(eq(creditAccounts.id, id)).limit(1);
  return result[0] || null;
}

export async function listCreditAccounts(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (status) conditions.push(eq(creditAccounts.status, status as any));
  
  return db
    .select()
    .from(creditAccounts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(creditAccounts.createdAt));
}

export async function updateCreditBalance(id: number, newBalance: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.update(creditAccounts).set({ creditLimit: newBalance.toString() }).where(eq(creditAccounts.id, id));
}

// ─── Credit Transactions ───────────────────────────────────────────────────
export async function recordCreditTransaction(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(creditTransactions).values(data);
  return result;
}

export async function getCreditTransactionHistory(creditAccountId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.creditAccountId, creditAccountId))
    .orderBy(desc(creditTransactions.createdAt));
}

// ─── Audit Logs ────────────────────────────────────────────────────────────
export async function recordAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] DB unavailable, log not recorded");
    return;
  }
  
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Audit] Failed to record log:", error);
  }
}

export async function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  module?: string;
  startDate?: number;
  endDate?: number;
  search?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters?.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters?.module) conditions.push(eq(auditLogs.module, filters.module));
  if (filters?.startDate) conditions.push(gte(auditLogs.timestamp, new Date(filters.startDate)));
  if (filters?.endDate) conditions.push(lte(auditLogs.timestamp, new Date(filters.endDate)));
  
  let query = db
    .select({
      id: auditLogs.id,
      timestamp: auditLogs.timestamp,
      userId: auditLogs.userId,
      userName: users.name,
      action: auditLogs.action,
      module: auditLogs.module,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      beforeValue: auditLogs.beforeValue,
      afterValue: auditLogs.afterValue,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.timestamp))
    .limit(filters?.limit || 1000);
  
  const results = await query;
  
  // Client-side search filtering
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return results.filter((log: any) => 
      (log.userName || '').toLowerCase().includes(searchLower) ||
      (log.userId?.toString() || '').includes(searchLower) ||
      (log.action || '').toLowerCase().includes(searchLower) ||
      (log.module || '').toLowerCase().includes(searchLower) ||
      (log.entityType || '').toLowerCase().includes(searchLower) ||
      (log.entityId?.toString() || '').includes(searchLower)
    );
  }
  
  return results;
}

export async function getTopActiveUsers(filters?: {
  limit?: number;
  startDate?: number;
  endDate?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.startDate) conditions.push(gte(auditLogs.timestamp, new Date(filters.startDate)));
  if (filters?.endDate) conditions.push(lte(auditLogs.timestamp, new Date(filters.endDate)));
  
  const results = await db
    .select({
      userId: auditLogs.userId,
      actionCount: sql<number>`COUNT(*) as actionCount`,
    })
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(auditLogs.userId)
    .orderBy(desc(sql<number>`COUNT(*)`));
  
  return results.slice(0, filters?.limit || 5);
}

// ─── Top Active Users ──────────────────────────────────────────────────────

// ─── Branches ──────────────────────────────────────────────────────────────
export async function createBranch(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(branches).values(data);
  return result;
}

export async function listBranches() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(branches).orderBy(desc(branches.createdAt));
}

// ─── Serving Points ────────────────────────────────────────────────────────
export async function createServingPoint(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(servingPoints).values(data);
  return result;
}

export async function listServingPoints(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (branchId) conditions.push(eq(servingPoints.branchId, branchId));
  
  return db
    .select()
    .from(servingPoints)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(servingPoints.createdAt));
}

// ─── Suppliers ─────────────────────────────────────────────────────────────
export async function createSupplier(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(suppliers).values(data);
  return result;
}

export async function listSuppliers() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

// ─── User Roles ────────────────────────────────────────────────────────────
export async function assignUserRole(userId: number, role: string, branchId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(userRoles).values({
    userId,
    role: role as any,
    branchId,
  });
  return result;
}

export async function getUserRoles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(userRoles).where(eq(userRoles.userId, userId));
}


// ─── Kitchen Display System (KDS) ──────────────────────────────────────────
export async function createKitchenStaff(data: InsertKitchenStaff) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(kitchenStaff).values(data);
  return result;
}

export async function getKitchenStaff(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(kitchenStaff).where(eq(kitchenStaff.id, id)).limit(1);
  return result[0] || null;
}

export async function listKitchenStaff(active?: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (active !== undefined) conditions.push(eq(kitchenStaff.isActive, active));
  
  return db
    .select()
    .from(kitchenStaff)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(kitchenStaff.station);
}

export async function updateKitchenStaffStatus(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.update(kitchenStaff).set({ isActive }).where(eq(kitchenStaff.id, id));
}

export async function updateKitchenStaffMetrics(id: number, ordersCompleted: number, avgPrepTime: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.update(kitchenStaff)
    .set({ ordersCompleted, averagePrepTime: avgPrepTime })
    .where(eq(kitchenStaff.id, id));
}

// Order status history
export async function recordOrderStatus(data: InsertOrderStatusHistory) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(orderStatusHistory).values(data);
  return result;
}

export async function getOrderStatusHistory(id: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.id, id))
    .orderBy(orderStatusHistory.createdAt);
}

export async function getKitchenQueue(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(orders.orderStatus, "processing" as any)];
  if (status) conditions.push(eq(orderStatusHistory.status, status as any));
  
  return db
    .select({
      order: orders,
      items: orderItems,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.id))
    .leftJoin(orderStatusHistory, eq(orders.id, orderStatusHistory.id))
    .where(and(...conditions))
    .orderBy(orders.createdAt);
}

export async function updateOrderStatusInKDS(id: number, newStatus: string, staffId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  // Record status change
  await db.insert(orderStatusHistory).values({
    id,
    kitchenStaffId: staffId,
    startTime: new Date(),
  });
  
  // Update order status
  const statusMap: Record<string, any> = {
    "preparing": "processing",
    "ready": "processing",
    "served": "completed",
    "completed": "completed",
  };
  
  if (statusMap[newStatus]) {
    await db.update(orders).set({ orderStatus: statusMap[newStatus] }).where(eq(orders.id, id));
  }
}

// KDS Settings
export async function getKdsSettings(branchId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = [];
  if (branchId) conditions.push(eq(kdsSettings.branchId, branchId));
  
  const result = await db
    .select()
    .from(kdsSettings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(1);
  
  return result[0] || null;
}

export async function updateKdsSettings(data: Partial<KdsSettings>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const { id, ...updateData } = data as any;
  if (!id) throw new Error("KDS Settings ID required");
  
  await db.update(kdsSettings).set(updateData).where(eq(kdsSettings.id, id));
}

export async function createKdsSettings(data: InsertKdsSettings) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(kdsSettings).values(data);
  return result;
}


// ─── Staff Management ──────────────────────────────────────────────────────
export async function createStaffProfile(data: InsertStaffProfile) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const result = await db.insert(staffProfiles).values(data);
  return result;
}

export async function getStaffProfile(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(staffProfiles).where(eq(staffProfiles.id, id)).limit(1);
  return result[0] || null;
}

export async function getStaffProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
  return result[0] || null;
}

export async function listStaffProfiles(filters?: {
  status?: string;
  branchId?: number;
  department?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.status) conditions.push(eq(staffProfiles.status, filters.status as any));
  if (filters?.branchId) conditions.push(eq(staffProfiles.branchId, filters.branchId));
  if (filters?.department) conditions.push(eq(staffProfiles.department, filters.department));
  if (filters?.search) {
    conditions.push(
      or(
        like(staffProfiles.firstName, `%${filters.search}%`),
        like(staffProfiles.lastName, `%${filters.search}%`),
        like(staffProfiles.employeeId, `%${filters.search}%`),
        like(staffProfiles.phoneNumber, `%${filters.search}%`)
      )
    );
  }
  
  return db
    .select()
    .from(staffProfiles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(staffProfiles.createdAt);
}

export async function updateStaffProfile(id: number, data: Partial<StaffProfile>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const { id: _, ...updateData } = data as any;
  await db.update(staffProfiles).set(updateData).where(eq(staffProfiles.id, id));
}

export async function deleteStaffProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.delete(staffProfiles).where(eq(staffProfiles.id, id));
}

// ─── Staff Activity Logs ───────────────────────────────────────────────────
export async function recordStaffActivity(data: InsertStaffActivityLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Activity] DB unavailable, log not recorded");
    return;
  }
  
  try {
    await db.insert(staffActivityLogs).values(data);
  } catch (error) {
    console.error("[Activity] Failed to record log:", error);
  }
}

export async function getStaffActivityLogs(filters?: {
  userId?: number;
  activityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.userId) conditions.push(eq(staffActivityLogs.userId, filters.userId));
  if (filters?.activityType) conditions.push(eq(staffActivityLogs.activityType, filters.activityType as any));
  if (filters?.startDate) conditions.push(gte(staffActivityLogs.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(staffActivityLogs.createdAt, filters.endDate));
  
  return db
    .select()
    .from(staffActivityLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(staffActivityLogs.createdAt))
    .limit(filters?.limit || 1000);
}

export async function getUserActivitySummary(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db
    .select()
    .from(staffActivityLogs)
    .where(
      and(
        eq(staffActivityLogs.userId, userId),
        gte(staffActivityLogs.createdAt, startDate)
      )
    )
    .orderBy(desc(staffActivityLogs.createdAt));
}

export async function searchTransactionsByCustomer(customerName: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(like(transactionReconciliation.customerId, `%${customerName}%`))
    .limit(20);
}


// ─── Customer Spending Reports ─────────────────────────────────────────────────
export async function getCustomerSpendingByWeek(customerId: number, weeksBack: number = 12) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeksBack * 7));
  
  const result = await db.execute(sql`
    SELECT 
      WEEK(o.createdAt) as week,
      YEAR(o.createdAt) as year,
      DATE_FORMAT(o.createdAt, '%Y-W%u') as weekLabel,
      MIN(DATE(o.createdAt)) as weekStart,
      MAX(DATE(o.createdAt)) as weekEnd,
      COUNT(o.id) as orderCount,
      SUM(o.totalAmount) as totalSpent,
      AVG(o.totalAmount) as avgOrderValue,
      COUNT(DISTINCT o.paymentMethod) as paymentMethodsUsed
    FROM orders o
    WHERE o.customerId = ? AND o.createdAt >= ? AND o.orderStatus = 'completed'
    GROUP BY YEAR(o.createdAt), WEEK(o.createdAt)
    ORDER BY YEAR(o.createdAt) DESC, WEEK(o.createdAt) DESC
  `, [customerId, startDate]);
  
  return result as any[];
}

export async function getCustomerSpendingByMonth(customerId: number, monthsBack: number = 12) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);
  
  const result = await db.execute(sql`
    SELECT 
      MONTH(o.createdAt) as month,
      YEAR(o.createdAt) as year,
      DATE_FORMAT(o.createdAt, '%Y-%m') as monthLabel,
      DATE_FORMAT(o.createdAt, '%B %Y') as monthName,
      COUNT(o.id) as orderCount,
      SUM(o.totalAmount) as totalSpent,
      AVG(o.totalAmount) as avgOrderValue,
      MAX(o.totalAmount) as maxOrderValue,
      MIN(o.totalAmount) as minOrderValue,
      SUM(o.taxAmount) as totalTax,
      SUM(o.discountAmount) as totalDiscount
    FROM orders o
    WHERE o.customerId = ? AND o.createdAt >= ? AND o.orderStatus = 'completed'
    GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
    ORDER BY YEAR(o.createdAt) DESC, MONTH(o.createdAt) DESC
  `, [customerId, startDate]);
  
  return result as any[];
}

export async function getCustomerSpendingTrends(customerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const walletResult = await db.execute(sql`
    SELECT totalSpent, balance FROM customerWallets WHERE customerId = ?
  `, [customerId]);
  
  const walletData = walletResult[0] as any;
  const totalSpent = walletData?.totalSpent ?? 0;
  
  const result = await db.execute(sql`
    SELECT 
      COUNT(o.id) as totalOrders,
      AVG(o.totalAmount) as avgOrderValue,
      MAX(o.totalAmount) as maxOrderValue,
      MIN(o.totalAmount) as minOrderValue,
      STDDEV(o.totalAmount) as spendingVariance,
      DATE_FORMAT(MIN(o.createdAt), '%Y-%m-%d') as firstOrderDate,
      DATE_FORMAT(MAX(o.createdAt), '%Y-%m-%d') as lastOrderDate,
      DATEDIFF(MAX(o.createdAt), MIN(o.createdAt)) as daysSinceFirstOrder
    FROM orders o
    WHERE o.customerId = ? AND o.orderStatus = 'completed'
  `, [customerId]);
  
  const orderData = result[0] as any;
  return {
    ...orderData,
    totalSpent: totalSpent
  };
}

export async function getCustomerPaymentMethodBreakdown(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT 
      o.paymentMethod,
      COUNT(o.id) as orderCount,
      SUM(o.totalAmount) as totalAmount,
      AVG(o.totalAmount) as avgAmount,
      ROUND(SUM(o.totalAmount) / (SELECT SUM(totalAmount) FROM orders WHERE customerId = ? AND orderStatus = 'completed') * 100, 2) as percentageOfTotal
    FROM orders o
    WHERE o.customerId = ? AND o.orderStatus = 'completed'
    GROUP BY o.paymentMethod
    ORDER BY totalAmount DESC
  `, [customerId, customerId]);
  
  return result as any[];
}

export async function getTopCustomersBySpending(limit: number = 10, monthsBack: number = 3) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);
  
  // Get all completed orders from the last N months
  const allOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        eq(orders.orderStatus, 'completed')
      )
    );
  
  // Group by customer and calculate totals
  const customerSpending: Record<number, any> = {};
  
  for (const order of allOrders) {
    if (!customerSpending[order.customerId]) {
      customerSpending[order.customerId] = {
        customerId: order.customerId,
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: order.createdAt,
      };
    }
    customerSpending[order.customerId].orderCount += 1;
    customerSpending[order.customerId].totalSpent += Number(order.totalAmount);
    if (order.createdAt > customerSpending[order.customerId].lastOrderDate) {
      customerSpending[order.customerId].lastOrderDate = order.createdAt;
    }
  }
  
  // Filter out customers with zero spending
  const spendingCustomers = Object.entries(customerSpending)
    .filter(([_, data]) => data.totalSpent > 0)
    .map(([customerId, data]) => ({ customerId: Number(customerId), ...data }));
  
  if (spendingCustomers.length === 0) return [];
  
  // Get customer details
  const customerIds = spendingCustomers.map(c => c.customerId);
  const customerDetails = await db
    .select()
    .from(customers)
    .where(sql`${customers.id} IN (${customerIds.join(',')})`);
  
  // Create a map of customer details
  const customerMap = new Map(customerDetails.map(c => [c.id, c]));
  
  // Merge and sort
  const result = spendingCustomers
    .map(spending => {
      const customer = customerMap.get(spending.customerId);
      return {
        id: customer?.id,
        name: customer?.name,
        phone: customer?.phone,
        email: customer?.email,
        orderCount: spending.orderCount,
        totalSpent: spending.totalSpent,
        avgOrderValue: spending.totalSpent / spending.orderCount,
        lastOrderDate: spending.lastOrderDate,
        daysSinceLastOrder: Math.floor((Date.now() - spending.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)),
      };
    })
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, limit);
  
  return result as any[];
}

export async function getCustomerSpendingComparison(customerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get customer's total spending
  const customerOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.customerId, customerId),
        eq(orders.orderStatus, 'completed')
      )
    );
  
  const customerTotal = customerOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  
  // Get all completed orders for system-wide calculations
  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.orderStatus, 'completed'));
  
  // Calculate system-wide metrics
  const totalSystemRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalCustomers = new Set(allOrders.map(o => o.customerId)).size;
  
  // Calculate average customer spending
  const customerSpending: Record<number, number> = {};
  for (const order of allOrders) {
    if (!customerSpending[order.customerId]) {
      customerSpending[order.customerId] = 0;
    }
    customerSpending[order.customerId] += Number(order.totalAmount);
  }
  
  const averageCustomerSpending = totalCustomers > 0 
    ? Object.values(customerSpending).reduce((a, b) => a + b, 0) / totalCustomers 
    : 0;
  
  return {
    customerTotal,
    averageCustomerSpending,
    totalCustomers,
    totalSystemRevenue,
  };
}


// ─── PAYROLL MANAGEMENT FUNCTIONS ──────────────────────────────────────────

export async function createEmploymentRecord(data: {
  staffProfileId: number;
  employmentTypeId: number;
  baseSalary: number;
  hourlyRate: number;
  dailyRate: number;
  bankAccount?: string;
  bankName?: string;
  nssf?: string;
  nhif?: string;
  kra?: string;
  startDate: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(staffEmployment).values({
    staffProfileId: data.staffProfileId,
    employmentTypeId: data.employmentTypeId,
    baseSalary: data.baseSalary,
    hourlyRate: data.hourlyRate,
    dailyRate: data.dailyRate,
    bankAccount: data.bankAccount || null,
    bankName: data.bankName || null,
    nssf: data.nssf || null,
    nhif: data.nhif || null,
    kra: data.kra || null,
    startDate: data.startDate,
  });
  return result;
}

export async function getStaffEmployment(staffProfileId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(staffEmployment)
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(and(
      eq(staffEmployment.staffProfileId, staffProfileId),
      eq(staffEmployment.isActive, true)
    ))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0] as any;
  return {
    ...row.staff_employment,
    employmentTypeName: row.employment_types?.name,
  };
}

export async function getAllStaffEmployment() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(staffEmployment)
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(staffEmployment.isActive, true))
    .orderBy(staffProfiles.firstName, staffProfiles.lastName);
  
  return result.map((row: any) => ({
    ...row.staff_employment,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
    employmentTypeName: row.employment_types?.name,
  }));
}

export async function recordAttendance(data: {
  staffProfileId: number;
  date: Date;
  hoursWorked: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(attendanceRecords).values({
    staffProfileId: data.staffProfileId,
    date: data.date,
    hoursWorked: data.hoursWorked,
    status: data.status,
    notes: data.notes || null,
  });
  return result;
}

export async function getAttendanceRecords(staffProfileId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(attendanceRecords)
    .leftJoin(staffProfiles, eq(attendanceRecords.staffProfileId, staffProfiles.id))
    .where(and(
      eq(attendanceRecords.staffProfileId, staffProfileId),
      between(attendanceRecords.date, startDate, endDate)
    ))
    .orderBy(sql`${attendanceRecords.date} DESC`);
  
  return result.map((row: any) => ({
    ...row.attendance_records,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
  }));
}

export async function addPayrollDeduction(data: {
  staffEmploymentId: number;
  deductionTypeId: number;
  amount?: number;
  percentage?: number;
  startDate: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(payrollDeductions).values({
    staffEmploymentId: data.staffEmploymentId,
    deductionTypeId: data.deductionTypeId,
    amount: data.amount || null,
    percentage: data.percentage || null,
    startDate: data.startDate,
    endDate: data.endDate || null,
  });
  return result;
}

export async function getPayrollDeductions(staffEmploymentId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(payrollDeductions)
    .leftJoin(deductionTypes, eq(payrollDeductions.deductionTypeId, deductionTypes.id))
    .where(and(
      eq(payrollDeductions.staffEmploymentId, staffEmploymentId),
      eq(payrollDeductions.isActive, true)
    ))
    .orderBy(deductionTypes.name);
  
  return result.map((row: any) => ({
    ...row.payroll_deductions,
    deductionTypeName: row.deduction_types?.name,
    isStatutory: row.deduction_types?.isStatutory,
  }));
}

export async function addPayrollBonus(data: {
  staffEmploymentId: number;
  bonusTypeId: number;
  amount: number;
  paymentDate: Date;
  reason?: string;
  approvedBy?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(payrollBonuses).values({
    staffEmploymentId: data.staffEmploymentId,
    bonusTypeId: data.bonusTypeId,
    amount: data.amount,
    paymentDate: data.paymentDate,
    reason: data.reason || null,
    approvedBy: data.approvedBy || null,
  });
  return result;
}

export async function getPayrollBonuses(staffEmploymentId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(payrollBonuses)
    .leftJoin(bonusTypes, eq(payrollBonuses.bonusTypeId, bonusTypes.id))
    .where(eq(payrollBonuses.staffEmploymentId, staffEmploymentId));
  
  if (startDate && endDate) {
    query = query.where(between(payrollBonuses.paymentDate, startDate, endDate));
  }
  
  const result = await query.orderBy(sql`${payrollBonuses.paymentDate} DESC`);
  
  return result.map((row: any) => ({
    ...row.payroll_bonuses,
    bonusTypeName: row.bonus_types?.name,
  }));
}

export async function createPayrollRecord(data: {
  staffEmploymentId: number;
  payrollPeriodStart: Date;
  payrollPeriodEnd: Date;
  grossSalary: number;
  totalDeductions: number;
  totalBonuses: number;
  netPay: number;
  paymentMethod?: 'bank_transfer' | 'cash' | 'mpesa' | 'check';
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(payrollRecords).values({
    staffEmploymentId: data.staffEmploymentId,
    payrollPeriodStart: data.payrollPeriodStart,
    payrollPeriodEnd: data.payrollPeriodEnd,
    grossSalary: data.grossSalary,
    totalDeductions: data.totalDeductions,
    totalBonuses: data.totalBonuses,
    netPay: data.netPay,
    paymentMethod: data.paymentMethod || 'bank_transfer',
    notes: data.notes || null,
  });
  return result;
}

export async function getPayrollRecords(staffEmploymentId: number, limit: number = 12) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(payrollRecords)
    .leftJoin(staffEmployment, eq(payrollRecords.staffEmploymentId, staffEmployment.id))
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(payrollRecords.staffEmploymentId, staffEmploymentId))
    .orderBy(sql`${payrollRecords.payrollPeriodEnd} DESC`)
    .limit(limit);
  
  return result.map((row: any) => ({
    ...row.payroll_records,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
    employmentTypeName: row.employment_types?.name,
  }));
}

export async function updatePayrollRecordStatus(payrollRecordId: number, status: 'pending' | 'paid' | 'failed' | 'cancelled', paymentDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.update(payrollRecords)
    .set({
      paymentStatus: status,
      paymentDate: paymentDate || null,
    })
    .where(eq(payrollRecords.id, payrollRecordId));
  
  return result;
}

export async function generatePayslip(payrollRecordId: number, payslipNumber: string, payslipUrl?: string) {
  const db = await getDb();
  if (!db) return null;

  const payrollRecord = await db.select().from(payrollRecords)
    .where(eq(payrollRecords.id, payrollRecordId))
    .limit(1);
  
  if (payrollRecord.length === 0) return null;
  
  const pr = payrollRecord[0];
  
  const result = await db.insert(payslips).values({
    payrollRecordId: pr.id,
    staffEmploymentId: pr.staffEmploymentId,
    payslipNumber,
    payrollPeriodStart: pr.payrollPeriodStart,
    payrollPeriodEnd: pr.payrollPeriodEnd,
    grossSalary: pr.grossSalary,
    totalDeductions: pr.totalDeductions,
    totalBonuses: pr.totalBonuses,
    netPay: pr.netPay,
    payslipUrl: payslipUrl || null,
  });
  
  return result;
}

export async function getPayslips(staffEmploymentId: number, limit: number = 12) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(payslips)
    .leftJoin(staffEmployment, eq(payslips.staffEmploymentId, staffEmployment.id))
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .where(eq(payslips.staffEmploymentId, staffEmploymentId))
    .orderBy(sql`${payslips.payrollPeriodEnd} DESC`)
    .limit(limit);
  
  return result.map((row: any) => ({
    ...row.payslips,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
  }));
}

export async function getPayslipById(payslipId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(payslips)
    .leftJoin(staffEmployment, eq(payslips.staffEmploymentId, staffEmployment.id))
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(payslips.id, payslipId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0] as any;
  return {
    ...row.payslips,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
    phoneNumber: row.staff_profiles?.phoneNumber,
    employeeId: row.staff_profiles?.employeeId,
    baseSalary: row.staff_employment?.baseSalary,
    hourlyRate: row.staff_employment?.hourlyRate,
    dailyRate: row.staff_employment?.dailyRate,
    bankAccount: row.staff_employment?.bankAccount,
    bankName: row.staff_employment?.bankName,
    employmentTypeName: row.employment_types?.name,
  };
}

export async function getPayrollSettings(branchId?: number) {
  const db = await getDb();
  if (!db) return null;

  let query = db.select().from(payrollSettings);
  
  if (branchId) {
    query = query.where(eq(payrollSettings.branchId, branchId));
  } else {
    query = query.where(isNull(payrollSettings.branchId));
  }
  
  const result = await query.limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePayrollSettings(data: {
  branchId?: number;
  nssfRate?: number;
  nhifRate?: number;
  payeTaxThreshold?: number;
  payeRate?: number;
  payrollCycle?: 'weekly' | 'biweekly' | 'monthly';
  paymentDay?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getPayrollSettings(data.branchId);
  
  if (existing) {
    const updateData: any = {};
    if (data.nssfRate !== undefined) updateData.nssfRate = data.nssfRate;
    if (data.nhifRate !== undefined) updateData.nhifRate = data.nhifRate;
    if (data.payeTaxThreshold !== undefined) updateData.payeTaxThreshold = data.payeTaxThreshold;
    if (data.payeRate !== undefined) updateData.payeRate = data.payeRate;
    if (data.payrollCycle !== undefined) updateData.payrollCycle = data.payrollCycle;
    if (data.paymentDay !== undefined) updateData.paymentDay = data.paymentDay;
    
    const result = await db.update(payrollSettings)
      .set(updateData)
      .where(data.branchId ? eq(payrollSettings.branchId, data.branchId) : isNull(payrollSettings.branchId));
    
    return result;
  } else {
    const result = await db.insert(payrollSettings).values({
      branchId: data.branchId || null,
      nssfRate: data.nssfRate || 6,
      nhifRate: data.nhifRate || 2.75,
      payeTaxThreshold: data.payeTaxThreshold || 24000,
      payeRate: data.payeRate || 30,
      payrollCycle: data.payrollCycle || 'monthly',
      paymentDay: data.paymentDay || 28,
    });
    
    return result;
  }
}

export async function calculateCasualLaborerPay(staffEmploymentId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;

  const employment = await db.select().from(staffEmployment)
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(staffEmployment.id, staffEmploymentId))
    .limit(1);
  
  if (employment.length === 0) return null;
  
  const emp = employment[0].staff_employment;
  
  // Get attendance records
  const attendance = await db.select({
    totalHours: sql<number>`SUM(${attendanceRecords.hoursWorked})`,
    daysWorked: sql<number>`COUNT(*)`,
  }).from(attendanceRecords)
    .where(and(
      eq(attendanceRecords.staffProfileId, emp.staffProfileId),
      between(attendanceRecords.date, startDate, endDate),
      sql`${attendanceRecords.status} IN ('present', 'late', 'half_day')`
    ));
  
  const att = attendance[0] || { totalHours: 0, daysWorked: 0 };
  const totalHours = Number(att.totalHours) || 0;
  const daysWorked = Number(att.daysWorked) || 0;
  
  // Calculate gross salary based on hourly or daily rate
  let grossSalary = 0;
  if (emp.hourlyRate > 0) {
    grossSalary = totalHours * Number(emp.hourlyRate);
  } else if (emp.dailyRate > 0) {
    grossSalary = daysWorked * Number(emp.dailyRate);
  }
  
  return {
    staffEmploymentId,
    grossSalary,
    totalHours,
    daysWorked,
    hourlyRate: emp.hourlyRate,
    dailyRate: emp.dailyRate
  };
}

export async function calculatePermanentEmployeePay(staffEmploymentId: number, payrollSettings: any) {
  const db = await getDb();
  if (!db) return null;

  const employment = await db.select().from(staffEmployment)
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(staffEmployment.id, staffEmploymentId))
    .limit(1);
  
  if (employment.length === 0) return null;
  
  const emp = employment[0].staff_employment;
  
  // Get active deductions
  const deductions = await db.select().from(payrollDeductions)
    .leftJoin(deductionTypes, eq(payrollDeductions.deductionTypeId, deductionTypes.id))
    .where(and(
      eq(payrollDeductions.staffEmploymentId, staffEmploymentId),
      eq(payrollDeductions.isActive, true)
    ));
  
  // Calculate total deductions
  let totalDeductions = 0;
  const deductionDetails: any[] = [];
  
  for (const row of deductions) {
    const ded = row.payroll_deductions;
    let deductionAmount = 0;
    if (ded.amount) {
      deductionAmount = Number(ded.amount);
    } else if (ded.percentage) {
      deductionAmount = (Number(emp.baseSalary) * Number(ded.percentage)) / 100;
    }
    totalDeductions += deductionAmount;
    deductionDetails.push({
      name: row.deduction_types?.name,
      amount: deductionAmount,
      isStatutory: row.deduction_types?.isStatutory
    });
  }
  
  // Calculate PAYE if applicable
  if (Number(emp.baseSalary) > payrollSettings.payeTaxThreshold) {
    const taxableIncome = Number(emp.baseSalary) - totalDeductions;
    const payeAmount = (taxableIncome * payrollSettings.payeRate) / 100;
    totalDeductions += payeAmount;
    deductionDetails.push({
      name: 'PAYE',
      amount: payeAmount,
      isStatutory: true
    });
  }
  
  return {
    staffEmploymentId,
    grossSalary: Number(emp.baseSalary),
    totalDeductions,
    deductionDetails,
    netPay: Number(emp.baseSalary) - totalDeductions
  };
}


// ─── User Management ───────────────────────────────────────────────────────
export async function listUsers(opts?: { search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(users);
  
  if (opts?.search) {
    query = query.where(
      or(
        like(users.name, `%${opts.search}%`),
        like(users.email, `%${opts.search}%`)
      )
    );
  }
  
  return query.orderBy(users.name);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createUser(data: {
  name: string;
  email: string;
  role: "admin" | "manager" | "supervisor" | "cashier" | "waiter" | "inventory_manager" | "kitchen_staff";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  // Generate a unique openId for the new user
  const openId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    role: data.role,
    loginMethod: "manual",
  });
  
  return result;
}

export async function updateUserRole(id: number, role: "admin" | "manager" | "supervisor" | "cashier" | "waiter" | "inventory_manager" | "kitchen_staff") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db.delete(users).where(eq(users.id, id));
}


// ─── Payment Breakdown ───────────────────────────────────────────────────────
export async function getPaymentMethodBreakdown(fromDate: Date, toDate: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select({
      paymentMethod: orders.paymentMethod,
      total: sql<number>`sum(${orders.totalAmount})`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.orderStatus, "completed"),
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate)
      )
    )
    .groupBy(orders.paymentMethod);
  
  return results;
}


// ─── Daily Sales Itemized Report ──────────────────────────────────────────────
export async function getDailySalesItemized(date: string) {
  const db = await getDb();
  if (!db) return null;

  // Parse the date
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  // Get daily summary
  const [summary] = await db
    .select({
      totalOrders: sql<number>`count(distinct ${orders.id})`,
      totalRevenue: sql<number>`sum(${orders.totalAmount})`,
      totalTax: sql<number>`sum(${orders.taxAmount})`,
      totalDiscount: sql<number>`sum(${orders.discountAmount})`,
      avgOrderValue: sql<number>`avg(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      )
    );

  // Get payment method breakdown
  const paymentBreakdown = await db
    .select({
      method: orders.paymentMethod,
      count: sql<number>`count(*)`,
      total: sql<number>`sum(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      )
    )
    .groupBy(orders.paymentMethod);

  // Get itemized sales (all order items for the day)
  const itemizedSales = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      customerName: customers.name,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      paymentMethod: orders.paymentMethod,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      )
    )
    .orderBy(orders.createdAt, orders.id);

  // Get top products by quantity
  const topProducts = await db
    .select({
      productName: orderItems.productName,
      totalQuantity: sql<number>`sum(${orderItems.quantity})`,
      totalRevenue: sql<number>`sum(${orderItems.totalPrice})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      )
    )
    .groupBy(orderItems.productName)
    .orderBy(desc(sql<number>`sum(${orderItems.totalPrice})`))
    .limit(20);

  return {
    date,
    summary: summary || {
      totalOrders: 0,
      totalRevenue: 0,
      totalTax: 0,
      totalDiscount: 0,
      avgOrderValue: 0,
    },
    paymentBreakdown,
    itemizedSales,
    topProducts,
  };
}


// ─── Sales by Payment Method ──────────────────────────────────────────────────
export async function getSalesByPaymentMethod(fromDate: Date, toDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      method: orders.paymentMethod,
      orderCount: sql<number>`count(distinct ${orders.id})`,
      totalRevenue: sql<number>`sum(${orders.totalAmount})`,
      totalTax: sql<number>`sum(${orders.taxAmount})`,
      avgOrderValue: sql<number>`avg(${orders.totalAmount})`,
      minOrderValue: sql<number>`min(${orders.totalAmount})`,
      maxOrderValue: sql<number>`max(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate),
      )
    )
    .groupBy(orders.paymentMethod)
    .orderBy(desc(sql<number>`sum(${orders.totalAmount})`));

  return results;
}

// ─── Daily Sales by Payment Method ────────────────────────────────────────────
export async function getDailySalesByPaymentMethod(fromDate: Date, toDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      method: orders.paymentMethod,
      orderCount: sql<number>`count(*)`,
      totalRevenue: sql<number>`sum(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate),
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`, sql`${orders.paymentMethod}`)
    .orderBy(sql`DATE(${orders.createdAt})`, sql`${orders.paymentMethod}`);

  return results;
}

// ─── Payment Method Comparison ────────────────────────────────────────────────
export async function getPaymentMethodComparison(fromDate: Date, toDate: Date) {
  const db = await getDb();
  if (!db) return null;

  const byMethod = await getSalesByPaymentMethod(fromDate, toDate);
  const totalSales = byMethod.reduce((sum, m: any) => sum + (Number(m.totalRevenue) || 0), 0);
  const totalOrders = byMethod.reduce((sum, m: any) => sum + (Number(m.orderCount) || 0), 0);

  const breakdown = byMethod.map((m: any) => ({
    method: m.method || "UNKNOWN",
    orderCount: Number(m.orderCount) || 0,
    totalRevenue: Number(m.totalRevenue) || 0,
    totalTax: Number(m.totalTax) || 0,
    avgOrderValue: Number(m.avgOrderValue) || 0,
    minOrderValue: Number(m.minOrderValue) || 0,
    maxOrderValue: Number(m.maxOrderValue) || 0,
    percentageOfTotal: totalSales > 0 ? ((Number(m.totalRevenue) || 0) / totalSales) * 100 : 0,
  }));

  return {
    totalRevenue: totalSales,
    totalOrders,
    breakdown,
  };
}
