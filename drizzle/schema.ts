import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#3B82F6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ──────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 50 }),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 12, scale: 2 }),
  categoryId: int("categoryId").references(() => categories.id),
  imageUrl: text("imageUrl"),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  barcode: varchar("barcode", { length: 100 }),
  unit: varchar("unit", { length: 20 }).default("pcs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Customers ─────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
  totalSpent: decimal("totalSpent", { precision: 14, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Orders ────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 30 }).notNull().unique(),
  customerId: int("customerId").references(() => customers.id),
  customerName: varchar("customerName", { length: 200 }),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mpesa", "stripe", "mixed"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  orderStatus: mysqlEnum("orderStatus", ["pending", "processing", "completed", "cancelled"]).default("pending").notNull(),
  mpesaTransactionId: varchar("mpesaTransactionId", { length: 100 }),
  mpesaPhone: varchar("mpesaPhone", { length: 20 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  cashReceived: decimal("cashReceived", { precision: 12, scale: 2 }),
  cashChange: decimal("cashChange", { precision: 12, scale: 2 }),
  receiptUrl: text("receiptUrl"),
  notes: text("notes"),
  servedBy: int("servedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ───────────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  productId: int("productId").references(() => products.id),
  productName: varchar("productName", { length: 200 }).notNull(),
  productSku: varchar("productSku", { length: 50 }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 12, scale: 2 }),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Inventory Logs ────────────────────────────────────────────────────────
export const inventoryLogs = mysqlTable("inventory_logs", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  changeType: mysqlEnum("changeType", ["sale", "restock", "adjustment", "return", "damage"]).notNull(),
  quantityBefore: int("quantityBefore").notNull(),
  quantityChange: int("quantityChange").notNull(),
  quantityAfter: int("quantityAfter").notNull(),
  orderId: int("orderId").references(() => orders.id),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryLog = typeof inventoryLogs.$inferSelect;

// ─── Settings ──────────────────────────────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;

// ─── Customer Wallet ───────────────────────────────────────────────────────
export const customerWallets = mysqlTable("customer_wallets", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  balance: decimal("balance", { precision: 14, scale: 2 }).default("0").notNull(),
  totalLoaded: decimal("totalLoaded", { precision: 14, scale: 2 }).default("0").notNull(),
  totalSpent: decimal("totalSpent", { precision: 14, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerWallet = typeof customerWallets.$inferSelect;
export type InsertCustomerWallet = typeof customerWallets.$inferInsert;

// ─── Wallet Transactions ───────────────────────────────────────────────────
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull().references(() => customerWallets.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  type: mysqlEnum("type", ["load", "spend", "refund"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  orderId: int("orderId").references(() => orders.id),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

// ─── Payment Methods (for combined payments) ────────────────────────────────
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  method: mysqlEnum("method", ["cash", "mpesa", "stripe", "wallet"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  transactionId: varchar("transactionId", { length: 100 }),
  reference: varchar("reference", { length: 100 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

// ─── Transaction Reconciliation ────────────────────────────────────────────
export const transactionReconciliation = mysqlTable("transaction_reconciliation", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: varchar("transactionId", { length: 100 }).notNull().unique(),
  method: mysqlEnum("method", ["mpesa", "stripe", "bank"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  customerName: varchar("customerName", { length: 200 }),
  customerId: int("customerId").references(() => customers.id),
  orderId: int("orderId").references(() => orders.id),
  status: mysqlEnum("status", ["unused", "used", "disputed"]).default("unused").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  matchedAt: timestamp("matchedAt"),
});

export type TransactionReconciliation = typeof transactionReconciliation.$inferSelect;
export type InsertTransactionReconciliation = typeof transactionReconciliation.$inferInsert;

// ─── Branches ──────────────────────────────────────────────────────────────
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  location: varchar("location", { length: 300 }),
  phone: varchar("phone", { length: 20 }),
  manager: varchar("manager", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

// ─── Serving Points ────────────────────────────────────────────────────────
export const servingPoints = mysqlTable("serving_points", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").references(() => branches.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServingPoint = typeof servingPoints.$inferSelect;
export type InsertServingPoint = typeof servingPoints.$inferInsert;

// ─── Forms (Group Feeding) ─────────────────────────────────────────────────
export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  spent: decimal("spent", { precision: 12, scale: 2 }).default("0"),
  servingPointId: int("servingPointId").references(() => servingPoints.id),
  status: mysqlEnum("status", [
    "not_issued",
    "issued_not_approved",
    "issued_approved",
    "submitted_for_payment",
    "pending_payment",
    "paid",
  ])
    .default("not_issued")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Form = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert;

// ─── Credit Accounts ───────────────────────────────────────────────────────
export const creditAccounts = mysqlTable("credit_accounts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").references(() => customers.id),
  studentName: varchar("studentName", { length: 200 }).notNull(),
  studentId: varchar("studentId", { length: 100 }),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
  totalCredit: decimal("totalCredit", { precision: 12, scale: 2 }).default("0"),
  totalPaid: decimal("totalPaid", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["active", "settled", "suspended"]).default("active").notNull(),
  authorizedBy: int("authorizedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditAccount = typeof creditAccounts.$inferSelect;
export type InsertCreditAccount = typeof creditAccounts.$inferInsert;

// ─── Credit Transactions ───────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  creditAccountId: int("creditAccountId").references(() => creditAccounts.id),
  orderId: int("orderId").references(() => orders.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["credit", "payment", "adjustment"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ─── Suppliers ─────────────────────────────────────────────────────────────
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  paymentStatus: mysqlEnum("paymentStatus", ["paid", "unpaid", "partial"]).default("unpaid").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─── Audit Logs ────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  beforeValue: json("beforeValue"),
  afterValue: json("afterValue"),
  deviceId: varchar("deviceId", { length: 100 }),
  ipAddress: varchar("ipAddress", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── User Roles ────────────────────────────────────────────────────────────
export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  role: mysqlEnum("role", [
    "admin",
    "owner",
    "manager",
    "supervisor",
    "cashier",
    "waiter",
    "store_manager",
  ])
    .notNull(),
  branchId: int("branchId").references(() => branches.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
