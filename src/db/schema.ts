import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";

// =====================================================
// SUPER ADMINS
// =====================================================
export const superAdmins = pgTable("super_admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =====================================================
// PLANS
// =====================================================
export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  price: varchar("price", { length: 100 }).notNull(),
  description: text("description").notNull(),
  features: jsonb("features").notNull(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =====================================================
// TENANTS
// =====================================================
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 255 }).unique().notNull(),
  plan: varchar("plan", { length: 50 }).default("starter").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  userCount: integer("user_count").default(0),
  productCount: integer("product_count").default(0),
  totalSales: numeric("total_sales", { precision: 12, scale: 2 }).default("0"),
});

// =====================================================
// USERS
// =====================================================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  avatarUrl: text("avatar_url"),
  status: varchar("status", { length: 50 }).default("active"),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailTenantUnique: uniqueIndex("email_tenant_idx").on(table.email, table.tenantId),
}));

// =====================================================
// CATEGORIES
// =====================================================
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

// =====================================================
// SUPPLIERS
// =====================================================
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
});

// =====================================================
// PRODUCTS
// =====================================================
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  stockThreshold: integer("stock_threshold").default(10),
  imageUrl: text("image_url"),
  imageHint: varchar("image_hint", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =====================================================
// CUSTOMERS
// =====================================================
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).default("0"),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0"),
});

// =====================================================
// SHIFTS
// =====================================================
export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  cashierId: uuid("cashier_id").references(() => users.id, {
    onDelete: "set null",
  }),
  cashierName: varchar("cashier_name", { length: 255 }),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  status: varchar("status", { length: 50 }).notNull(),
  startingCash: numeric("starting_cash", { precision: 10, scale: 2 }).notNull(),
  cashSales: numeric("cash_sales", { precision: 10, scale: 2 }).default("0"),
  cardSales: numeric("card_sales", { precision: 10, scale: 2 }).default("0"),
  mobileSales: numeric("mobile_sales", { precision: 10, scale: 2 }).default("0"),
  creditSales: numeric("credit_sales", { precision: 10, scale: 2 }).default("0"),
  totalSales: numeric("total_sales", { precision: 10, scale: 2 }).default("0"),
  expectedCash: numeric("expected_cash", { precision: 10, scale: 2 }),
  actualCash: numeric("actual_cash", { precision: 10, scale: 2 }),
  cashDifference: numeric("cash_difference", { precision: 10, scale: 2 }),
});

// =====================================================
// SHIFT REPORTS
// =====================================================
export const shiftReports = pgTable("shift_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  shiftId: uuid("shift_id")
    .references(() => shifts.id, { onDelete: "cascade" })
    .notNull(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
  cashierName: varchar("cashier_name", { length: 255 }),
  details: jsonb("details"),
});

// =====================================================
// SALES
// =====================================================
export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  shiftId: uuid("shift_id").references(() => shifts.id, {
    onDelete: "set null",
  }),
  cashierId: uuid("cashier_id").references(() => users.id, {
    onDelete: "set null",
  }),
  cashierName: varchar("cashier_name", { length: 255 }),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  customerName: varchar("customer_name", { length: 255 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  totalProfit: numeric("total_profit", { precision: 10, scale: 2 }),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("paid"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  amountSettled: numeric("amount_settled", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =====================================================
// SALE ITEMS
// =====================================================
export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: varchar("product_name", { length: 255 }),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
});

// =====================================================
// PURCHASE ORDERS
// =====================================================
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id, {
    onDelete: "set null",
  }),
  poNumber: varchar("po_number", { length: 100 }).unique().notNull(),
  status: varchar("status", { length: 50 }).default("Draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
});

// =====================================================
// PURCHASE ORDER ITEMS
// =====================================================
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseOrderId: uuid("purchase_order_id")
    .references(() => purchaseOrders.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  productName: varchar("product_name", { length: 255 }),
  quantity: integer("quantity").notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
});

// =====================================================
// PLATFORM SETTINGS
// =====================================================
export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  platformName: varchar("platform_name", { length: 255 }).default("GoodSale").notNull(),
  logoUrl: text("logo_url"),
  currency: varchar("currency", { length: 10 }).default("ghs").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("8").notNull(),
  enforceMfa: boolean("enforce_mfa").default(false).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =====================================================
// SETTINGS
// =====================================================
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  shopName: varchar("shop_name", { length: 255 }),
  logoUrl: text("logo_url"),
  receiptHeader: text("receipt_header"),
  receiptFooter: text("receipt_footer"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  posSettings: jsonb("pos_settings"),
});

// =====================================================
// DEBTOR HISTORY
// =====================================================
export const debtorHistory = pgTable("debtor_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
});

// =====================================================
// NOTIFICATIONS
// =====================================================
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'sale', 'stock', 'user', 'system'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"), // Store additional context like saleId, productId, etc.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =====================================================
// AUDIT LOGS
// =====================================================
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  userName: varchar("user_name", { length: 255 }),
  action: varchar("action", { length: 255 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: uuid("entity_id"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  details: jsonb("details"),
});
