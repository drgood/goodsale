import { NextRequest, NextResponse } from 'next/server';
import {
  applyScheduledNameChanges,
  autoApprovePendingRequests,
} from '@/lib/tenant-name-change-jobs';

/**
 * Cron endpoint for processing tenant name changes
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron, EasyCron, etc.)
 * 
 * To set up:
 * 1. Add cron configuration to vercel.json (for Vercel deployment)
 * 2. Or use an external cron service to call this endpoint
 * 
 * Recommended schedule:
 * - Apply scheduled changes: Every 15 minutes or hourly
 * - Auto-approve requests: Once daily (e.g., at 1 AM UTC)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const cronSecret = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const task = request.nextUrl.searchParams.get('task');

    if (!task || !['apply', 'auto-approve', 'all'].includes(task)) {
      return NextResponse.json(
        { error: 'Invalid or missing task parameter. Use: apply, auto-approve, or all' },
        { status: 400 }
      );
    }

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    // Apply scheduled name changes
    if (task === 'apply' || task === 'all') {
      console.log('Running applyScheduledNameChanges...');
      const applyResult = await applyScheduledNameChanges();
      results.applyScheduledNameChanges = applyResult;
      console.log('applyScheduledNameChanges result:', applyResult);
    }

    // Auto-approve pending requests
    if (task === 'auto-approve' || task === 'all') {
      console.log('Running autoApprovePendingRequests...');
      const autoApproveResult = await autoApprovePendingRequests();
      results.autoApprovePendingRequests = autoApproveResult;
      console.log('autoApprovePendingRequests result:', autoApproveResult);
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Error in cron endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
