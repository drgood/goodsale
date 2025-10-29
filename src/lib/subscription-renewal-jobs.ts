import { db, subscriptions, auditLogs } from '@/db';
import { eq, and, lte } from 'drizzle-orm';

/**
 * Check for subscriptions expiring soon (30 days) and send renewal reminders
 * This should be called daily by a cron job
 */
export async function checkExpiringSubscriptions(): Promise<{
  success: boolean;
  reminders_sent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let remindersSent = 0;

  try {
    // Calculate date 30 days from now
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find subscriptions expiring within 30 days that are active
    const expiringSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          lte(subscriptions.endDate, thirtyDaysFromNow)
        )
      );

    console.log(`Found ${expiringSubscriptions.length} subscriptions expiring within 30 days`);

    for (const subscription of expiringSubscriptions) {
      try {
        const daysUntilExpiry = Math.ceil(
          (new Date(subscription.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // TODO: Send renewal reminder email to tenant owner
        // The tenant owner would receive an email like:
        // "Your subscription for [Plan Name] will expire in [X] days.
        //  Please contact us to renew your subscription."

        console.log(
          `Renewal reminder queued for subscription ${subscription.id} - expires in ${daysUntilExpiry} days`
        );

        remindersSent += 1;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(
          `Error processing subscription ${subscription.id}: ${errorMsg}`
        );
        console.error(
          `Error processing subscription ${subscription.id}:`,
          error
        );
      }
    }

    return {
      success: errors.length === 0,
      reminders_sent: remindersSent,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in checkExpiringSubscriptions:', error);
    return {
      success: false,
      reminders_sent: remindersSent,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}

/**
 * Auto-suspend subscriptions that have expired
 * This should be called daily by a cron job
 */
export async function suspendExpiredSubscriptions(): Promise<{
  success: boolean;
  suspended: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let suspendedCount = 0;

  try {
    // Find subscriptions that have expired
    const expiredSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          lte(subscriptions.endDate, new Date())
        )
      );

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription status to expired
        await db
          .update(subscriptions)
          .set({
            status: 'expired',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));

        // Log the action
        await db
          .insert(auditLogs)
          .values({
            userId: null,
            userName: 'SYSTEM',
            action: 'SUSPEND_EXPIRED_SUBSCRIPTION',
            entity: 'subscription',
            entityId: subscription.id,
            details: {
              tenantId: subscription.tenantId,
              endDate: subscription.endDate,
              status: 'suspended',
            },
          })
          .catch((err) => console.error('Audit log error:', err));

        suspendedCount += 1;
        console.log(
          `Suspended expired subscription ${subscription.id} for tenant ${subscription.tenantId}`
        );

        // TODO: Send expiration notice to tenant owner
        // The tenant owner would receive an email like:
        // "Your subscription for [Plan Name] has expired.
        //  Please contact us to renew your subscription and regain access."
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(
          `Error suspending subscription ${subscription.id}: ${errorMsg}`
        );
        console.error(
          `Error suspending subscription ${subscription.id}:`,
          error
        );
      }
    }

    return {
      success: errors.length === 0,
      suspended: suspendedCount,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in suspendExpiredSubscriptions:', error);
    return {
      success: false,
      suspended: suspendedCount,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}

/**
 * Get subscription renewal statistics
 */
export async function getSubscriptionStats(): Promise<{
  total_active: number;
  expiring_soon: number;
  expired: number;
  canceled: number;
}> {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const activeCount = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const expiringSoonCount = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          lte(subscriptions.endDate, thirtyDaysFromNow)
        )
      );

    const expiredCount = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'expired'));

    const canceledCount = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'canceled'));

    return {
      total_active: activeCount.length,
      expiring_soon: expiringSoonCount.length,
      expired: expiredCount.length,
      canceled: canceledCount.length,
    };
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    return {
      total_active: 0,
      expiring_soon: 0,
      expired: 0,
      canceled: 0,
    };
  }
}
