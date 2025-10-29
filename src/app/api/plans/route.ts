import { NextRequest, NextResponse } from 'next/server';
import { db, plans } from '@/db';

/**
 * GET /api/plans
 * Public endpoint to fetch all plans (no auth required)
 * Used by signup form and pricing pages
 */
export async function GET(request: NextRequest) {
  try {
    const allPlans = await db
      .select()
      .from(plans)
      .orderBy(plans.createdAt);

    return NextResponse.json(allPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
