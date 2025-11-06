export const runtime = 'nodejs';

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

    const normalized = allPlans.map((p: any) => ({
      ...p,
      features: Array.isArray(p?.features)
        ? p.features
        : (typeof p?.features === 'string'
            ? (() => { try { const parsed = JSON.parse(p.features); return Array.isArray(parsed) ? parsed : String(p.features).split('\n').filter((x: string) => x.trim()); } catch { return String(p.features).split('\n').filter((x: string) => x.trim()); } })()
            : []),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
