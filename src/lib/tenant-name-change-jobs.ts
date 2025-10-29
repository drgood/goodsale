import { db, tenantNameChangeRequests, tenants, auditLogs } from '@/db';
import { eq, lte, and } from 'drizzle-orm';

/**
 * Apply all scheduled tenant name changes that are due (scheduled for <= now)
 * This should be called by a cron job or background worker
 */
export async function applyScheduledNameChanges(): Promise<{
  success: boolean;
  applied: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let appliedCount = 0;

  try {
    // Get all scheduled requests that are due
    const dueDates = await db
      .select()
      .from(tenantNameChangeRequests)
      .where(
        and(
          eq(tenantNameChangeRequests.status, 'scheduled'),
          lte(tenantNameChangeRequests.scheduledApprovalDate, new Date())
        )
      );

    console.log(`Found ${dueDates.length} scheduled name changes to apply`);

    for (const request of dueDates) {
      try {
        // Get tenant to verify it exists
        const tenantData = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, request.tenantId))
          .limit(1);

        if (tenantData.length === 0) {
          errors.push(`Tenant ${request.tenantId} not found for request ${request.id}`);
          continue;
        }

        const tenant = tenantData[0];

        // Check if new name is still available (hasn't been taken)
        const existingTenant = await db
          .select()
          .from(tenants)
          .where(eq(tenants.name, request.newName))
          .limit(1);

        if (existingTenant.length > 0 && existingTenant[0].id !== request.tenantId) {
          // Name was taken by someone else, mark as failed
          errors.push(`Name "${request.newName}" is no longer available for request ${request.id}`);

          // Update request to rejected
          await db
            .update(tenantNameChangeRequests)
            .set({
              status: 'rejected',
              rejectionReason: 'Name was taken by another tenant before application',
            })
            .where(eq(tenantNameChangeRequests.id, request.id))
            .catch((err) => console.error('Error updating rejected request:', err));

          continue;
        }

        // Apply the name change
        await db
          .update(tenants)
          .set({
            name: request.newName,
            pendingNameChangeId: null,
          })
          .where(eq(tenants.id, request.tenantId));

        // Mark the request as applied
        await db
          .update(tenantNameChangeRequests)
          .set({
            status: 'applied',
            appliedAt: new Date(),
          })
          .where(eq(tenantNameChangeRequests.id, request.id));

        // Log the action
        await db
          .insert(auditLogs)
          .values({
            userId: null,
            userName: 'SYSTEM',
            action: 'APPLY_TENANT_NAME_CHANGE',
            entity: 'tenantNameChangeRequest',
            entityId: request.id,
            details: {
              tenantId: request.tenantId,
              oldName: request.oldName,
              newName: request.newName,
              appliedAt: new Date(),
            },
          })
          .catch((err) => console.error('Audit log error:', err));

        appliedCount += 1;
        console.log(
          `Applied name change for tenant ${tenant.name}: ${request.oldName} -> ${request.newName}`
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error occurred';
        errors.push(`Error applying name change ${request.id}: ${errorMsg}`);
        console.error(`Error applying name change ${request.id}:`, error);
      }
    }

    return {
      success: errors.length === 0,
      applied: appliedCount,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in applyScheduledNameChanges:', error);
    return {
      success: false,
      applied: appliedCount,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}

/**
 * Auto-approve pending requests that have been pending for >= 30 days
 * This should be called by a cron job or background worker
 */
export async function autoApprovePendingRequests(): Promise<{
  success: boolean;
  autoApproved: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let autoApprovedCount = 0;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all pending requests older than 30 days
    const pendingRequests = await db
      .select()
      .from(tenantNameChangeRequests)
      .where(
        and(
          eq(tenantNameChangeRequests.status, 'pending'),
          lte(tenantNameChangeRequests.requestedAt, thirtyDaysAgo)
        )
      );

    console.log(`Found ${pendingRequests.length} requests pending for 30+ days to auto-approve`);

    for (const request of pendingRequests) {
      try {
        // Schedule for next day 2 AM
        const nextExecution = new Date();
        nextExecution.setDate(nextExecution.getDate() + 1);
        nextExecution.setHours(2, 0, 0, 0);

        // Update to scheduled with auto_approved status
        await db
          .update(tenantNameChangeRequests)
          .set({
            status: 'auto_approved',
            scheduledApprovalDate: nextExecution,
          })
          .where(eq(tenantNameChangeRequests.id, request.id));

        // Log the action
        await db
          .insert(auditLogs)
          .values({
            userId: null,
            userName: 'SYSTEM',
            action: 'AUTO_APPROVE_TENANT_NAME_CHANGE',
            entity: 'tenantNameChangeRequest',
            entityId: request.id,
            details: {
              tenantId: request.tenantId,
              oldName: request.oldName,
              newName: request.newName,
              autoApprovedAt: new Date(),
              scheduledFor: nextExecution,
            },
          })
          .catch((err) => console.error('Audit log error:', err));

        autoApprovedCount += 1;
        console.log(
          `Auto-approved name change request ${request.id} for tenant ${request.tenantId}`
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error occurred';
        errors.push(`Error auto-approving request ${request.id}: ${errorMsg}`);
        console.error(`Error auto-approving request ${request.id}:`, error);
      }
    }

    return {
      success: errors.length === 0,
      autoApproved: autoApprovedCount,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in autoApprovePendingRequests:', error);
    return {
      success: false,
      autoApproved: autoApprovedCount,
      errors: [`Fatal error: ${errorMsg}`],
    };
  }
}
