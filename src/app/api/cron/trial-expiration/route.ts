import { NextRequest, NextResponse } from 'next/server';
import { handleTrialExpirations } from '@/lib/trial-expiration';

/**
 * Cron job to suspend expired trials and archive old data
 * Should be called daily at 3 AM UTC
 * 
 * GET /api/cron/trial-expiration (development only)
 * POST /api/cron/trial-expiration (production with CRON_SECRET)
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

    console.log('Starting trial expiration cron job...');

    const result = await handleTrialExpirations();

    console.log('Trial expiration job completed:', result);

    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in trial expiration cron job:', error);

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
    const result = await handleTrialExpirations();

    return NextResponse.json({
      success: result.success,
      message: 'Manual trigger - development only',
      ...result,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in manual trial expiration trigger:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
