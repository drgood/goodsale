import { NextRequest, NextResponse } from 'next/server';
import {
  checkExpiringSubscriptions,
  suspendExpiredSubscriptions,
  getSubscriptionStats,
} from '@/lib/subscription-renewal-jobs';

/**
 * Cron job handler for subscription renewal automation
 * This endpoint should be called daily by an external cron service (e.g., cron-job.org, Vercel Cron)
 *
 * Protected by CRON_SECRET environment variable for security
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify the request is from an authorized cron service
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid or missing CRON_SECRET' },
        { status: 401 }
      );
    }

    console.log('Starting subscription renewal automation job...');

    // Run both jobs
    const [checkResult, suspendResult, stats] = await Promise.all([
      checkExpiringSubscriptions(),
      suspendExpiredSubscriptions(),
      getSubscriptionStats(),
    ]);

    const allSuccess = checkResult.success && suspendResult.success;

    const response = {
      success: allSuccess,
      timestamp: new Date().toISOString(),
      jobs: {
        check_expiring: {
          success: checkResult.success,
          reminders_sent: checkResult.reminders_sent,
          errors: checkResult.errors,
        },
        suspend_expired: {
          success: suspendResult.success,
          suspended: suspendResult.suspended,
          errors: suspendResult.errors,
        },
      },
      stats,
    };

    console.log('Subscription renewal job completed:', response);

    return NextResponse.json(response, {
      status: allSuccess ? 200 : 207,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in subscription renewal cron job:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for testing/manual trigger (for development only)
 * In production, only use POST with proper authentication
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'GET method only available in development' },
      { status: 403 }
    );
  }

  try {
    const checkResult = await checkExpiringSubscriptions();
    const suspendResult = await suspendExpiredSubscriptions();
    const stats = await getSubscriptionStats();

    return NextResponse.json({
      success: true,
      message: 'Manual trigger - development only',
      jobs: {
        check_expiring: {
          success: checkResult.success,
          reminders_sent: checkResult.reminders_sent,
          errors: checkResult.errors,
        },
        suspend_expired: {
          success: suspendResult.success,
          suspended: suspendResult.suspended,
          errors: suspendResult.errors,
        },
      },
      stats,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in manual subscription renewal trigger:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
