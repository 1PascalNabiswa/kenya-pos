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
  stock: int("stock").default(0).notNull(),
  minStock: int("minStock").default(10).notNull(),
  maxStock: int("maxStock").default(100).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Customers ─────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  country: varchar("country", { length: 50 }),
  totalPurchases: decimal("totalPurchases", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Orders ────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").references(() => customers.id),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }).default("0"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "partial", "failed"]).default("pending").notNull(),
  orderStatus: mysqlEnum("orderStatus", ["pending", "processing", "completed", "cancelled"]).default("pending").notNull(),
  servingPointId: int("servingPointId").references(() => servingPoints.id),
  branchId: int("branchId").references(() => branches.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
  kitchenNotes: text("kitchenNotes"),
  customerNotes: text("customerNotes"),
  deliveryAddress: text("deliveryAddress"),
  deliveryDate: timestamp("deliveryDate"),
  isDelivery: boolean("isDelivery").default(false),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ───────────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  productId: int("productId").notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Payment Methods ───────────────────────────────────────────────────────
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").references(() => customers.id),
  methodType: mysqlEnum("methodType", ["cash", "card", "mpesa", "wallet", "check"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  cardLast4: varchar("cardLast4", { length: 4 }),
  cardBrand: varchar("cardBrand", { length: 50 }),
  mpesaNumber: varchar("mpesaNumber", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

// ─── Customer Wallets ──────────────────────────────────────────────────────
export const customerWallets = mysqlTable("customer_wallets", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().unique().references(() => customers.id),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  totalLoaded: decimal("totalLoaded", { precision: 12, scale: 2 }).default("0").notNull(),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0").notNull(),
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

// ─── Transaction Reconciliation ────────────────────────────────────────────
export const transactionReconciliation = mysqlTable("transaction_reconciliation", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: varchar("transactionId", { length: 100 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["mpesa", "cash", "card", "wallet"]).notNull(),
  status: mysqlEnum("status", ["unused", "used", "pending"]).default("unused").notNull(),
  customerId: int("customerId").references(() => customers.id),
  orderId: int("orderId").references(() => orders.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TransactionReconciliation = typeof transactionReconciliation.$inferSelect;
export type InsertTransactionReconciliation = typeof transactionReconciliation.$inferInsert;

// ─── Inventory Logs ────────────────────────────────────────────────────────
export const inventoryLogs = mysqlTable("inventory_logs", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  orderId: int("orderId").references(() => orders.id),
  type: mysqlEnum("type", ["sale", "adjustment", "return", "damage"]).notNull(),
  quantityChanged: int("quantityChanged").notNull(),
  newStock: int("newStock").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = typeof inventoryLogs.$inferInsert;

// ─── Settings ──────────────────────────────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// ─── Branches ──────────────────────────────────────────────────────────────
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 200 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  email: varchar("email", { length: 100 }),
  manager: varchar("manager", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

// ─── Serving Points ────────────────────────────────────────────────────────
export const servingPoints = mysqlTable("serving_points", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  branchId: int("branchId").references(() => branches.id),
  location: varchar("location", { length: 200 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServingPoint = typeof servingPoints.$inferSelect;
export type InsertServingPoint = typeof servingPoints.$inferInsert;

// ─── Forms ─────────────────────────────────────────────────────────────────
export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  amountSpent: decimal("amountSpent", { precision: 12, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  branchId: int("branchId").references(() => branches.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Form = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert;

// ─── Credit Accounts ───────────────────────────────────────────────────────
export const creditAccounts = mysqlTable("credit_accounts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }).notNull(),
  amountUsed: decimal("amountUsed", { precision: 12, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "closed"]).default("active").notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }).default("0"),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditAccount = typeof creditAccounts.$inferSelect;
export type InsertCreditAccount = typeof creditAccounts.$inferInsert;

// ─── Credit Transactions ───────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  creditAccountId: int("creditAccountId").notNull().references(() => creditAccounts.id),
  orderId: int("orderId").references(() => orders.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["charge", "payment", "adjustment"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ─── Suppliers ─────────────────────────────────────────────────────────────
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 100 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─── Audit Logs ────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  changes: json("changes"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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


// ─── Kitchen Display System (KDS) ──────────────────────────────────────────
export const kitchenStaff = mysqlTable("kitchen_staff", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  station: varchar("station", { length: 100 }).notNull(), // e.g., "Grill", "Fryer", "Prep"
  isActive: boolean("isActive").default(true).notNull(),
  ordersCompleted: int("ordersCompleted").default(0).notNull(),
  averagePrepTime: int("averagePrepTime").default(0).notNull(), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KitchenStaff = typeof kitchenStaff.$inferSelect;
export type InsertKitchenStaff = typeof kitchenStaff.$inferInsert;

// Order status history for KDS tracking
export const orderStatusHistory = mysqlTable("order_status_history", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  status: mysqlEnum("status", ["pending", "preparing", "ready", "served", "completed"]).notNull(),
  kitchenStaffId: int("kitchenStaffId").references(() => kitchenStaff.id),
  notes: text("notes"),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;

// KDS configuration and settings
export const kdsSettings = mysqlTable("kds_settings", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").references(() => branches.id),
  soundAlertEnabled: boolean("soundAlertEnabled").default(true).notNull(),
  visualAlertEnabled: boolean("visualAlertEnabled").default(true).notNull(),
  autoMarkReady: boolean("autoMarkReady").default(false).notNull(),
  readyDisplayTime: int("readyDisplayTime").default(300).notNull(), // in seconds
  theme: varchar("theme", { length: 20 }).default("dark"), // dark or light
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KdsSettings = typeof kdsSettings.$inferSelect;
export type InsertKdsSettings = typeof kdsSettings.$inferInsert;

// ─── Staff Profiles ────────────────────────────────────────────────────────
export const staffProfiles = mysqlTable("staff_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  employeeId: varchar("employeeId", { length: 50 }).unique(),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  hireDate: timestamp("hireDate"),
  status: mysqlEnum("status", ["active", "inactive", "suspended", "on_leave"]).default("active").notNull(),
  branchId: int("branchId").references(() => branches.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type InsertStaffProfile = typeof staffProfiles.$inferInsert;

// ─── Staff Activity Logs ───────────────────────────────────────────────────
export const staffActivityLogs = mysqlTable("staff_activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  activityType: mysqlEnum("activityType", [
    "login",
    "logout",
    "create_order",
    "process_payment",
    "adjust_inventory",
    "manage_customer",
    "create_form",
    "manage_credit",
    "view_report",
    "manage_user",
    "change_password",
    "role_change",
    "status_change",
  ]).notNull(),
  description: text("description"),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "failure"]).default("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StaffActivityLog = typeof staffActivityLogs.$inferSelect;
export type InsertStaffActivityLog = typeof staffActivityLogs.$inferInsert;
