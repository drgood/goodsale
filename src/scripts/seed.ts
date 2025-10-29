import { db } from "@/db";
import {
  tenants,
  users,
  categories,
  suppliers,
  products,
  customers,
  shifts,
  sales,
  saleItems,
  purchaseOrders,
  purchaseOrderItems,
} from "@/db/schema";

import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

// ==============================
// MOCK DATA GENERATION (UUIDs)
// ==============================
const mockData = {
  tenants: [
    {
      id: randomUUID(),
      name: "GShop Electronics",
      subdomain: "gshop",
      plan: "premium",
      status: "active",
      createdAt: new Date("2023-01-15"),
      userCount: 5,
      productCount: 120,
      totalSales: 150320.75,
    },
    {
      id: randomUUID(),
      name: "Globex Fashion",
      subdomain: "globex",
      plan: "starter",
      status: "active",
      createdAt: new Date("2023-03-20"),
      userCount: 2,
      productCount: 45,
      totalSales: 45010.5,
    },
  ],
};

// Create user, category, supplier, etc. using tenant IDs
const [tenant1, tenant2] = mockData.tenants;

const usersData = [
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    name: "Dr Good",
    email: "owner@gshop.com",
    role: "Owner",
    avatarUrl: "https://picsum.photos/seed/user1/100/100",
    lastLogin: new Date("2024-07-29T10:00:00Z"),
    status: "active",
    password: "password123",
  },
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    name: "Ibrahim Muhib",
    email: "manager@gshop.com",
    role: "Manager",
    avatarUrl: "https://picsum.photos/seed/user2/100/100",
    lastLogin: new Date("2024-07-29T09:30:00Z"),
    status: "active",
    password: "password123",
  },
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    name: "Mohammad Ross",
    email: "cashier1@gshop.com",
    role: "Cashier",
    avatarUrl: "https://picsum.photos/seed/user3/100/100",
    lastLogin: new Date("2024-07-28T18:00:00Z"),
    status: "active",
    password: "password123",
  },
  {
    id: randomUUID(),
    tenantId: tenant2.id,
    name: "Kofi Manu",
    email: "owner@globex.com",
    role: "Owner",
    avatarUrl: "https://picsum.photos/seed/user4/100/100",
    lastLogin: new Date("2024-07-27T12:00:00Z"),
    status: "active",
    password: "password123",
  },
];

const [user1, user2, user3, user4] = usersData;

const categoriesData = [
  { id: randomUUID(), tenantId: tenant1.id, name: "Electronics" },
  { id: randomUUID(), tenantId: tenant1.id, name: "Wearables" },
  { id: randomUUID(), tenantId: tenant2.id, name: "Apparel" },
];

const [cat1, cat2, cat3] = categoriesData;

const suppliersData = [
  { id: randomUUID(), tenantId: tenant1.id, name: "Sony" },
  { id: randomUUID(), tenantId: tenant1.id, name: "Apple" },
  { id: randomUUID(), tenantId: tenant2.id, name: "Hermes" },
];

const [sup1, sup2, sup3] = suppliersData;

const productsData = [
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    name: "Wireless Headphones",
    sku: "WH-1000XM4",
    categoryId: cat1.id,
    supplierId: sup1.id,
    price: 349.99,
    costPrice: 220.5,
    stock: 25,
    stockThreshold: 10,
    imageUrl: "https://picsum.photos/seed/product1/400/300",
    imageHint: "wireless headphones",
    status: "active",
  },
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    name: "Smartwatch Series 7",
    sku: "SW-S7-BLK",
    categoryId: cat2.id,
    supplierId: sup2.id,
    price: 429.0,
    costPrice: 310.0,
    stock: 15,
    stockThreshold: 5,
    imageUrl: "https://picsum.photos/seed/product2/400/300",
    imageHint: "smartwatch",
    status: "active",
  },
  {
    id: randomUUID(),
    tenantId: tenant2.id,
    name: "Silk Scarf",
    sku: "SS-RED-FLR",
    categoryId: cat3.id,
    supplierId: sup3.id,
    price: 450.0,
    costPrice: 200.0,
    stock: 12,
    stockThreshold: 5,
    imageUrl: "https://picsum.photos/seed/product11/400/300",
    imageHint: "scarf fashion",
    status: "active",
  },
];

const [prod1, prod2, prod3] = productsData;

const customersData = [
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    name: "Khalid Walid",
    email: "khalidw@example.com",
    phone: "123-456-7890",
    totalSpent: 1250.5,
    avatarUrl: "https://picsum.photos/seed/cust1/100/100",
    joinedAt: new Date("2023-05-10"),
    balance: 0,
  },
  {
    id: randomUUID(),
    tenantId: tenant2.id,
    name: "Opoku Wilson",
    email: "opoku.w@example.com",
    phone: "123-456-7890",
    totalSpent: 550.0,
    avatarUrl: "https://picsum.photos/seed/cust4/100/100",
    joinedAt: new Date("2023-08-01"),
    balance: 0,
  },
];

const [cust1, cust2] = customersData;

const shiftsData = [
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    cashierId: user3.id,
    cashierName: "Mohammad Ross",
    startTime: new Date("2024-07-30T09:00:00Z"),
    endTime: new Date("2024-07-30T17:00:00Z"),
    status: "closed",
    startingCash: 200.0,
    cashSales: 1540.5,
    cardSales: 2300.0,
    mobileSales: 850.25,
    creditSales: 150.75,
    totalSales: 4841.5,
    expectedCash: 1740.5,
    actualCash: 1740.0,
    cashDifference: -0.5,
  },
];

const [shift1] = shiftsData;

const salesData = [
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    shiftId: shift1.id,
    cashierId: user3.id,
    cashierName: "Mohammad Ross",
    totalAmount: 778.99,
    totalProfit: 248.49,
    paymentMethod: "card",
    status: "paid",
    createdAt: new Date("2024-07-29T14:30:00Z"),
    discountAmount: 0,
  },
];

const [sale1] = salesData;

const saleItemsData = [
  {
    id: randomUUID(),
    saleId: sale1.id,
    productId: prod1.id,
    productName: "Wireless Headphones",
    quantity: 1,
    price: 349.99,
    costPrice: 220.5,
  },
  {
    id: randomUUID(),
    saleId: sale1.id,
    productId: prod2.id,
    productName: "Smartwatch Series 7",
    quantity: 1,
    price: 429.0,
    costPrice: 310.0,
  },
];

const purchaseOrdersData = [
  {
    id: randomUUID(),
    tenantId: tenant1.id,
    poNumber: "PO-2024-001",
    supplierId: sup1.id,
    status: "received",
    createdAt: new Date("2024-07-15T10:00:00Z"),
    totalCost: 10500.0,
  },
];

const [po1] = purchaseOrdersData;

const purchaseOrderItemsData = [
  {
    id: randomUUID(),
    purchaseOrderId: po1.id,
    productId: prod1.id,
    productName: "Wireless Headphones",
    quantity: 50,
    costPrice: 210.0,
  },
];

// ==============================
// SEED FUNCTION
// ==============================
async function seed() {
  console.log("🌱 Starting UUID-based database seed...\n");

  try {
    await db.insert(tenants).values(mockData.tenants.map((t) => ({...t, totalSales: t.totalSales.toString(),})));
    console.log(`✅ Inserted tenants`);

    for (const user of usersData) {
      const hashed = await hash(user.password, 10);
      await db.insert(users).values({ ...user, password: hashed });
    }
    console.log(`✅ Inserted users`);

    await db.insert(categories).values(categoriesData);
    await db.insert(suppliers).values(suppliersData);
    await db.insert(products).values(productsData.map((p) => ({ ...p, price: p.price.toString(), costPrice: p.costPrice.toString(),})));
    await db.insert(customers).values(customersData.map((c) => ({...c, totalSpent: c.totalSpent.toString(), balance: c.balance.toString(),})));
    await db.insert(shifts).values(shiftsData.map((s) => ({...s, startingCash: s.startingCash.toString(), cashSales: s.cashSales.toString(), cardSales: s.cardSales.toString(), mobileSales: s.mobileSales.toString(), creditSales: s.creditSales.toString(), totalSales: s.totalSales.toString(), expectedCash: s.expectedCash.toString(), actualCash: s.actualCash.toString(), cashDifference: s.cashDifference.toString(),})));
    await db.insert(sales).values(salesData.map((s) => ({...s, totalAmount: s.totalAmount.toString(), totalProfit: s.totalProfit.toString(), discountAmount: s.discountAmount.toString(),})));
    await db.insert(saleItems).values(saleItemsData.map((si) => ({...si, price: si.price.toString(), costPrice: si.costPrice.toString(),})));
    await db.insert(purchaseOrders).values(purchaseOrdersData.map((po) => ({...po, totalCost: po.totalCost.toString(),})));
    await db.insert(purchaseOrderItems).values(purchaseOrderItemsData.map((poi) => ({...poi, costPrice: poi.costPrice.toString(),})));

    console.log("\n🎉 Seed complete! Your Postgres database now has UUID-based demo data.");
    console.log("🔑 Login: owner@gshop.com / password123\n");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
