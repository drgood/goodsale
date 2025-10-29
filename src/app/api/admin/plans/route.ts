import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, plans, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allPlans = await db.select().from(plans);
    return NextResponse.json(allPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, price, description, features } = body;

    if (!name || !price || !description || !features) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newPlan = await db
      .insert(plans)
      .values({
        name,
        price,
        description,
        features: Array.isArray(features) ? features : [],
      })
      .returning();

    try {
      await db.insert(auditLogs).values({
        userId: null,
        userName: token.name as string,
        action: 'CREATE_PLAN',
        entity: 'plan',
        entityId: newPlan[0].id,
        details: { name, price, description },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json(newPlan[0], { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
