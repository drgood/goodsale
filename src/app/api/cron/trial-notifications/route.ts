import { NextRequest, NextResponse } from 'next/server';
import { sendTrialNotifications } from '@/lib/trial-notifications';

/**
 * Cron job to send trial expiration notifications
 * Should be called daily at 2 AM UTC
 * 
 * GET /api/cron/trial-notifications (development only)
 * POST /api/cron/trial-notifications (production with CRON_SECRET)
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

    console.log('Starting trial notifications cron job...');

    const result = await sendTrialNotifications();

    console.log('Trial notifications job completed:', result);

    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in trial notifications cron job:', error);

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
 * GET handler for testing/manual trigger (development only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'GET method only available in development' },
      { status: 403 }
    );
  }

  try {
    const result = await sendTrialNotifications();

    return NextResponse.json({
      message: 'Manual trigger - development only',
      ...result,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in manual trial notifications trigger:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
