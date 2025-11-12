import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, tenants, plans, auditLogs } from '@/db';
import { desc, eq, sql } from 'drizzle-orm';
import { hash } from 'bcryptjs';

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
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db
      .select({ count: tenants.id })
      .from(tenants);
    const total = countResult.length;

    // Get tenants with pagination
    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
        plan: tenants.plan,
        planName: plans.name,
        status: tenants.status,
        userCount: tenants.userCount,
        productCount: tenants.productCount,
        totalSales: tenants.totalSales,
        createdAt: tenants.createdAt,
        pendingNameChangeId: tenants.pendingNameChangeId,
      })
      .from(tenants)
      .leftJoin(
        plans, 
        sql`${plans.id}::text = ${tenants.plan} OR ${plans.name} = ${tenants.plan}`
      )
      .orderBy(desc(tenants.createdAt))
      .limit(limit)
      .offset(offset);

    // Map to include plan name
    const tenantsWithPlanName = allTenants.map(t => ({
      ...t,
      plan: t.planName || t.plan || '',
    }));

    return NextResponse.json({
      data: tenantsWithPlanName,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, subdomain, plan } = body;

    // Validate input
    if (!name || !subdomain || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const existing = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 400 }
      );
    }

    // Create tenant
    const newTenant = await db
      .insert(tenants)
      .values({
        name,
        subdomain,
        plan: plan.toLowerCase(),
        status: 'active',
      })
      .returning();

    // Log the action
    await db.insert(auditLogs).values({
      userId: token.id as string,
      userName: token.name as string,
      action: 'CREATE_TENANT',
      entity: 'tenant',
      entityId: newTenant[0].id,
      details: {
        name,
        subdomain,
        plan,
      },
    });

    return NextResponse.json(newTenant[0], { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
