import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, tenantNameChangeRequests, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    // Verify super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get the request
    const requestData = await db
      .select()
      .from(tenantNameChangeRequests)
      .where(eq(tenantNameChangeRequests.id, id))
      .limit(1);

    if (requestData.length === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const nameChangeRequest = requestData[0];

    // Verify request is still pending
    if (nameChangeRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request is already ${nameChangeRequest.status}` },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: token.id as string,
      reviewedAt: new Date(),
    };

    if (action === 'reject') {
      updateData.rejectionReason = rejectionReason;
    } else if (action === 'approve') {
      // Schedule for next day 2 AM
      const nextExecution = new Date();
      nextExecution.setDate(nextExecution.getDate() + 1);
      nextExecution.setHours(2, 0, 0, 0);
      updateData.scheduledApprovalDate = nextExecution;
      updateData.status = 'scheduled';
    }

    const updated = await db
      .update(tenantNameChangeRequests)
      .set(updateData)
      .where(eq(tenantNameChangeRequests.id, id))
      .returning();

    // Log the action
    const actionLog = action === 'approve' ? 'APPROVE_TENANT_NAME_CHANGE' : 'REJECT_TENANT_NAME_CHANGE';
    await db
      .insert(auditLogs)
      .values({
        userId: null,
        userName: token.name as string,
        action: actionLog,
        entity: 'tenantNameChangeRequest',
        entityId: id,
        details: {
          nameChangeRequestId: id,
          action,
          ...(action === 'reject' && { rejectionReason }),
          tenantId: nameChangeRequest.tenantId,
          oldName: nameChangeRequest.oldName,
          newName: nameChangeRequest.newName,
        },
      })
      .catch((err) => console.error('Audit log error:', err));

    // TODO: Send email notification to tenant owner

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating name change request:', error);
    return NextResponse.json(
      { error: 'Failed to update name change request' },
      { status: 500 }
    );
  }
}
