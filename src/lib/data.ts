// NOTE: This file contains mock data for development and is being phased out.
// New code should use queries from '@/lib/queries' instead.

import type { Tenant, User, Product, Sale, Category, Supplier, Plan, Customer, Shift, ShiftReport, PurchaseOrder } from './types';
import { PlaceHolderImages } from './placeholder-images';

// NOTE: Database query imports removed to prevent client-side bundling
// These helper functions are deprecated - use API routes instead

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id) || { imageUrl: '', imageHint: '' };

export const tenants: Tenant[] = [
  { id: '1', name: 'GShop Electronics', subdomain: 'gshop', plan: 'Growth', status: 'active', createdAt: '2023-01-15', userCount: 5, productCount: 120, totalSales: 150320.75 },
  { id: '2', name: 'Globex Fashion', subdomain: 'globex', plan: 'Starter', status: 'active', createdAt: '2023-03-20', userCount: 2, productCount: 45, totalSales: 45010.50 },
  { id: '3', name: 'Soylent Foods', subdomain: 'soylent', plan: 'Enterprise', status: 'suspended', createdAt: '2022-11-01', userCount: 25, productCount: 500, totalSales: 876543.21 },
  { id: '4', name: 'Stark Industries', subdomain: 'stark', plan: 'Enterprise', status: 'deleted', createdAt: '2023-05-10', userCount: 10, productCount: 250, totalSales: 320100.00 },
];

export const users: User[] = [
  // GShop Users
  { id: '101', tenantId: '1', name: 'John Doe', email: 'owner@gshop.com', role: 'Owner', avatarUrl: findImage('user-avatar-1').imageUrl, lastLogin: '2024-07-29T10:00:00Z', status: 'active' },
  { id: '102', tenantId: '1', name: 'Jane Smith', email: 'manager@gshop.com', role: 'Manager', avatarUrl: findImage('user-avatar-2').imageUrl, lastLogin: '2024-07-29T09:30:00Z', status: 'active' },
  { id: '103', tenantId: '1', name: 'Mike Ross', email: 'cashier1@gshop.com', role: 'Cashier', avatarUrl: 'https://picsum.photos/seed/user3/100/100', lastLogin: '2024-07-28T18:00:00Z', status: 'active' },
  { id: '104', tenantId: '1', name: 'Rachel Zane', email: 'cashier2@gshop.com', role: 'Cashier', avatarUrl: 'https://picsum.photos/seed/user5/100/100', lastLogin: '2024-07-29T11:00:00Z', status: 'active' },
  // Globex Users
  { id: '201', tenantId: '2', name: 'Alice Wonder', email: 'alice@globex.com', role: 'Owner', avatarUrl: 'https://picsum.photos/seed/user4/100/100', lastLogin: '2024-07-27T12:00:00Z', status: 'active' },
];

// @ts-ignore - Temporary mock data with legacy structure for backward compatibility
export const products: Product[] = [
  { id: 'p1', tenantId: '1', name: 'Wireless Headphones', sku: 'WH-1000XM4', categoryId: 'c1', categoryName: 'Electronics', supplierId: 'sup1', supplierName: 'Sony', price: 349.99, costPrice: 220.50, stock: 25, stockThreshold: 10, ...findImage('product-1'), status: 'active' },
  { id: 'p2', tenantId: '1', name: 'Smartwatch Series 7', sku: 'SW-S7-BLK', categoryId: 'c2', categoryName: 'Wearables', supplierId: 'sup2', supplierName: 'Apple', price: 429.00, costPrice: 310.00, stock: 15, stockThreshold: 5, ...findImage('product-2'), status: 'active' },
  { id: 'p3', tenantId: '1', name: 'DSLR Camera EOS', sku: 'DSLR-EOS-R6', categoryId: 'c3', categoryName: 'Cameras', supplierId: 'sup3', supplierName: 'Canon', price: 2499.00, costPrice: 1850.00, stock: 5, stockThreshold: 3, ...findImage('product-3'), status: 'active' },
  { id: 'p4', tenantId: '1', name: 'Leather Backpack', sku: 'LB-BRN-01', categoryId: 'c4', categoryName: 'Accessories', supplierId: 'sup4', supplierName: 'Fossil', price: 199.50, costPrice: 95.00, stock: 40, stockThreshold: 15, ...findImage('product-4'), status: 'draft' },
  { id: 'p5', tenantId: '1', name: 'Smart Home Speaker', sku: 'SHS-ECHO-4', categoryId: 'c5', categoryName: 'Smart Home', supplierId: 'sup5', supplierName: 'Amazon', price: 99.99, costPrice: 60.00, stock: 60, stockThreshold: 20, ...findImage('product-5'), status: 'active' },
  { id: 'p6', tenantId: '2', name: 'Silk Scarf', sku: 'SS-RED-FLR', categoryId: 'c4', categoryName: 'Accessories', supplierId: 'sup6', supplierName: 'Hermes', price: 450.00, costPrice: 200.00, stock: 12, stockThreshold: 5, imageUrl: 'https://picsum.photos/seed/product11/400/300', imageHint: 'scarf fashion', status: 'active' },
  { id: 'p7', tenantId: '2', name: 'Designer Jeans', sku: 'DJ-DNM-SLM', categoryId: 'c6', categoryName: 'Apparel', supplierId: 'sup7', supplierName: 'Levi\'s', price: 128.00, costPrice: 55.00, stock: 30, stockThreshold: 10, imageUrl: 'https://picsum.photos/seed/product12/400/300', imageHint: 'jeans fashion', status: 'active' },
  { id: 'p8', tenantId: '1', name: 'Ergonomic Office Chair', sku: 'EOC-BLK-MESH', categoryId: 'c7', categoryName: 'Furniture', supplierId: 'sup1', supplierName: 'Herman Miller', price: 1200.00, costPrice: 750.00, stock: 8, stockThreshold: 5, ...findImage('product-6'), status: 'active' },
  { id: 'p9', tenantId: '1', name: 'Mechanical Keyboard', sku: 'MK-RGB-TKL', categoryId: 'c8', categoryName: 'Peripherals', supplierId: 'sup2', supplierName: 'Razer', price: 159.99, costPrice: 90.00, stock: 22, stockThreshold: 10, ...findImage('product-7'), status: 'archived' },
  { id: 'p10', tenantId: '1', name: 'Insulated Water Bottle', sku: 'IWB-STL-32', categoryId: 'c9', categoryName: 'Lifestyle', supplierId: 'sup1', supplierName: 'HydroFlask', price: 45.00, costPrice: 20.00, stock: 150, stockThreshold: 50, ...findImage('product-8'), status: 'active' },
  { id: 'p11', tenantId: '1', name: 'Yoga Mat Pro', sku: 'YMP-GRN-ECO', categoryId: 'c10', categoryName: 'Fitness', supplierId: 'sup2', supplierName: 'Lululemon', price: 89.00, costPrice: 40.00, stock: 4, stockThreshold: 10, ...findImage('product-9'), status: 'draft' },
  { id: 'p12', tenantId: '1', name: 'Gourmet Coffee Beans', sku: 'GCB-ETH-1KG', categoryId: 'c11', categoryName: 'Groceries', supplierId: 'sup1', supplierName: 'Stumptown', price: 22.50, costPrice: 10.00, stock: 3, stockThreshold: 10, ...findImage('product-10'), status: 'archived' },
];

export const sales: Sale[] = [
  { id: 's1', tenantId: '1', shiftId: 'shift1', cashierId: '103', cashierName: 'Mike Ross', totalAmount: 778.99, totalProfit: 248.49, itemCount: 2, paymentMethod: 'Card', status: 'Paid', createdAt: '2024-07-29T14:30:00Z', items: [{ productId: 'p1', productName: 'Wireless Headphones', quantity: 1, price: 349.99, costPrice: 220.50 }, { productId: 'p2', productName: 'Smartwatch Series 7', quantity: 1, price: 429.00, costPrice: 310.00 }], discountAmount: 0 },
  { id: 's2', tenantId: '1', shiftId: 'shift1', cashierId: '102', cashierName: 'Jane Smith', totalAmount: 99.99, totalProfit: 39.99, itemCount: 1, paymentMethod: 'Cash', status: 'Paid', createdAt: '2024-07-29T12:05:00Z', items: [{ productId: 'p5', productName: 'Smart Home Speaker', quantity: 1, price: 99.99, costPrice: 60.00 }], discountAmount: 0 },
  { id: 's3', tenantId: '2', shiftId: 'shift2', cashierId: '201', cashierName: 'Alice Wonder', totalAmount: 578.00, totalProfit: 323.00, itemCount: 2, paymentMethod: 'Card', status: 'Paid', createdAt: '2024-07-28T18:45:00Z', items: [{ productId: 'p6', productName: 'Silk Scarf', quantity: 1, price: 450.00, costPrice: 200.00 }, { productId: 'p7', productName: 'Designer Jeans', quantity: 1, price: 128.00, costPrice: 55.00 }], discountAmount: 0 },
  { id: 's4', tenantId: '1', shiftId: 'shift1', cashierId: '103', cashierName: 'Mike Ross', totalAmount: 45.00, totalProfit: 22.75, itemCount: 1, paymentMethod: 'Mobile', status: 'Paid', createdAt: '2024-07-27T11:00:00Z', items: [{ productId: 'p10', productName: 'Insulated Water Bottle', quantity: 1, price: 45.00, costPrice: 20.00 }], discountAmount: 2.25, discountPercentage: 5 },
];

export const categories: Category[] = [
    { id: 'c1', tenantId: '1', name: 'Electronics', productCount: 1 },
    { id: 'c2', tenantId: '1', name: 'Wearables', productCount: 1 },
    { id: 'c3', tenantId: '1', name: 'Cameras', productCount: 1 },
    { id: 'c4', tenantId: '1', name: 'Accessories', productCount: 2 },
    { id: 'c5', tenantId: '1', name: 'Smart Home', productCount: 1 },
    { id: 'c6', tenantId: '2', name: 'Apparel', productCount: 1 },
    { id: 'c7', tenantId: '1', name: 'Furniture', productCount: 1 },
    { id: 'c8', tenantId: '1', name: 'Peripherals', productCount: 1 },
    { id: 'c9', tenantId: '1', name: 'Lifestyle', productCount: 1 },
    { id: 'c10', tenantId: '1', name: 'Fitness', productCount: 1 },
    { id: 'c11', tenantId: '1', name: 'Groceries', productCount: 1 },
];

export const suppliers: Supplier[] = [
    { id: 'sup1', tenantId: '1', name: 'Sony', productCount: 1 },
    { id: 'sup2', tenantId: '1', name: 'Apple', productCount: 1 },
    { id: 'sup3', tenantId: '1', name: 'Canon', productCount: 1 },
    { id: 'sup4', tenantId: '1', name: 'Fossil', productCount: 1 },
    { id: 'sup5', tenantId: '1', name: 'Amazon', productCount: 1 },
    { id: 'sup6', tenantId: '2', name: 'Hermes', productCount: 1 },
    { id: 'sup7', tenantId: '2', name: 'Levi\'s', productCount: 1 },
];

export const plans: Plan[] = [
  {
    name: 'Starter',
    price: 'GH₵299',
    description: 'For new businesses getting off the ground.',
    features: ['Up to 100 products', 'Basic POS', '2 Staff accounts', 'Community support'],
  },
  {
    name: 'Growth',
    price: 'GH₵599',
    description: 'For growing businesses that need more power.',
    features: ['Up to 1,000 products', 'Advanced POS', '10 Staff accounts', 'Email & Chat support', 'Advanced reporting'],
    isCurrent: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large-scale operations with custom needs.',
    features: ['Unlimited products', 'Custom features', 'Unlimited staff accounts', 'Dedicated support', 'API access'],
  }
];

export const customers: Customer[] = [
  { id: 'cust1', tenantId: '1', name: 'Sarah Johnson', email: 'sarah.j@example.com', phone: '123-456-7890', totalSpent: 1250.50, avatarUrl: 'https://picsum.photos/seed/cust1/100/100', joinedAt: '2023-05-10', balance: 0 },
  { id: 'cust2', tenantId: '1', name: 'Michael Brown', email: 'michael.b@example.com', phone: '123-456-7890', totalSpent: 780.20, avatarUrl: 'https://picsum.photos/seed/cust2/100/100', joinedAt: '2023-06-15', balance: 0 },
  { id: 'cust3', tenantId: '1', name: 'Jessica Davis', email: 'jessica.d@example.com', phone: '123-456-7890', totalSpent: 2400.00, avatarUrl: 'https://picsum.photos/seed/cust3/100/100', joinedAt: '2023-07-20', balance: 150.75 },
  { id: 'cust4', tenantId: '2', name: 'David Wilson', email: 'david.w@example.com', phone: '123-456-7890', totalSpent: 550.00, avatarUrl: 'https://picsum.photos/seed/cust4/100/100', joinedAt: '2023-08-01', balance: 0 },
];

export const shiftReports: ShiftReport[] = [
  {
    id: 'sr1',
    shiftId: 'shift-1627886400000',
    tenantId: '1',
    generatedAt: '2024-07-30T17:00:00Z',
    cashierName: 'Mike Ross',
    details: {
      id: 'shift-1627886400000',
      tenantId: '1',
      cashierId: '103',
      cashierName: 'Mike Ross',
      startTime: '2024-07-30T09:00:00Z',
      endTime: '2024-07-30T17:00:00Z',
      status: 'closed',
      startingCash: 200.00,
      cashSales: 1540.50,
      cardSales: 2300.00,
      mobileSales: 850.25,
      creditSales: 150.75,
      totalSales: 4841.50,
      expectedCash: 1740.50,
      actualCash: 1740.00,
      cashDifference: -0.50,
    }
  },
  {
    id: 'sr2',
    shiftId: 'shift-1627800000000',
    tenantId: '1',
    generatedAt: '2024-07-29T17:05:00Z',
    cashierName: 'Rachel Zane',
    details: {
      id: 'shift-1627800000000',
      tenantId: '1',
      cashierId: '104',
      cashierName: 'Rachel Zane',
      startTime: '2024-07-29T09:02:00Z',
      endTime: '2024-07-29T17:05:00Z',
      status: 'closed',
      startingCash: 200.00,
      cashSales: 1210.75,
      cardSales: 1980.50,
      mobileSales: 620.00,
      creditSales: 0,
      totalSales: 3811.25,
      expectedCash: 1410.75,
      actualCash: 1415.00,
      cashDifference: 4.25,
    }
  },
    {
    id: 'sr3',
    shiftId: 'shift-1627713600000',
    tenantId: '1',
    generatedAt: '2024-07-28T17:01:00Z',
    cashierName: 'Mike Ross',
    details: {
      id: 'shift-1627713600000',
      tenantId: '1',
      cashierId: '103',
      cashierName: 'Mike Ross',
      startTime: '2024-07-28T08:58:00Z',
      endTime: '2024-07-28T17:01:00Z',
      status: 'closed',
      startingCash: 150.00,
      cashSales: 980.00,
      cardSales: 1500.00,
      mobileSales: 450.50,
      creditSales: 300.00,
      totalSales: 3230.50,
      expectedCash: 1130.00,
      actualCash: 1130.00,
      cashDifference: 0.00,
    }
  }
];

export const purchaseOrders: PurchaseOrder[] = [
    {
        id: 'po1',
        tenantId: '1',
        poNumber: 'PO-2024-001',
        supplierId: 'sup1',
        supplierName: 'Sony',
        status: 'Received',
        items: [
            { productId: 'p1', productName: 'Wireless Headphones', quantity: 50, costPrice: 210.00 },
        ],
        createdAt: '2024-07-15T10:00:00Z',
        totalCost: 10500.00
    },
    {
        id: 'po2',
        tenantId: '1',
        poNumber: 'PO-2024-002',
        supplierId: 'sup2',
        supplierName: 'Apple',
        status: 'Ordered',
        items: [
            { productId: 'p2', productName: 'Smartwatch Series 7', quantity: 30, costPrice: 300.00 },
        ],
        createdAt: '2024-07-25T11:30:00Z',
        totalCost: 9000.00
    },
    {
        id: 'po3',
        tenantId: '1',
        poNumber: 'PO-2024-003',
        supplierId: 'sup5',
        supplierName: 'Amazon',
        status: 'Draft',
        items: [
            { productId: 'p5', productName: 'Smart Home Speaker', quantity: 100, costPrice: 58.00 },
        ],
        createdAt: '2024-07-28T16:00:00Z',
        totalCost: 5800.00
    }
];
