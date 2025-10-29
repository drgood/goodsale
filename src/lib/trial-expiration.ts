import { db, subscriptions, auditLogs } from '@/db';
import { eq, and, lte } from 'drizzle-orm';

interface ExpirationResult {
  success: boolean;
  suspended: number;
  archived: number;
  errors: string[];
}

/**
 * Suspend subscriptions that have expired (trial end date passed)
 */
async function suspendExpiredTrials(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    // Find all trial subscriptions where end date is in the past
    const expiredTrials = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'trial'),
          lte(subscriptions.endDate, new Date())
        )
      );

    console.log(`Found ${expiredTrials.length} expired trials to suspend`);

    for (const subscription of expiredTrials) {
      try {
        // Update subscription status to expired
        await db
          .update(subscriptions)
          .set({
            status: 'expired',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));

        // Log the suspension
        await db
          .insert(auditLogs)
          .values({
            userId: null,
            userName: 'SYSTEM',
            action: 'TRIAL_SUSPENDED',
            entity: 'subscription',
            entityId: subscription.id,
            details: {
              tenantId: subscription.tenantId,
              endDate: subscription.endDate,
              status: 'expired',
            },
          })
          .catch((err) => console.error('Audit log error:', err));

        count++;
        console.log(`Suspended expired trial subscription ${subscription.id}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error suspending subscription ${subscription.id}: ${errorMsg}`);
        console.error(`Error suspending subscription ${subscription.id}:`, error);
      }
    }

    return { count, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in suspendExpiredTrials:', error);
    return {
      count,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}

/**
 * Archive old expired subscriptions (14+ days old)
 * This prepares data for potential deletion
 */
async function archiveOldExpiredTrials(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    // Calculate date 14 days ago
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Find all expired subscriptions older than 14 days
    const oldExpiredTrials = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'expired'),
          lte(subscriptions.updatedAt, fourteenDaysAgo)
        )
      );

    console.log(
      `Found ${oldExpiredTrials.length} expired trials older than 14 days to archive`
    );

    for (const subscription of oldExpiredTrials) {
      try {
        // Update subscription status to archived
        // In the future, this could trigger data deletion or backup
        await db
          .update(subscriptions)
          .set({
            status: 'archived',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));

        // Log the archival
        await db
          .insert(auditLogs)
          .values({
            userId: null,
            userName: 'SYSTEM',
            action: 'TRIAL_ARCHIVED',
            entity: 'subscription',
            entityId: subscription.id,
            details: {
              tenantId: subscription.tenantId,
              endDate: subscription.endDate,
              archivedAt: new Date(),
            },
          })
          .catch((err) => console.error('Audit log error:', err));

        count++;
        console.log(`Archived old expired trial subscription ${subscription.id}`);

        // TODO: Implement data deletion
        // After archival, you could:
        // 1. Delete all tenant data (products, sales, customers, etc.)
        // 2. Keep only the subscription record
        // 3. Or backup to cold storage then delete
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error archiving subscription ${subscription.id}: ${errorMsg}`);
        console.error(`Error archiving subscription ${subscription.id}:`, error);
      }
    }

    return { count, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in archiveOldExpiredTrials:', error);
    return {
      count,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}

/**
 * Run complete trial expiration workflow
 * Should be called daily at 3 AM UTC
 */
export async function handleTrialExpirations(): Promise<ExpirationResult> {
  const allErrors: string[] = [];
  let totalSuspended = 0;
  let totalArchived = 0;

  try {
    console.log('Starting trial expiration handler...');

    // Step 1: Suspend expired trials
    const suspendResult = await suspendExpiredTrials();
    totalSuspended = suspendResult.count;
    allErrors.push(...suspendResult.errors);

    // Step 2: Archive old expired trials
    const archiveResult = await archiveOldExpiredTrials();
    totalArchived = archiveResult.count;
    allErrors.push(...archiveResult.errors);

    return {
      success: allErrors.length === 0,
      suspended: totalSuspended,
      archived: totalArchived,
      errors: allErrors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in handleTrialExpirations:', error);
    return {
      success: false,
      suspended: totalSuspended,
      archived: totalArchived,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}
