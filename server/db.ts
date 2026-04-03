import { and, desc, eq, gte, ilike, like, lte, or, sql } from "drizzle-orm";
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
    conditions.push(
      or(
        like(products.name, `%${opts.search}%`),
        like(products.sku, `%${opts.search}%`),
        like(products.barcode, `%${opts.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(products.name)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause),
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
        sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
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
  const quantityBefore = product.stockQuantity;
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
    conditions.push(
      or(
        like(customers.name, `%${opts.search}%`),
        like(customers.phone, `%${opts.search}%`),
        like(customers.email, `%${opts.search}%`)
      )
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(customers).where(whereClause).orderBy(desc(customers.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(customers).where(whereClause),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
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
  items: InsertOrderItem[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(orders).values(orderData);
  const orderId = (result as any)[0]?.insertId as number;
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map((item) => ({ ...item, orderId })));
  }
  // Deduct stock for each item
  for (const item of items) {
    if (item.productId) {
      await adjustStock(item.productId, "sale", -item.quantity, orderId, "POS sale");
    }
  }
  return orderId;
}

export async function getOrders(opts?: {
  status?: string;
  paymentStatus?: string;
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
  if (opts?.customerId) conditions.push(eq(orders.customerId, opts.customerId));
  if (opts?.fromDate) conditions.push(gte(orders.createdAt, opts.fromDate));
  if (opts?.toDate) conditions.push(lte(orders.createdAt, opts.toDate));
  if (opts?.search) conditions.push(like(orders.orderNumber, `%${opts.search}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
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
  data: { orderStatus?: string; paymentStatus?: string; mpesaTransactionId?: string; receiptUrl?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set(data as any).where(eq(orders.id, id));
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
        eq(orders.paymentStatus, "paid")
      )
    );

  const paymentBreakdown = await db
    .select({
      paymentMethod: orders.paymentMethod,
      count: sql<number>`count(*)`,
      total: sql<number>`sum(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate),
        eq(orders.paymentStatus, "paid")
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
        eq(orders.paymentStatus, "paid")
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
        eq(orders.paymentStatus, "paid")
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
    .where(and(gte(orders.createdAt, today), lte(orders.createdAt, tomorrow), eq(orders.paymentStatus, "paid")));

  const [monthStats] = await db
    .select({
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, monthStart), eq(orders.paymentStatus, "paid")));

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
    .where(and(gte(orders.createdAt, weekAgo), eq(orders.paymentStatus, "paid")))
    .groupBy(sql`DATE(orders.createdAt)`)
    .orderBy(sql`DATE(orders.createdAt)`);

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

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
    balance: "0",
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
  const newBalance = Number(wallet.balance) + amount;
  
  await db
    .update(customerWallets)
    .set({
      balance: newBalance.toString(),
      totalLoaded: (Number(wallet.totalLoaded) + amount).toString(),
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

export async function spendFromWallet(customerId: number, amount: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const wallet = await getWallet(customerId);
  if (!wallet) throw new Error("Wallet not found");
  if (Number(wallet.balance) < amount) throw new Error("Insufficient wallet balance");
  
  const newBalance = Number(wallet.balance) - amount;
  
  await db
    .update(customerWallets)
    .set({
      balance: newBalance.toString(),
      totalSpent: (Number(wallet.totalSpent) + amount).toString(),
    })
    .where(eq(customerWallets.id, wallet.id));
  
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    customerId,
    type: "spend",
    amount: amount.toString(),
    orderId,
  });
  
  return newBalance;
}

export async function getWalletTransactions(customerId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.customerId, customerId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

// ─── Payment Methods (Combined Payments) ────────────────────────────────────
export async function addPaymentMethod(orderId: number, data: Omit<InsertPaymentMethod, 'orderId'>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(paymentMethods).values({ orderId, ...data });
}

export async function getPaymentMethods(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentMethods).where(eq(paymentMethods.orderId, orderId));
}

export async function updatePaymentMethodStatus(id: number, status: "pending" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(paymentMethods).set({ status }).where(eq(paymentMethods.id, id));
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
        ilike(transactionReconciliation.customerName, `%${search}%`),
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
    conditions.push(eq(transactionReconciliation.method, method as any));
  }
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(and(...conditions))
    .orderBy(desc(transactionReconciliation.createdAt));
}

export async function matchTransaction(transactionId: string, customerId: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  await db
    .update(transactionReconciliation)
    .set({
      status: "used",
      customerId,
      orderId,
      matchedAt: new Date(),
    })
    .where(eq(transactionReconciliation.transactionId, transactionId));
}

export async function getTransactionHistory(customerId?: number, method?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (customerId) conditions.push(eq(transactionReconciliation.customerId, customerId));
  if (method) conditions.push(eq(transactionReconciliation.method, method as any));
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionReconciliation.createdAt))
    .limit(limit);
}

export async function searchTransactionsByCustomer(customerName: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(transactionReconciliation)
    .where(
      and(
        ilike(transactionReconciliation.customerName, `%${customerName}%`),
        eq(transactionReconciliation.status, "unused")
      )
    )
    .orderBy(desc(transactionReconciliation.createdAt));
}
