import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, tenantNameChangeRequests, users, tenants, auditLogs } from '@/db';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // Filter by status
    const offset = (page - 1) * limit;

    // Build query
    let query = db
      .select({
        id: tenantNameChangeRequests.id,
        tenantId: tenantNameChangeRequests.tenantId,
        oldName: tenantNameChangeRequests.oldName,
        newName: tenantNameChangeRequests.newName,
        reason: tenantNameChangeRequests.reason,
        status: tenantNameChangeRequests.status,
        requestedBy: tenantNameChangeRequests.requestedBy,
        requestedAt: tenantNameChangeRequests.requestedAt,
        reviewedBy: tenantNameChangeRequests.reviewedBy,
        reviewedAt: tenantNameChangeRequests.reviewedAt,
        rejectionReason: tenantNameChangeRequests.rejectionReason,
        scheduledApprovalDate: tenantNameChangeRequests.scheduledApprovalDate,
        appliedAt: tenantNameChangeRequests.appliedAt,
      })
      .from(tenantNameChangeRequests);

    if (status) {
      query = query.where(eq(tenantNameChangeRequests.status, status));
    }

    // Get count
    const countResult = await query;
    const total = countResult.length;

    // Get paginated results
    const requests = await db
      .select({
        id: tenantNameChangeRequests.id,
        tenantId: tenantNameChangeRequests.tenantId,
        oldName: tenantNameChangeRequests.oldName,
        newName: tenantNameChangeRequests.newName,
        reason: tenantNameChangeRequests.reason,
        status: tenantNameChangeRequests.status,
        requestedBy: tenantNameChangeRequests.requestedBy,
        requestedAt: tenantNameChangeRequests.requestedAt,
        reviewedBy: tenantNameChangeRequests.reviewedBy,
        reviewedAt: tenantNameChangeRequests.reviewedAt,
        rejectionReason: tenantNameChangeRequests.rejectionReason,
        scheduledApprovalDate: tenantNameChangeRequests.scheduledApprovalDate,
        appliedAt: tenantNameChangeRequests.appliedAt,
      })
      .from(tenantNameChangeRequests)
      .orderBy(desc(tenantNameChangeRequests.requestedAt))
      .limit(limit)
      .offset(offset);

    // Enrich with user and tenant details
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        const requesterData = await db
          .select()
          .from(users)
          .where(eq(users.id, req.requestedBy!))
          .limit(1);

        const tenantData = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, req.tenantId))
          .limit(1);

        return {
          ...req,
          requesterName: requesterData[0]?.name || 'Unknown',
          requesterEmail: requesterData[0]?.email || '',
          tenantName: tenantData[0]?.name || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      data: enrichedRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching name change requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch name change requests' },
      { status: 500 }
    );
  }
}
