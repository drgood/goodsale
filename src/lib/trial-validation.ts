import { db, subscriptions, tenants } from '@/db';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a tenant's trial is still valid
 */
export async function isTrialValid(tenantId: string): Promise<boolean> {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.tenantId, tenantId),
          eq(subscriptions.status, 'trial')
        )
      )
      .limit(1);

    if (!subscription) {
      return false;
    }

    // Check if trial end date is in the future
    return subscription.endDate > new Date();
  } catch (error) {
    console.error('Error checking trial validity:', error);
    return false;
  }
}

/**
 * Get trial end date for a tenant
 */
export async function getTrialEndDate(tenantId: string): Promise<Date | null> {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.tenantId, tenantId),
          eq(subscriptions.status, 'trial')
        )
      )
      .limit(1);

    return subscription?.endDate || null;
  } catch (error) {
    console.error('Error getting trial end date:', error);
    return null;
  }
}

/**
 * Get days remaining in trial
 */
export async function getTrialDaysRemaining(tenantId: string): Promise<number | null> {
  try {
    const endDate = await getTrialEndDate(tenantId);
    if (!endDate) {
      return null;
    }

    const daysRemaining = Math.ceil(
      (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysRemaining);
  } catch (error) {
    console.error('Error calculating trial days remaining:', error);
    return null;
  }
}

/**
 * Get subscription status for a tenant
 */
export async function getSubscriptionStatus(
  tenantId: string
): Promise<{
  status: 'trial' | 'active' | 'expired' | 'canceled' | 'suspended' | 'not_found';
  daysRemaining: number | null;
  endDate: Date | null;
}> {
  try {
    // First, check the tenant record for a suspended status.
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return {
        status: 'not_found',
        daysRemaining: null,
        endDate: null,
      };
    }

    if (tenant.status === 'suspended') {
      // Short-circuit: a suspended tenant is treated as suspended regardless of subscription row.
      return {
        status: 'suspended',
        daysRemaining: null,
        endDate: null,
      };
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1);

    if (!subscription) {
      return {
        status: 'not_found',
        daysRemaining: null,
        endDate: null,
      };
    }

    let status = subscription.status as 'trial' | 'active' | 'expired' | 'canceled' | 'suspended';
    let daysRemaining: number | null = null;

    if (subscription.status === 'trial') {
      const daysLeft = Math.ceil(
        (subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      daysRemaining = Math.max(0, daysLeft);

      // If trial end date has passed, mark as expired
      if (daysLeft <= 0) {
        status = 'expired';
      }
    }

    return {
      status,
      daysRemaining,
      endDate: subscription.endDate,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      status: 'not_found',
      daysRemaining: null,
      endDate: null,
    };
  }
}
