import { db, subscriptions, tenants, users, auditLogs } from '@/db';
import { eq, and, lte, gte } from 'drizzle-orm';

interface NotificationResult {
  success: boolean;
  notificationsSent: number;
  errors: string[];
}

/**
 * Get all subscriptions expiring in N days (approximately)
 */
async function getSubscriptionsExpiringIn(daysAway: number) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAway);

  // Get subscriptions where end date is within 24 hours of target date
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'trial'),
        gte(subscriptions.endDate, startOfDay),
        lte(subscriptions.endDate, endOfDay)
      )
    );
}

/**
 * Send trial expiration notifications
 * Should be called daily at 2 AM UTC
 */
export async function sendTrialNotifications(): Promise<NotificationResult> {
  const errors: string[] = [];
  let notificationsSent = 0;

  try {
    // Check for trials expiring at different intervals
    const expirationDays = [7, 3, 1];

    for (const daysAway of expirationDays) {
      try {
        const expiringSubscriptions = await getSubscriptionsExpiringIn(daysAway);

        console.log(
          `Found ${expiringSubscriptions.length} subscriptions expiring in ${daysAway} days`
        );

        for (const subscription of expiringSubscriptions) {
          try {
            // Get tenant and user info
            const [tenant] = await db
              .select()
              .from(tenants)
              .where(eq(tenants.id, subscription.tenantId))
              .limit(1);

            if (!tenant) {
              console.warn(`Tenant not found for subscription ${subscription.id}`);
              continue;
            }

            const [owner] = await db
              .select()
              .from(users)
              .where(
                and(
                  eq(users.tenantId, subscription.tenantId),
                  eq(users.role, 'owner')
                )
              )
              .limit(1);

            if (!owner) {
              console.warn(
                `Owner not found for tenant ${subscription.tenantId}`
              );
              continue;
            }

            // TODO: Send email notification
            // Email service integration would go here
            // For now, just log and track
            const emailSubject = `Your GoodSale trial expires in ${daysAway} day${
              daysAway > 1 ? 's' : ''
            }`;

            const emailBody = `
Hi ${owner.name},

Your 14-day free trial of GoodSale is expiring in ${daysAway} day${
              daysAway > 1 ? 's' : ''
            }.

Trial End Date: ${subscription.endDate.toLocaleDateString()}

After your trial expires, you won't be able to access:
- Point of Sale (POS)
- Inventory Management
- Customer Data
- Reports & Analytics

To keep using GoodSale, please upgrade your subscription now.

Visit: https://goodsale.app/${tenant.subdomain}/billing
Or contact: sales@goodsale.com

Best regards,
The GoodSale Team
            `;

            console.log(`[NOTIFICATION] ${emailSubject}`);
            console.log(`[TO] ${owner.email}`);

            // Log in audit logs
            await db
              .insert(auditLogs)
              .values({
                userId: owner.id,
                userName: owner.name,
                action: 'TRIAL_NOTIFICATION_SENT',
                entity: 'subscription',
                entityId: subscription.id,
                details: {
                  tenantId: subscription.tenantId,
                  daysUntilExpiry: daysAway,
                  emailSubject,
                  recipient: owner.email,
                },
              })
              .catch((err) => console.error('Audit log error:', err));

            notificationsSent++;
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : 'Unknown error';
            errors.push(
              `Error sending notification for subscription ${subscription.id}: ${errorMsg}`
            );
            console.error(
              `Error sending notification for subscription ${subscription.id}:`,
              error
            );
          }
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error fetching subscriptions expiring in ${daysAway} days: ${errorMsg}`);
        console.error(
          `Error fetching subscriptions expiring in ${daysAway} days:`,
          error
        );
      }
    }

    return {
      success: errors.length === 0,
      notificationsSent,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in sendTrialNotifications:', error);
    return {
      success: false,
      notificationsSent,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}
