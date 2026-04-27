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
  role: varchar("role", { length: 50 }).default("waiter").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
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
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mpesa", "stripe", "mixed", "wallet"]).notNull(),
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
  title: varchar("title", { length: 200 }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  spent: decimal("spent", { precision: 12, scale: 2 }).default("0"),
  servingPointId: int("servingPointId").references(() => servingPoints.id),
  status: mysqlEnum("status", ["not_issued", "issued_not_approved", "issued_approved", "submitted_for_payment", "pending_payment", "paid"]).default("not_issued").notNull(),
  servingDate: timestamp("servingDate"),
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
  email: varchar("email", { length: 100 }),
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


// ─── Employment Types ──────────────────────────────────────────────────────
export const employmentTypes = mysqlTable("employment_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "Permanent", "Casual", "Contract"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmploymentType = typeof employmentTypes.$inferSelect;
export type InsertEmploymentType = typeof employmentTypes.$inferInsert;

// ─── Staff Employment Records ──────────────────────────────────────────────
export const staffEmployment = mysqlTable("staff_employment", {
  id: int("id").autoincrement().primaryKey(),
  staffProfileId: int("staffProfileId").notNull().references(() => staffProfiles.id),
  employmentTypeId: int("employmentTypeId").notNull().references(() => employmentTypes.id),
  baseSalary: decimal("baseSalary", { precision: 12, scale: 2 }).default("0").notNull(), // For permanent employees
  hourlyRate: decimal("hourlyRate", { precision: 12, scale: 2 }).default("0").notNull(), // For casual laborers
  dailyRate: decimal("dailyRate", { precision: 12, scale: 2 }).default("0").notNull(), // For casual laborers
  bankAccount: varchar("bankAccount", { length: 50 }),
  bankName: varchar("bankName", { length: 100 }),
  nssf: varchar("nssf", { length: 20 }), // NSSF number for statutory deductions
  nhif: varchar("nhif", { length: 20 }), // NHIF number for statutory deductions
  kra: varchar("kra", { length: 20 }), // KRA PIN for tax purposes
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffEmployment = typeof staffEmployment.$inferSelect;
export type InsertStaffEmployment = typeof staffEmployment.$inferInsert;

// ─── Deduction Types ───────────────────────────────────────────────────────
export const deductionTypes = mysqlTable("deduction_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "NSSF", "NHIF", "PAYE", "Loan", "Advance"
  description: text("description"),
  isStatutory: boolean("isStatutory").default(false).notNull(), // True for NSSF, NHIF, PAYE
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeductionType = typeof deductionTypes.$inferSelect;
export type InsertDeductionType = typeof deductionTypes.$inferInsert;

// ─── Payroll Deductions ────────────────────────────────────────────────────
export const payrollDeductions = mysqlTable("payroll_deductions", {
  id: int("id").autoincrement().primaryKey(),
  staffEmploymentId: int("staffEmploymentId").notNull().references(() => staffEmployment.id),
  deductionTypeId: int("deductionTypeId").notNull().references(() => deductionTypes.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }), // For percentage-based deductions
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayrollDeduction = typeof payrollDeductions.$inferSelect;
export type InsertPayrollDeduction = typeof payrollDeductions.$inferInsert;

// ─── Bonus Types ───────────────────────────────────────────────────────────
export const bonusTypes = mysqlTable("bonus_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "Performance", "Holiday", "Annual", "Attendance"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BonusType = typeof bonusTypes.$inferSelect;
export type InsertBonusType = typeof bonusTypes.$inferInsert;

// ─── Payroll Bonuses ───────────────────────────────────────────────────────
export const payrollBonuses = mysqlTable("payroll_bonuses", {
  id: int("id").autoincrement().primaryKey(),
  staffEmploymentId: int("staffEmploymentId").notNull().references(() => staffEmployment.id),
  bonusTypeId: int("bonusTypeId").notNull().references(() => bonusTypes.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  reason: text("reason"),
  approvedBy: int("approvedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayrollBonus = typeof payrollBonuses.$inferSelect;
export type InsertPayrollBonus = typeof payrollBonuses.$inferInsert;

// ─── Attendance Records ────────────────────────────────────────────────────
export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  staffProfileId: int("staffProfileId").notNull().references(() => staffProfiles.id),
  date: timestamp("date").notNull(),
  hoursWorked: decimal("hoursWorked", { precision: 5, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late", "half_day", "leave"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

// ─── Payroll Records ───────────────────────────────────────────────────────
export const payrollRecords = mysqlTable("payroll_records", {
  id: int("id").autoincrement().primaryKey(),
  staffEmploymentId: int("staffEmploymentId").notNull().references(() => staffEmployment.id),
  payrollPeriodStart: timestamp("payrollPeriodStart").notNull(),
  payrollPeriodEnd: timestamp("payrollPeriodEnd").notNull(),
  grossSalary: decimal("grossSalary", { precision: 12, scale: 2 }).default("0").notNull(),
  totalDeductions: decimal("totalDeductions", { precision: 12, scale: 2 }).default("0").notNull(),
  totalBonuses: decimal("totalBonuses", { precision: 12, scale: 2 }).default("0").notNull(),
  netPay: decimal("netPay", { precision: 12, scale: 2 }).default("0").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "cancelled"]).default("pending").notNull(),
  paymentDate: timestamp("paymentDate"),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "cash", "mpesa", "check"]).default("bank_transfer").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = typeof payrollRecords.$inferInsert;

// ─── Payslips ──────────────────────────────────────────────────────────────
export const payslips = mysqlTable("payslips", {
  id: int("id").autoincrement().primaryKey(),
  payrollRecordId: int("payrollRecordId").notNull().references(() => payrollRecords.id),
  staffEmploymentId: int("staffEmploymentId").notNull().references(() => staffEmployment.id),
  payslipNumber: varchar("payslipNumber", { length: 50 }).notNull().unique(),
  payrollPeriodStart: timestamp("payrollPeriodStart").notNull(),
  payrollPeriodEnd: timestamp("payrollPeriodEnd").notNull(),
  grossSalary: decimal("grossSalary", { precision: 12, scale: 2 }).default("0").notNull(),
  totalDeductions: decimal("totalDeductions", { precision: 12, scale: 2 }).default("0").notNull(),
  totalBonuses: decimal("totalBonuses", { precision: 12, scale: 2 }).default("0").notNull(),
  netPay: decimal("netPay", { precision: 12, scale: 2 }).default("0").notNull(),
  payslipUrl: text("payslipUrl"), // URL to generated PDF payslip
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payslip = typeof payslips.$inferSelect;
export type InsertPayslip = typeof payslips.$inferInsert;

// ─── Payroll Settings ──────────────────────────────────────────────────────
export const payrollSettings = mysqlTable("payroll_settings", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").references(() => branches.id),
  nssfRate: decimal("nssfRate", { precision: 5, scale: 2 }).default("6").notNull(), // NSSF contribution rate
  nhifRate: decimal("nhifRate", { precision: 5, scale: 2 }).default("2.75").notNull(), // NHIF contribution rate
  payeTaxThreshold: decimal("payeTaxThreshold", { precision: 12, scale: 2 }).default("24000").notNull(), // Monthly tax threshold
  payeRate: decimal("payeRate", { precision: 5, scale: 2 }).default("30").notNull(), // PAYE tax rate
  payrollCycle: mysqlEnum("payrollCycle", ["weekly", "biweekly", "monthly"]).default("monthly").notNull(),
  paymentDay: int("paymentDay").default(28).notNull(), // Day of month for salary payment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayrollSettings = typeof payrollSettings.$inferSelect;
export type InsertPayrollSettings = typeof payrollSettings.$inferInsert;



// ─── Supplier Deliveries ───────────────────────────────────────────────────
export const supplierDeliveries = mysqlTable("supplier_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  deliveryDate: timestamp("deliveryDate").notNull(),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  totalQuantity: int("totalQuantity").notNull(),
  totalAmount: decimal("totalAmount", { precision: 14, scale: 2 }),
  status: mysqlEnum("status", ["pending", "received", "partial", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupplierDelivery = typeof supplierDeliveries.$inferSelect;
export type InsertSupplierDelivery = typeof supplierDeliveries.$inferInsert;

// ─── Delivery Items ────────────────────────────────────────────────────────
export const deliveryItems = mysqlTable("delivery_items", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull().references(() => supplierDeliveries.id),
  productId: int("productId").notNull().references(() => products.id),
  quantityOrdered: int("quantityOrdered").notNull(),
  quantityReceived: int("quantityReceived").notNull().default(0),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 14, scale: 2 }).notNull(),
  expiryDate: timestamp("expiryDate"),
  batchNumber: varchar("batchNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertDeliveryItem = typeof deliveryItems.$inferInsert;

// ─── Store Inventory ───────────────────────────────────────────────────────
export const storeInventory = mysqlTable("store_inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  storeQuantity: int("storeQuantity").default(0).notNull(),
  sellingPointQuantity: int("sellingPointQuantity").default(0).notNull(),
  lastRestockDate: timestamp("lastRestockDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StoreInventory = typeof storeInventory.$inferSelect;
export type InsertStoreInventory = typeof storeInventory.$inferInsert;

// ─── Store Transfers ───────────────────────────────────────────────────────
export const storeTransfers = mysqlTable("store_transfers", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  transferType: mysqlEnum("transferType", ["store_to_selling_point", "selling_point_to_store", "adjustment"]).notNull(),
  transferDate: timestamp("transferDate").defaultNow().notNull(),
  reason: varchar("reason", { length: 200 }),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StoreTransfer = typeof storeTransfers.$inferSelect;
export type InsertStoreTransfer = typeof storeTransfers.$inferInsert;


// ─── Notification Preferences ──────────────────────────────────────────────────
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  notificationType: mysqlEnum("notificationType", [
    "low_stock_alert",
    "large_transaction",
    "new_form_creation",
    "new_user_login",
    "payment_failure",
    "daily_summary"
  ]).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  frequency: mysqlEnum("frequency", ["instant", "daily", "weekly"]).default("instant").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
