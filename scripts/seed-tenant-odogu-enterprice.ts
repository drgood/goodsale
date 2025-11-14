import dotenv from "dotenv";
dotenv.config({ path: ".env.production" });

import { db } from '@/db';
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
} from '@/db/schema';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

async function seedOdoguEnterpriceTenant() {
  try {
    console.log('🌱 Seeding tenant: Odogu Enterprice...\n');

    // 1. Ensure tenant exists (create if missing)
    let odoguTenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.subdomain, 'odogu'),
    });

    if (!odoguTenant) {
      const [insertedTenant] = await db
        .insert(tenants)
        .values({
          name: 'Odogu Enterprice',
          subdomain: 'odogu',
          plan: 'starter',
          status: 'active',
          userCount: 3,
          productCount: 12,
          totalSales: '0',
        })
        .returning();

      odoguTenant = insertedTenant;

      console.log('\n✅ Tenant "Odogu Enterprice" created successfully!');
      console.log('   Name: Odogu Enterprice');
      console.log('   Subdomain: odogu');
      console.log('   Plan: starter');
      console.log('   Status: active');
    } else {
      console.log('✅ Tenant "Odogu Enterprice" already exists. Seeding related data...');
    }

    const tenantId = odoguTenant.id;

    // 2. Seed core related data similar to src/scripts/seed.ts

    // Users (owner + staff)
    const usersData = [
      {
        id: randomUUID(),
        tenantId,
        name: 'Odogu Owner',
        email: 'owner@odogu-enterprice.com',
        role: 'Owner',
        avatarUrl: 'https://picsum.photos/seed/odogu-owner/100/100',
        lastLogin: new Date(),
        status: 'active',
        password: 'password123',
      },
      {
        id: randomUUID(),
        tenantId,
        name: 'Odogu Manager',
        email: 'manager@odogu-enterprice.com',
        role: 'Manager',
        avatarUrl: 'https://picsum.photos/seed/odogu-manager/100/100',
        lastLogin: new Date(),
        status: 'active',
        password: 'password123',
      },
      {
        id: randomUUID(),
        tenantId,
        name: 'Odogu Cashier',
        email: 'cashier@odogu-enterprice.com',
        role: 'Cashier',
        avatarUrl: 'https://picsum.photos/seed/odogu-cashier/100/100',
        lastLogin: new Date(),
        status: 'active',
        password: 'password123',
      },
    ];

    // Categories
    const categoriesData = [
      { id: randomUUID(), tenantId, name: 'Groceries' },
      { id: randomUUID(), tenantId, name: 'Household' },
      { id: randomUUID(), tenantId, name: 'Beverages' },
    ];

    // Suppliers
    const suppliersData = [
      { id: randomUUID(), tenantId, name: 'Odogu Wholesale' },
      { id: randomUUID(), tenantId, name: 'City Distributors' },
    ];

    const [catGroceries, catHousehold, catBeverages] = categoriesData;
    const [supWholesale, supCity] = suppliersData;

    // Products
    const productsData = [
      {
        id: randomUUID(),
        tenantId,
        name: 'Premium Rice 25kg',
        sku: 'ODG-RICE-25KG',
        categoryId: catGroceries.id,
        supplierId: supWholesale.id,
        price: 420.0,
        costPrice: 350.0,
        stock: 40,
        stockThreshold: 10,
        imageUrl: 'https://picsum.photos/seed/odogu-rice/400/300',
        imageHint: 'bag of rice',
        status: 'active',
      },
      {
        id: randomUUID(),
        tenantId,
        name: 'Sunflower Cooking Oil 5L',
        sku: 'ODG-OIL-5L',
        categoryId: catGroceries.id,
        supplierId: supCity.id,
        price: 180.0,
        costPrice: 140.0,
        stock: 25,
        stockThreshold: 8,
        imageUrl: 'https://picsum.photos/seed/odogu-oil/400/300',
        imageHint: 'cooking oil bottle',
        status: 'active',
      },
      {
        id: randomUUID(),
        tenantId,
        name: 'Multi-Purpose Cleaner 1L',
        sku: 'ODG-CLEAN-1L',
        categoryId: catHousehold.id,
        supplierId: supCity.id,
        price: 45.0,
        costPrice: 30.0,
        stock: 60,
        stockThreshold: 15,
        imageUrl: 'https://picsum.photos/seed/odogu-cleaner/400/300',
        imageHint: 'cleaning product',
        status: 'active',
      },
    ];

    const [prodRice, prodOil, prodCleaner] = productsData;

    // Customers
    const customersData = [
      {
        id: randomUUID(),
        tenantId,
        name: 'Chinedu Okafor',
        email: 'chinedu.okafor@example.com',
        phone: '233-555-000001',
        totalSpent: 0,
        avatarUrl: 'https://picsum.photos/seed/odogu-cust1/100/100',
        joinedAt: new Date(),
        balance: 0,
      },
      {
        id: randomUUID(),
        tenantId,
        name: 'Ama Mensah',
        email: 'ama.mensah@example.com',
        phone: '233-555-000002',
        totalSpent: 0,
        avatarUrl: 'https://picsum.photos/seed/odogu-cust2/100/100',
        joinedAt: new Date(),
        balance: 0,
      },
    ];

    const [cust1, cust2] = customersData;

    // One demo shift, sale, and purchase order
    const cashierUser = usersData.find((u) => u.role === 'Cashier')!;

    const shiftsData = [
      {
        id: randomUUID(),
        tenantId,
        cashierId: cashierUser.id,
        cashierName: cashierUser.name,
        startTime: new Date(),
        endTime: new Date(),
        status: 'closed',
        startingCash: 200.0,
        cashSales: 500.0,
        cardSales: 350.0,
        mobileSales: 150.0,
        creditSales: 50.0,
        totalSales: 1050.0,
        expectedCash: 700.0,
        actualCash: 700.0,
        cashDifference: 0,
      },
    ];

    const [shift1] = shiftsData;

    const salesData = [
      {
        id: randomUUID(),
        tenantId,
        shiftId: shift1.id,
        cashierId: cashierUser.id,
        cashierName: cashierUser.name,
        totalAmount: 600.0,
        totalProfit: 160.0,
        paymentMethod: 'cash',
        status: 'paid',
        createdAt: new Date(),
        discountAmount: 0,
      },
    ];

    const [sale1] = salesData;

    const saleItemsData = [
      {
        id: randomUUID(),
        saleId: sale1.id,
        productId: prodRice.id,
        productName: prodRice.name,
        quantity: 1,
        price: 420.0,
        costPrice: 350.0,
      },
      {
        id: randomUUID(),
        saleId: sale1.id,
        productId: prodOil.id,
        productName: prodOil.name,
        quantity: 1,
        price: 180.0,
        costPrice: 140.0,
      },
    ];

    const purchaseOrdersData = [
      {
        id: randomUUID(),
        tenantId,
        poNumber: 'ODG-PO-2024-001',
        supplierId: supWholesale.id,
        status: 'received',
        createdAt: new Date(),
        totalCost: 15000.0,
      },
    ];

    const [po1] = purchaseOrdersData;

    const purchaseOrderItemsData = [
      {
        id: randomUUID(),
        purchaseOrderId: po1.id,
        productId: prodRice.id,
        productName: prodRice.name,
        quantity: 50,
        costPrice: 300.0,
      },
    ];

    // 3. Perform inserts (convert numeric money fields to strings like seed.ts)

    for (const user of usersData) {
      const hashed = await hash(user.password, 10);
      await db.insert(users).values({ ...user, password: hashed });
    }
    console.log('✅ Inserted Odogu users');

    await db.insert(categories).values(categoriesData);
    console.log('✅ Inserted Odogu categories');

    await db.insert(suppliers).values(suppliersData);
    console.log('✅ Inserted Odogu suppliers');

    await db.insert(products).values(
      productsData.map((p) => ({
        ...p,
        price: p.price.toString(),
        costPrice: p.costPrice.toString(),
      })),
    );
    console.log('✅ Inserted Odogu products');

    await db.insert(customers).values(
      customersData.map((c) => ({
        ...c,
        totalSpent: c.totalSpent.toString(),
        balance: c.balance.toString(),
      })),
    );
    console.log('✅ Inserted Odogu customers');

    await db.insert(shifts).values(
      shiftsData.map((s) => ({
        ...s,
        startingCash: s.startingCash.toString(),
        cashSales: s.cashSales.toString(),
        cardSales: s.cardSales.toString(),
        mobileSales: s.mobileSales.toString(),
        creditSales: s.creditSales.toString(),
        totalSales: s.totalSales.toString(),
        expectedCash: s.expectedCash.toString(),
        actualCash: s.actualCash.toString(),
        cashDifference: s.cashDifference.toString(),
      })),
    );
    console.log('✅ Inserted Odogu shifts');

    await db.insert(sales).values(
      salesData.map((s) => ({
        ...s,
        totalAmount: s.totalAmount.toString(),
        totalProfit: s.totalProfit.toString(),
        discountAmount: s.discountAmount.toString(),
      })),
    );
    console.log('✅ Inserted Odogu sales');

    await db.insert(saleItems).values(
      saleItemsData.map((si) => ({
        ...si,
        price: si.price.toString(),
        costPrice: si.costPrice.toString(),
      })),
    );
    console.log('✅ Inserted Odogu sale items');

    await db.insert(purchaseOrders).values(
      purchaseOrdersData.map((po) => ({
        ...po,
        totalCost: po.totalCost.toString(),
      })),
    );
    console.log('✅ Inserted Odogu purchase orders');

    await db.insert(purchaseOrderItems).values(
      purchaseOrderItemsData.map((poi) => ({
        ...poi,
        costPrice: poi.costPrice.toString(),
      })),
    );
    console.log('✅ Inserted Odogu purchase order items');

    console.log('\n🎉 Odogu Enterprice tenant and related demo data seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tenant "Odogu Enterprice":', error);
    process.exit(1);
  }
}

seedOdoguEnterpriceTenant();
