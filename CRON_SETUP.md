# Subscription Renewal Automation - Cron Job Setup

This document explains how to set up and configure the subscription renewal automation cron jobs.

## Overview

The subscription renewal system includes two automated jobs:

1. **Check Expiring Subscriptions** - Identifies subscriptions expiring within 30 days and queues renewal reminders
2. **Suspend Expired Subscriptions** - Automatically suspends subscriptions that have passed their expiration date

Both jobs run daily through an external cron service.

## Environment Variables

Add the following to your `.env.local` file:

```
CRON_SECRET=your-secure-random-secret-here
```

Generate a secure secret using:
```bash
openssl rand -base64 32
```

## API Endpoint

The cron jobs are triggered via:

```
POST /api/cron/subscription-renewal
Authorization: Bearer {CRON_SECRET}
```

### Response Example

```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "jobs": {
    "check_expiring": {
      "success": true,
      "reminders_sent": 5,
      "errors": []
    },
    "suspend_expired": {
      "success": true,
      "suspended": 2,
      "errors": []
    }
  },
  "stats": {
    "total_active": 42,
    "expiring_soon": 5,
    "expired": 2,
    "canceled": 8
  }
}
```

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

If deployed on Vercel, you can use Vercel Cron for free. Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/subscription-renewal",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Then set the `CRON_SECRET` in Vercel project settings.

### Option 2: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [AWS EventBridge](https://aws.amazon.com/eventbridge/):

1. Create a new cron job
2. Set it to run daily at a preferred time (e.g., 2 AM UTC)
3. Make a POST request to: `https://yourdomain.com/api/cron/subscription-renewal`
4. Set header: `Authorization: Bearer {CRON_SECRET}`

**cron-job.org Example:**
- Schedule: Daily at 02:00 UTC
- URL: `https://yourdomain.com/api/cron/subscription-renewal`
- Method: POST
- Custom Headers: `Authorization: Bearer {CRON_SECRET}`

### Option 3: Manual Testing (Development)

During development, you can manually trigger the cron job:

```bash
curl http://localhost:3000/api/cron/subscription-renewal
```

This only works in development mode (NODE_ENV !== 'development').

## What Happens

### Daily Cron Job Execution

1. **Expiring Subscriptions Check (30-day window)**
   - Finds all active subscriptions expiring within the next 30 days
   - Queues renewal reminder notifications
   - Logs the action to audit logs

2. **Expired Subscriptions Suspension**
   - Finds all subscriptions past their end date
   - Updates their status to `expired`
   - Logs the suspension to audit logs
   - Queues expiration notice notifications

3. **Statistics Collection**
   - Counts active, expiring soon, expired, and canceled subscriptions
   - Included in response for monitoring

## Email Notifications

The cron jobs currently log reminders but don't send emails. To implement email notifications:

1. Update `checkExpiringSubscriptions()` in `src/lib/subscription-renewal-jobs.ts`
2. Call your email service (e.g., SendGrid, AWS SES, Resend)
3. Generate email templates for renewal reminders and expiration notices

Example integration:
```typescript
// In checkExpiringSubscriptions()
await sendEmail({
  to: tenant.ownerEmail,
  subject: `Your subscription expires in ${daysUntilExpiry} days`,
  template: 'renewal-reminder',
  data: { tenant, subscription, daysUntilExpiry }
});
```

## Monitoring and Logging

- All job executions are logged to console
- Check application logs for detailed error information
- The response includes success status and error details
- Audit logs are created for subscription status changes

## Security Considerations

- Always use HTTPS for the cron endpoint
- Store `CRON_SECRET` securely in environment variables
- Rotate the secret periodically
- Monitor cron job execution logs for unusual activity
- Validate request authorization on every call

## Troubleshooting

**Cron job not running:**
- Verify `CRON_SECRET` is set correctly in your environment
- Check external cron service logs
- Ensure the endpoint is publicly accessible

**Subscriptions not being suspended:**
- Check database connectivity
- Verify subscription records have correct `endDate` values
- Review application logs for SQL errors

**Reminders not being sent:**
- Email notification code needs to be implemented
- Check email service configuration
- Review notification logs

## Future Enhancements

- [ ] Send email notifications for renewal reminders
- [ ] Send email notifications for expiration notices
- [ ] Implement grace period before full suspension
- [ ] Add support for subscription renewal via UI
- [ ] Implement automatic subscription renewal with saved payment methods
- [ ] Add webhook notifications for subscription events
