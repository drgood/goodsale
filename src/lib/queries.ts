import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import type { Product, Sale, Customer, Category, Supplier, User, Tenant, Shift, PurchaseOrder, PurchaseOrderItem } from './types';

// =====================================================
// TENANTS
// =====================================================
export async function getTenants() {
  return await db.select().from(schema.tenants).orderBy(desc(schema.tenants.createdAt));
}

export async function getTenantById(id: string) {
  const result = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id)).limit(1);
  return result[0] || null;
}

export async function getTenantBySubdomain(subdomain: string) {
  const result = await db.select().from(schema.tenants).where(eq(schema.tenants.subdomain, subdomain)).limit(1);
  return result[0] || null;
}

// =====================================================
// USERS
// =====================================================
export async function getUsersByTenant(tenantId: string): Promise<User[]> {
  const result = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId));
  return result.map(user => ({
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role as 'Owner' | 'Manager' | 'Cashier',
    avatarUrl: user.avatarUrl,
    lastLogin: user.lastLogin?.toISOString(),
    status: user.status as 'active' | 'invited' | 'disabled'
  }));
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return result[0] || null;
}

// =====================================================
// CATEGORIES
// =====================================================
export async function getCategoriesByTenant(tenantId: string): Promise<Category[]> {
  const result = await db
    .select({
      id: schema.categories.id,
      tenantId: schema.categories.tenantId,
      name: schema.categories.name,
      productCount: count(schema.products.id)
    })
    .from(schema.categories)
    .leftJoin(schema.products, eq(schema.categories.id, schema.products.categoryId))
    .where(eq(schema.categories.tenantId, tenantId))
    .groupBy(schema.categories.id, schema.categories.tenantId, schema.categories.name);
  
  return result;
}

export async function createCategory(tenantId: string, name: string) {
  const result = await db.insert(schema.categories).values({ tenantId, name }).returning();
  return result[0];
}

// =====================================================
// SUPPLIERS
// =====================================================
export async function getSuppliersByTenant(tenantId: string): Promise<Supplier[]> {
  const result = await db
    .select({
      id: schema.suppliers.id,
      tenantId: schema.suppliers.tenantId,
      name: schema.suppliers.name,
      contact: schema.suppliers.contact,
      phone: schema.suppliers.phone,
      email: schema.suppliers.email,
      address: schema.suppliers.address,
      productCount: count(schema.products.id)
    })
    .from(schema.suppliers)
    .leftJoin(schema.products, eq(schema.suppliers.id, schema.products.supplierId))
    .where(eq(schema.suppliers.tenantId, tenantId))
    .groupBy(
      schema.suppliers.id,
      schema.suppliers.tenantId,
      schema.suppliers.name,
      schema.suppliers.contact,
      schema.suppliers.phone,
      schema.suppliers.email,
      schema.suppliers.address
    );
  
  return result;
}

export async function createSupplier(data: { tenantId: string; name: string; contact?: string; phone?: string; email?: string; address?: string }) {
  const result = await db.insert(schema.suppliers).values(data).returning();
  return result[0];
}

// =====================================================
// PRODUCTS
// =====================================================
export async function getProductsByTenant(tenantId: string): Promise<Product[]> {
  const result = await db
    .select({
      id: schema.products.id,
      tenantId: schema.products.tenantId,
      name: schema.products.name,
      sku: schema.products.sku,
      categoryId: schema.products.categoryId,
      categoryName: schema.categories.name,
      supplierId: schema.products.supplierId,
      supplierName: schema.suppliers.name,
      price: schema.products.price,
      costPrice: schema.products.costPrice,
      stock: schema.products.stock,
      stockThreshold: schema.products.stockThreshold,
      imageUrl: schema.products.imageUrl,
      imageHint: schema.products.imageHint,
      status: schema.products.status,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .leftJoin(schema.suppliers, eq(schema.products.supplierId, schema.suppliers.id))
    .where(eq(schema.products.tenantId, tenantId))
    .orderBy(desc(schema.products.createdAt));

  return result.map(p => ({
    id: p.id,
    tenantId: p.tenantId,
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId,
    categoryName: p.categoryName || undefined,
    supplierId: p.supplierId,
    supplierName: p.supplierName || undefined,
    price: parseFloat(p.price),
    costPrice: parseFloat(p.costPrice),
    stock: p.stock || 0,
    stockThreshold: p.stockThreshold || 0,
    imageUrl: p.imageUrl,
    imageHint: p.imageHint,
    status: p.status as 'active' | 'draft' | 'archived',
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString()
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await db
    .select({
      id: schema.products.id,
      tenantId: schema.products.tenantId,
      name: schema.products.name,
      sku: schema.products.sku,
      categoryId: schema.products.categoryId,
      categoryName: schema.categories.name,
      supplierId: schema.products.supplierId,
      supplierName: schema.suppliers.name,
      price: schema.products.price,
      costPrice: schema.products.costPrice,
      stock: schema.products.stock,
      stockThreshold: schema.products.stockThreshold,
      imageUrl: schema.products.imageUrl,
      imageHint: schema.products.imageHint,
      status: schema.products.status,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .leftJoin(schema.suppliers, eq(schema.products.supplierId, schema.suppliers.id))
    .where(eq(schema.products.id, id))
    .limit(1);

  if (!result[0]) return null;

  const p = result[0];
  return {
    id: p.id,
    tenantId: p.tenantId,
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId,
    categoryName: p.categoryName || undefined,
    supplierId: p.supplierId,
    supplierName: p.supplierName || undefined,
    price: parseFloat(p.price),
    costPrice: parseFloat(p.costPrice),
    stock: p.stock || 0,
    stockThreshold: p.stockThreshold || 0,
    imageUrl: p.imageUrl,
    imageHint: p.imageHint,
    status: p.status as 'active' | 'draft' | 'archived',
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString()
  };
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'supplierName'>) {
  const result = await db.insert(schema.products).values({
    tenantId: data.tenantId,
    name: data.name,
    sku: data.sku,
    categoryId: data.categoryId,
    supplierId: data.supplierId,
    price: data.price.toString(),
    costPrice: data.costPrice.toString(),
    stock: data.stock,
    stockThreshold: data.stockThreshold,
    imageUrl: data.imageUrl,
    imageHint: data.imageHint,
    status: data.status
  }).returning();
  return result[0];
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'tenantId' | 'categoryName' | 'supplierName'>>) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
  if (data.price !== undefined) updateData.price = data.price.toString();
  if (data.costPrice !== undefined) updateData.costPrice = data.costPrice.toString();
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.stockThreshold !== undefined) updateData.stockThreshold = data.stockThreshold;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.imageHint !== undefined) updateData.imageHint = data.imageHint;
  if (data.status !== undefined) updateData.status = data.status;
  updateData.updatedAt = new Date();

  const result = await db.update(schema.products).set(updateData).where(eq(schema.products.id, id)).returning();
  return result[0];
}

export async function deleteProduct(id: string) {
  await db.delete(schema.products).where(eq(schema.products.id, id));
}

// =====================================================
// CUSTOMERS
// =====================================================
export async function getCustomersByTenant(tenantId: string): Promise<Customer[]> {
  const result = await db.select().from(schema.customers).where(eq(schema.customers.tenantId, tenantId));
  return result.map(c => ({
    id: c.id,
    tenantId: c.tenantId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    totalSpent: parseFloat(c.totalSpent || '0'),
    avatarUrl: c.avatarUrl,
    joinedAt: c.joinedAt?.toISOString() || new Date().toISOString(),
    balance: parseFloat(c.balance || '0')
  }));
}

export async function createCustomer(data: Omit<Customer, 'id' | 'joinedAt'>) {
  const values: any = {
    tenantId: data.tenantId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    avatarUrl: data.avatarUrl,
  };
  
  // Only set if provided, otherwise use database defaults
  if (data.totalSpent !== undefined) values.totalSpent = data.totalSpent.toString();
  if (data.balance !== undefined) values.balance = data.balance.toString();
  
  const result = await db.insert(schema.customers).values(values).returning();
  return result[0];
}

export async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'tenantId' | 'joinedAt'>>) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.totalSpent !== undefined) updateData.totalSpent = data.totalSpent.toString();
  if (data.balance !== undefined) updateData.balance = data.balance.toString();

  const result = await db.update(schema.customers).set(updateData).where(eq(schema.customers.id, id)).returning();
  return result[0];
}

// =====================================================
// SALES
// =====================================================
export async function getSalesByTenant(tenantId: string): Promise<Sale[]> {
  const salesResult = await db.select().from(schema.sales)
    .where(eq(schema.sales.tenantId, tenantId))
    .orderBy(desc(schema.sales.createdAt));

  const salesWithItems = await Promise.all(salesResult.map(async (sale) => {
    const items = await db.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, sale.id));
    
    return {
      id: sale.id,
      tenantId: sale.tenantId,
      shiftId: sale.shiftId || '',
      cashierId: sale.cashierId || '',
      cashierName: sale.cashierName || '',
      customerId: sale.customerId || undefined,
      customerName: sale.customerName || undefined,
      totalAmount: parseFloat(sale.totalAmount),
      totalProfit: parseFloat(sale.totalProfit || '0'),
      itemCount: items.length,
      paymentMethod: sale.paymentMethod as 'Cash' | 'Card' | 'Mobile' | 'On Credit',
      status: sale.status as 'Paid' | 'Pending',
      discountAmount: parseFloat(sale.discountAmount || '0'),
      amountSettled: parseFloat(sale.amountSettled || '0'),
      createdAt: sale.createdAt?.toISOString() || new Date().toISOString(),
      items: items.map(item => ({
        productId: item.productId || '',
        productName: item.productName || '',
        quantity: item.quantity,
        price: parseFloat(item.price),
        costPrice: parseFloat(item.costPrice)
      }))
    };
  }));

  return salesWithItems;
}

export async function createSale(data: Omit<Sale, 'id' | 'createdAt' | 'itemCount'>, tenantId: string) {
  // Create sale
  const saleResult = await db.insert(schema.sales).values({
    tenantId,
    shiftId: data.shiftId || null,
    cashierId: data.cashierId || null,
    cashierName: data.cashierName,
    customerId: data.customerId || null,
    customerName: data.customerName || null,
    totalAmount: data.totalAmount.toString(),
    totalProfit: data.totalProfit.toString(),
    paymentMethod: data.paymentMethod,
    status: data.status,
    discountAmount: (data.discountAmount || 0).toString()
  }).returning();

  const sale = saleResult[0];

  // Create sale items
  if (data.items && data.items.length > 0) {
    await db.insert(schema.saleItems).values(
      data.items.map(item => ({
        saleId: sale.id,
        productId: item.productId || null,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price.toString(),
        costPrice: item.costPrice.toString()
      }))
    );
  }

  return sale;
}

export async function updateSale(id: string, data: Partial<Omit<Sale, 'id' | 'tenantId' | 'createdAt' | 'items' | 'itemCount'>>) {
  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.amountSettled !== undefined) updateData.amountSettled = data.amountSettled.toString();
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount.toString();

  const result = await db.update(schema.sales).set(updateData).where(eq(schema.sales.id, id)).returning();
  return result[0];
}

// =====================================================
// SHIFTS
// =====================================================
export async function getShiftsByTenant(tenantId: string): Promise<Shift[]> {
  const result = await db.select().from(schema.shifts)
    .where(eq(schema.shifts.tenantId, tenantId))
    .orderBy(desc(schema.shifts.startTime));

  return result.map(s => ({
    id: s.id,
    tenantId: s.tenantId,
    cashierId: s.cashierId || '',
    cashierName: s.cashierName || '',
    startTime: s.startTime.toISOString(),
    endTime: s.endTime?.toISOString(),
    status: s.status as 'open' | 'closed',
    startingCash: parseFloat(s.startingCash),
    cashSales: parseFloat(s.cashSales || '0'),
    cardSales: parseFloat(s.cardSales || '0'),
    mobileSales: parseFloat(s.mobileSales || '0'),
    creditSales: parseFloat(s.creditSales || '0'),
    totalSales: parseFloat(s.totalSales || '0'),
    cashSettlements: s.cashSettlements ? parseFloat(s.cashSettlements) : undefined,
    cardSettlements: s.cardSettlements ? parseFloat(s.cardSettlements) : undefined,
    mobileSettlements: s.mobileSettlements ? parseFloat(s.mobileSettlements) : undefined,
    cashReturns: s.cashReturns ? parseFloat(s.cashReturns) : undefined,
    expectedCash: parseFloat(s.expectedCash || '0'),
    actualCash: s.actualCash ? parseFloat(s.actualCash) : undefined,
    cashDifference: s.cashDifference ? parseFloat(s.cashDifference) : undefined
  }));
}

// =====================================================
// PURCHASE ORDERS
// =====================================================
export async function getPurchaseOrdersByTenant(tenantId: string): Promise<PurchaseOrder[]> {
  const posResult = await db.select({
    id: schema.purchaseOrders.id,
    tenantId: schema.purchaseOrders.tenantId,
    poNumber: schema.purchaseOrders.poNumber,
    supplierId: schema.purchaseOrders.supplierId,
    supplierName: schema.suppliers.name,
    status: schema.purchaseOrders.status,
    createdAt: schema.purchaseOrders.createdAt,
    totalCost: schema.purchaseOrders.totalCost
  })
  .from(schema.purchaseOrders)
  .leftJoin(schema.suppliers, eq(schema.purchaseOrders.supplierId, schema.suppliers.id))
  .where(eq(schema.purchaseOrders.tenantId, tenantId))
  .orderBy(desc(schema.purchaseOrders.createdAt));

  const posWithItems = await Promise.all(posResult.map(async (po) => {
    const items = await db.select().from(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.purchaseOrderId, po.id));
    
    return {
      id: po.id,
      tenantId: po.tenantId,
      poNumber: po.poNumber,
      supplierId: po.supplierId || '',
      supplierName: po.supplierName || '',
      status: po.status as 'Draft' | 'Ordered' | 'Received',
      createdAt: po.createdAt?.toISOString() || new Date().toISOString(),
      totalCost: parseFloat(po.totalCost),
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName || '',
        quantity: item.quantity,
        costPrice: parseFloat(item.costPrice)
      }))
    };
  }));

  return posWithItems;
}

export async function createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'createdAt'>, tenantId: string) {
  // Create purchase order
  const poResult = await db.insert(schema.purchaseOrders).values({
    tenantId,
    supplierId: data.supplierId || null,
    poNumber: data.poNumber,
    status: data.status,
    totalCost: data.totalCost.toString()
  }).returning();

  const po = poResult[0];

  // Create purchase order items
  if (data.items && data.items.length > 0) {
    await db.insert(schema.purchaseOrderItems).values(
      data.items.map(item => ({
        purchaseOrderId: po.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.costPrice.toString()
      }))
    );
  }

  return po;
}

export async function updatePurchaseOrder(id: string, data: Partial<Omit<PurchaseOrder, 'id' | 'tenantId' | 'createdAt' | 'supplierName'>>) {
  const updateData: any = {};
  if (data.poNumber !== undefined) updateData.poNumber = data.poNumber;
  if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.totalCost !== undefined) updateData.totalCost = data.totalCost.toString();

  const result = await db.update(schema.purchaseOrders).set(updateData).where(eq(schema.purchaseOrders.id, id)).returning();
  
  // If items are provided, update them
  if (data.items) {
    // Delete existing items
    await db.delete(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.purchaseOrderId, id));
    
    // Insert new items
    if (data.items.length > 0) {
      await db.insert(schema.purchaseOrderItems).values(
        data.items.map(item => ({
          purchaseOrderId: id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice.toString()
        }))
      );
    }
  }
  
  return result[0];
}

export async function deletePurchaseOrder(id: string) {
  // Items will be cascade deleted due to foreign key
  await db.delete(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, id));
}

export async function updateProductStock(productId: string, quantity: number) {
  await db.update(schema.products)
    .set({ stock: sql`${schema.products.stock} + ${quantity}` })
    .where(eq(schema.products.id, productId));
}

// =====================================================
// RETURN POLICIES
// =====================================================
export async function getReturnPolicyByTenant(tenantId: string) {
  const result = await db
    .select()
    .from(schema.returnPolicies)
    .where(eq(schema.returnPolicies.tenantId, tenantId))
    .limit(1);
  
  const policy = result[0];
  if (!policy) return null;
  
  return {
    id: policy.id,
    tenantId: policy.tenantId,
    returnWindowDays: policy.returnWindowDays,
    refundMethod: policy.refundMethod,
    restockingFeePercent: parseFloat(policy.restockingFeePercent || '0'),
    requiresApproval: policy.requiresApproval,
    allowPartialReturns: policy.allowPartialReturns,
    notifyCustomer: policy.notifyCustomer,
    createdAt: policy.createdAt?.toISOString(),
    updatedAt: policy.updatedAt?.toISOString()
  };
}

export async function createOrUpdateReturnPolicy(tenantId: string, data: {
  returnWindowDays: number;
  refundMethod: string;
  restockingFeePercent: number;
  requiresApproval: boolean;
  allowPartialReturns: boolean;
  notifyCustomer: boolean;
}) {
  // Check if policy exists
  const existing = await db
    .select()
    .from(schema.returnPolicies)
    .where(eq(schema.returnPolicies.tenantId, tenantId))
    .limit(1);
  
  if (existing.length > 0) {
    const result = await db
      .update(schema.returnPolicies)
      .set({
        returnWindowDays: data.returnWindowDays,
        refundMethod: data.refundMethod,
        restockingFeePercent: data.restockingFeePercent.toString(),
        requiresApproval: data.requiresApproval,
        allowPartialReturns: data.allowPartialReturns,
        notifyCustomer: data.notifyCustomer,
        updatedAt: new Date()
      })
      .where(eq(schema.returnPolicies.tenantId, tenantId))
      .returning();
    return result[0];
  }
  
  const result = await db
    .insert(schema.returnPolicies)
    .values({
      tenantId,
      returnWindowDays: data.returnWindowDays,
      refundMethod: data.refundMethod,
      restockingFeePercent: data.restockingFeePercent.toString(),
      requiresApproval: data.requiresApproval,
      allowPartialReturns: data.allowPartialReturns,
      notifyCustomer: data.notifyCustomer
    })
    .returning();
  
  return result[0];
}

// =====================================================
// RETURNS
// =====================================================
export async function getReturnsByTenant(tenantId: string) {
  const result = await db
    .select()
    .from(schema.returns)
    .where(eq(schema.returns.tenantId, tenantId))
    .orderBy(desc(schema.returns.createdAt));
  
  return result.map(r => ({
    id: r.id,
    tenantId: r.tenantId,
    saleId: r.saleId,
    customerId: r.customerId,
    requestedBy: r.requestedBy,
    reason: r.reason,
    status: r.status,
    totalReturnAmount: parseFloat(r.totalReturnAmount),
    restockingFeeAmount: parseFloat(r.restockingFeeAmount || '0'),
    refundAmount: parseFloat(r.refundAmount),
    refundMethod: r.refundMethod,
    approvedBy: r.approvedBy,
    approvalReason: r.approvalReason,
    rejectionReason: r.rejectionReason,
    refundedAt: r.refundedAt?.toISOString(),
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString()
  }));
}

export async function getReturnById(returnId: string) {
  const returnRecord = await db
    .select()
    .from(schema.returns)
    .where(eq(schema.returns.id, returnId))
    .limit(1);
  
  if (!returnRecord[0]) return null;
  
  const items = await db
    .select()
    .from(schema.returnItems)
    .where(eq(schema.returnItems.returnId, returnId));
  
  const r = returnRecord[0];
  return {
    id: r.id,
    tenantId: r.tenantId,
    saleId: r.saleId,
    customerId: r.customerId,
    requestedBy: r.requestedBy,
    reason: r.reason,
    status: r.status,
    totalReturnAmount: parseFloat(r.totalReturnAmount),
    restockingFeeAmount: parseFloat(r.restockingFeeAmount || '0'),
    refundAmount: parseFloat(r.refundAmount),
    refundMethod: r.refundMethod,
    approvedBy: r.approvedBy,
    approvalReason: r.approvalReason,
    rejectionReason: r.rejectionReason,
    refundedAt: r.refundedAt?.toISOString(),
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
    items: items.map(item => ({
      id: item.id,
      returnId: item.returnId,
      saleItemId: item.saleItemId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      returnAmount: parseFloat(item.returnAmount),
      condition: item.condition
    }))
  };
}

export async function createReturn(data: {
  tenantId: string;
  saleId: string;
  customerId?: string | null;
  requestedBy?: string | null;
  reason?: string | null;
  totalReturnAmount: number;
  restockingFeeAmount: number;
  refundAmount: number;
  items: Array<{
    saleItemId?: string | null;
    productId?: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    returnAmount: number;
    condition?: string | null;
  }>;
}) {
  // Create return record
  const returnResult = await db
    .insert(schema.returns)
    .values({
      tenantId: data.tenantId,
      saleId: data.saleId,
      customerId: data.customerId || null,
      requestedBy: data.requestedBy || null,
      reason: data.reason || null,
      totalReturnAmount: data.totalReturnAmount.toString(),
      restockingFeeAmount: data.restockingFeeAmount.toString(),
      refundAmount: data.refundAmount.toString(),
      status: 'pending'
    })
    .returning();
  
  const returnRecord = returnResult[0];
  
  // Create return items
  if (data.items.length > 0) {
    await db
      .insert(schema.returnItems)
      .values(
        data.items.map(item => ({
          returnId: returnRecord.id,
          saleItemId: item.saleItemId || null,
          productId: item.productId || null,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          returnAmount: item.returnAmount.toString(),
          condition: item.condition || null
        }))
      );
  }
  
  // Return with parsed numeric fields
  return {
    id: returnRecord.id,
    tenantId: returnRecord.tenantId,
    saleId: returnRecord.saleId,
    customerId: returnRecord.customerId,
    requestedBy: returnRecord.requestedBy,
    reason: returnRecord.reason,
    status: returnRecord.status,
    totalReturnAmount: parseFloat(returnRecord.totalReturnAmount),
    restockingFeeAmount: parseFloat(returnRecord.restockingFeeAmount || '0'),
    refundAmount: parseFloat(returnRecord.refundAmount),
    refundMethod: returnRecord.refundMethod,
    approvedBy: returnRecord.approvedBy,
    approvalReason: returnRecord.approvalReason,
    rejectionReason: returnRecord.rejectionReason,
    refundedAt: returnRecord.refundedAt?.toISOString(),
    createdAt: returnRecord.createdAt?.toISOString(),
    updatedAt: returnRecord.updatedAt?.toISOString()
  };
}

export async function updateReturn(returnId: string, data: {
  status?: string;
  approvedBy?: string | null;
  approvalReason?: string | null;
  rejectionReason?: string | null;
  refundMethod?: string | null;
  refundedAt?: Date | null;
}) {
  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
  if (data.approvalReason !== undefined) updateData.approvalReason = data.approvalReason;
  if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
  if (data.refundMethod !== undefined) updateData.refundMethod = data.refundMethod;
  if (data.refundedAt !== undefined) updateData.refundedAt = data.refundedAt;
  updateData.updatedAt = new Date();
  
  const result = await db
    .update(schema.returns)
    .set(updateData)
    .where(eq(schema.returns.id, returnId))
    .returning();
  
  if (!result[0]) return null;
  
  const r = result[0];
  // Return with parsed numeric fields
  return {
    id: r.id,
    tenantId: r.tenantId,
    saleId: r.saleId,
    customerId: r.customerId,
    requestedBy: r.requestedBy,
    reason: r.reason,
    status: r.status,
    totalReturnAmount: parseFloat(r.totalReturnAmount),
    restockingFeeAmount: parseFloat(r.restockingFeeAmount || '0'),
    refundAmount: parseFloat(r.refundAmount),
    refundMethod: r.refundMethod,
    approvedBy: r.approvedBy,
    approvalReason: r.approvalReason,
    rejectionReason: r.rejectionReason,
    refundedAt: r.refundedAt?.toISOString(),
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString()
  };
}

// =====================================================
// SHIFTS (POS RELATED UPDATES)
// =====================================================
export async function getShiftById(shiftId: string) {
  const result = await db
    .select()
    .from(schema.shifts)
    .where(eq(schema.shifts.id, shiftId))
    .limit(1);
  
  if (!result[0]) return null;
  
  const s = result[0];
  return {
    id: s.id,
    tenantId: s.tenantId,
    cashierId: s.cashierId,
    cashierName: s.cashierName,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    startingCash: parseFloat(s.startingCash),
    cashSales: parseFloat(s.cashSales || '0'),
    cardSales: parseFloat(s.cardSales || '0'),
    mobileSales: parseFloat(s.mobileSales || '0'),
    creditSales: parseFloat(s.creditSales || '0'),
    totalSales: parseFloat(s.totalSales || '0'),
    expectedCash: parseFloat(s.expectedCash || '0'),
    actualCash: s.actualCash ? parseFloat(s.actualCash) : null,
    cashDifference: s.cashDifference ? parseFloat(s.cashDifference) : null,
    cashSettlements: parseFloat(s.cashSettlements || '0'),
    cardSettlements: parseFloat(s.cardSettlements || '0'),
    mobileSettlements: parseFloat(s.mobileSettlements || '0'),
    cashReturns: parseFloat(s.cashReturns || '0'),
    returnAdjustments: parseFloat(s.returnAdjustments || '0'),
    cashRefundedAt: s.cashRefundedAt?.toISOString()
  };
}

export async function updateShift(shiftId: string, data: {
  cashSales?: number | string;
  cardSales?: number | string;
  mobileSales?: number | string;
  creditSales?: number | string;
  totalSales?: number | string;
  cashSettlements?: number | string;
  cardSettlements?: number | string;
  mobileSettlements?: number | string;
  cashReturns?: number | string;
  returnAdjustments?: number | string;
  expectedCash?: number | string;
  actualCash?: number | string;
  cashDifference?: number | string;
  status?: string;
  endTime?: Date;
  cashRefundedAt?: Date;
}) {
  const updateData: any = {};
  
  if (data.cashSales !== undefined) updateData.cashSales = data.cashSales.toString();
  if (data.cardSales !== undefined) updateData.cardSales = data.cardSales.toString();
  if (data.mobileSales !== undefined) updateData.mobileSales = data.mobileSales.toString();
  if (data.creditSales !== undefined) updateData.creditSales = data.creditSales.toString();
  if (data.totalSales !== undefined) updateData.totalSales = data.totalSales.toString();
  if (data.cashSettlements !== undefined) updateData.cashSettlements = data.cashSettlements.toString();
  if (data.cardSettlements !== undefined) updateData.cardSettlements = data.cardSettlements.toString();
  if (data.mobileSettlements !== undefined) updateData.mobileSettlements = data.mobileSettlements.toString();
  if (data.cashReturns !== undefined) updateData.cashReturns = data.cashReturns.toString();
  if (data.returnAdjustments !== undefined) updateData.returnAdjustments = data.returnAdjustments.toString();
  if (data.expectedCash !== undefined) updateData.expectedCash = data.expectedCash.toString();
  if (data.actualCash !== undefined) updateData.actualCash = data.actualCash.toString();
  if (data.cashDifference !== undefined) updateData.cashDifference = data.cashDifference.toString();
  if (data.status !== undefined) updateData.status = data.status;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.cashRefundedAt !== undefined) updateData.cashRefundedAt = data.cashRefundedAt;
  
  const result = await db
    .update(schema.shifts)
    .set(updateData)
    .where(eq(schema.shifts.id, shiftId))
    .returning();
  
  if (!result[0]) return null;
  
  const s = result[0];
  return {
    id: s.id,
    tenantId: s.tenantId,
    cashierId: s.cashierId,
    cashierName: s.cashierName,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    startingCash: parseFloat(s.startingCash),
    cashSales: parseFloat(s.cashSales || '0'),
    cardSales: parseFloat(s.cardSales || '0'),
    mobileSales: parseFloat(s.mobileSales || '0'),
    creditSales: parseFloat(s.creditSales || '0'),
    totalSales: parseFloat(s.totalSales || '0'),
    expectedCash: parseFloat(s.expectedCash || '0'),
    actualCash: s.actualCash ? parseFloat(s.actualCash) : null,
    cashDifference: s.cashDifference ? parseFloat(s.cashDifference) : null,
    cashSettlements: parseFloat(s.cashSettlements || '0'),
    cardSettlements: parseFloat(s.cardSettlements || '0'),
    mobileSettlements: parseFloat(s.mobileSettlements || '0'),
    cashReturns: parseFloat(s.cashReturns || '0'),
    returnAdjustments: parseFloat(s.returnAdjustments || '0'),
    cashRefundedAt: s.cashRefundedAt?.toISOString()
  };
}

// =====================================================
// RETURN TRANSACTIONS (Audit logging)
// =====================================================
export async function logReturnTransaction(data: {
  returnId: string;
  shiftId?: string | null;
  tenantId: string;
  action: string;
  refundMethod?: string | null;
  refundAmount?: number | null;
  processedBy?: string | null;
  impactOnRevenue?: number | null;
  impactOnCash?: number | null;
  impactOnExpectedCash?: number | null;
  reason?: string | null;
  notes?: string | null;
  shiftDataBefore?: any;
  shiftDataAfter?: any;
}) {
  const result = await db
    .insert(schema.returnTransactions)
    .values({
      returnId: data.returnId,
      shiftId: data.shiftId || null,
      tenantId: data.tenantId,
      action: data.action,
      refundMethod: data.refundMethod || null,
      refundAmount: data.refundAmount ? data.refundAmount.toString() : null,
      processedBy: data.processedBy || null,
      impactOnRevenue: data.impactOnRevenue ? data.impactOnRevenue.toString() : null,
      impactOnCash: data.impactOnCash ? data.impactOnCash.toString() : null,
      impactOnExpectedCash: data.impactOnExpectedCash ? data.impactOnExpectedCash.toString() : null,
      reason: data.reason || null,
      notes: data.notes || null,
      shiftDataBefore: data.shiftDataBefore || null,
      shiftDataAfter: data.shiftDataAfter || null,
    })
    .returning();
  
  return result[0];
}
