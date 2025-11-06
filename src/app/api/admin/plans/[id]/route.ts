export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, plans, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, price, description, features, isCurrent } = body;

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed to a name that already exists
    if (name && name !== plan.name) {
      const existingPlan = await db
        .select()
        .from(plans)
        .where(eq(plans.name, name))
        .limit(1);

      if (existingPlan.length > 0) {
        return NextResponse.json(
          { error: 'Plan name already exists' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (description) updateData.description = description;
    if (features) updateData.features = features;
    if (isCurrent !== undefined) updateData.isCurrent = isCurrent;

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      const normalized = {
        ...plan,
        features: Array.isArray((plan as any)?.features)
          ? (plan as any).features
          : (typeof (plan as any)?.features === 'string'
              ? (() => { try { const parsed = JSON.parse((plan as any).features); return Array.isArray(parsed) ? parsed : String((plan as any).features).split('\n').filter((x: string) => x.trim()); } catch { return String((plan as any).features).split('\n').filter((x: string) => x.trim()); } })()
              : []),
      };
      return NextResponse.json(normalized);
    }

    const [updated] = await db
      .update(plans)
      .set(updateData)
      .where(eq(plans.id, id))
      .returning();

    // Log audit without userId since super admins aren't in users table
    await db.insert(auditLogs).values({
      userId: null,
      userName: token.name as string,
      action: 'UPDATE_PLAN',
      entity: 'plan',
      entityId: id,
      details: {
        changes: { name, price, description },
      },
    }).catch(err => console.error('Audit log error:', err));

    const normalized = {
      ...updated,
      features: Array.isArray((updated as any)?.features)
        ? (updated as any).features
        : (typeof (updated as any)?.features === 'string'
            ? (() => { try { const parsed = JSON.parse((updated as any).features); return Array.isArray(parsed) ? parsed : String((updated as any).features).split('\n').filter((x: string) => x.trim()); } catch { return String((updated as any).features).split('\n').filter((x: string) => x.trim()); } })()
            : []),
    } as any;
    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error updating plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update plan';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const plan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);

    if (plan.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planName = plan[0].name;

    await db.delete(plans).where(eq(plans.id, id));

    // Log audit without userId since super admins aren't in users table
    await db.insert(auditLogs).values({
      userId: null,
      userName: token.name as string,
      action: 'DELETE_PLAN',
      entity: 'plan',
      entityId: id,
      details: {
        planName,
      },
    }).catch(err => console.error('Audit log error:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
