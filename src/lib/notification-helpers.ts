import { db, notifications } from '@/db';
import { eq } from 'drizzle-orm';
import type { Sale, Product, User } from './types';

/**
 * Create a notification for a new sale
 */
export async function notifyNewSale(
  tenantId: string,
  userId: string,
  sale: Sale
) {
  try {
    await db.insert(notifications).values({
      tenantId,
      userId,
      type: 'sale',
      title: 'New Sale!',
      description: `Sale of GH₵${sale.totalAmount.toFixed(2)} completed by ${sale.cashierName}`,
      data: {
        saleId: sale.id,
        amount: sale.totalAmount,
        cashierName: sale.cashierName,
      } as Record<string, unknown>,
    });
  } catch (error) {
    console.error('Error creating sale notification:', error);
  }
}

/**
 * Create a notification for low stock
 */
export async function notifyLowStock(
  tenantId: string,
  userId: string,
  product: Product
) {
  try {
    await db.insert(notifications).values({
      tenantId,
      userId,
      type: 'stock',
      title: 'Low Stock Warning',
      description: `${product.name} stock is critically low at ${product.stock} units`,
      data: {
        productId: product.id,
        productName: product.name,
        stock: product.stock,
        threshold: product.stockThreshold,
      } as Record<string, unknown>,
    });
  } catch (error) {
    console.error('Error creating stock notification:', error);
  }
}

/**
 * Create a notification for a new team member
 */
export async function notifyNewTeamMember(
  tenantId: string,
  userId: string,
  newUser: User
) {
  try {
    await db.insert(notifications).values({
      tenantId,
      userId,
      type: 'user',
      title: 'New Team Member',
      description: `${newUser.name} has joined your team as ${newUser.role}`,
      data: {
        newUserId: newUser.id,
        newUserName: newUser.name,
        role: newUser.role,
      } as Record<string, unknown>,
    });
  } catch (error) {
    console.error('Error creating team member notification:', error);
  }
}

/**
 * Create a system notification
 */
export async function notifySystem(
  tenantId: string,
  userId: string,
  title: string,
  description: string,
  data?: Record<string, unknown>
) {
  try {
    await db.insert(notifications).values({
      tenantId,
      userId,
      type: 'system',
      title,
      description,
      data: data as Record<string, unknown> | undefined,
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
}

/**
 * Notify all managers/owners in a tenant about an event
 */
export async function notifyTeamManagers(
  tenantId: string,
  type: string,
  title: string,
  description: string,
  data?: Record<string, unknown>
) {
  try {
    // Get all managers and owners for the tenant
    const managers = await db.query.users.findMany({
      where: (users, { eq, and }) =>
        and(
          eq(users.tenantId, tenantId),
          // Filter for Manager or Owner roles
        ),
    });

    // Create notifications for each manager/owner
    for (const manager of managers) {
      if (manager.role === 'Manager' || manager.role === 'Owner') {
        await db.insert(notifications).values({
          tenantId,
          userId: manager.id,
          type: type as 'sale' | 'stock' | 'user' | 'system',
          title,
          description,
          data: data as Record<string, unknown> | undefined,
        });
      }
    }
  } catch (error) {
    console.error('Error notifying team managers:', error);
  }
}
