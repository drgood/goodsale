

export type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  userCount: number;
  productCount: number;
  totalSales: number;
};

export type User = {
  id: string;
  tenantId: string;
  name:string;
  email: string;
  role: 'Owner' | 'Manager' | 'Cashier';
  avatarUrl: string | null;
  lastLogin?: string;
  status: 'active' | 'invited' | 'disabled';
};

export type Product = {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  categoryId: string | null;
  categoryName?: string; // For JOIN queries
  supplierId: string | null;
  supplierName?: string; // For JOIN queries
  price: number;
  costPrice: number;
  stock: number;
  stockThreshold: number;
  imageUrl: string | null;
  imageHint: string | null;
  status: 'active' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
};

export type Sale = {
  id: string;
  tenantId: string;
  shiftId: string; // Link to the shift session
  cashierName: string;
  cashierId: string;
  totalAmount: number;
  totalProfit: number;
  itemCount: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile' | 'On Credit';
  status: 'Paid' | 'Pending';
  customerId?: string;
  customerName?: string;
  createdAt: string;
  items: SaleItem[];
  discountPercentage?: number;
  discountAmount?: number;
  amountSettled?: number;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
};

export type Category = {
  id: string;
  tenantId: string;
  name: string;
  productCount?: number; // Computed field
};

export type Supplier = {
  id: string;
  tenantId: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  productCount?: number; // Computed field
};

export type Plan = {
  name: 'Starter' | 'Growth' | 'Enterprise';
  price: string;
  description: string;
  features: string[];
  isCurrent?: boolean;
};

export type Customer = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone?: string | null;
  totalSpent: number;
  avatarUrl: string | null;
  joinedAt: string;
  balance: number;
};

export type Shift = {
    id: string;
    tenantId: string;
    cashierId: string;
    cashierName: string;
    startTime: string;
    endTime?: string;
    status: 'open' | 'closed';
    startingCash: number;
    cashSales: number;
    cardSales: number;
    mobileSales: number;
    creditSales: number;
    totalSales: number;
    expectedCash: number;
    actualCash?: number;
    cashDifference?: number;
};

export type ShiftReport = {
    id: string;
    shiftId: string;
    tenantId: string;
    generatedAt: string;
    cashierName: string;
    details: Shift;
};

export type PurchaseOrder = {
  id: string;
  tenantId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'Draft' | 'Ordered' | 'Received';
  items: PurchaseOrderItem[];
  createdAt: string;
  totalCost: number;
};

export type PurchaseOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
};

export type DebtorHistory = {
    id: string;
    customerId: string;
    saleId: string;
    amount: number;
    type: 'credit' | 'payment';
    date: string;
};

export type AuditLog = {
    id: string;
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    details: Record<string, unknown>;
};
