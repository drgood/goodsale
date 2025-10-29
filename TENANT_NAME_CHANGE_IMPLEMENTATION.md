# Tenant Name Change Approval Workflow - Implementation Guide

## Overview

A complete tenant name change approval workflow has been implemented allowing tenants to request name changes with delayed admin approval and automatic application. The system follows these key requirements:

- **Unique tenant names** enforced at the database level
- **Immutable subdomains** - never changes after creation
- **Queued requests** - latest request replaces older ones, no auto-rejection
- **Admin approval** on dashboard only (no email digest)
- **Rejection reasons** visible to tenant owners
- **Scheduled application** at 2 AM next day after approval
- **Auto-approval** after 30 days with no admin action
- **No cancellation** by owner after admin approval
- **Email notifications** (TODO: to be implemented)
- **Full audit logging** of all actions

## Database Schema

The implementation adds:

```typescript
// src/db/schema.ts - Added tenantNameChangeRequests table
export const tenantNameChangeRequests = pgTable("tenant_name_change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  oldName: varchar("old_name", { length: 255 }).notNull(),
  newName: varchar("new_name", { length: 255 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }).notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow(),
  reviewedBy: uuid("reviewed_by").references(() => superAdmins.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  scheduledApprovalDate: timestamp("scheduled_approval_date", { withTimezone: true }),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
});

// Added field to tenants table
pendingNameChangeId: uuid("pending_name_change_id");
```

## API Endpoints

### 1. **Tenant Owner - Request Name Change**
**POST** `/api/tenants/name-change-request`

Request body:
```json
{
  "newName": "New Tenant Name",
  "reason": "Company rebranding"
}
```

Response: `201 Created` with request object
- Validates new name is not already taken
- Prevents multiple active requests for same tenant
- Creates audit log entry
- TODO: Sends email to tenant owner

### 2. **Tenant Owner - Get Current Request Status**
**GET** `/api/tenants/name-change-request`

Response: `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "status": "pending|approved|scheduled|auto_approved|applied|rejected",
    "oldName": "Old Name",
    "newName": "New Name",
    "reason": "Change reason",
    "rejectionReason": null,
    ...
  }
}
```

### 3. **Super Admin - List All Requests**
**GET** `/api/admin/tenant-name-changes?page=1&limit=10&status=pending`

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (optional: pending, approved, scheduled, auto_approved, applied, rejected)

Response: `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "oldName": "Old Name",
      "newName": "New Name",
      "status": "pending",
      "requesterName": "Owner Name",
      "requesterEmail": "owner@example.com",
      "tenantName": "Tenant Name",
      "requestedAt": "2024-01-15T10:30:00Z",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 4. **Super Admin - Approve/Reject Request**
**PATCH** `/api/admin/tenant-name-changes/{id}`

Request body for approval:
```json
{
  "action": "approve"
}
```

Request body for rejection:
```json
{
  "action": "reject",
  "rejectionReason": "Name is offensive or already exists"
}
```

Response: `200 OK` with updated request object
- Sets status to `approved` (then `scheduled` after date calculation)
- Schedules for application at 2 AM next day
- Sets reviewedBy and reviewedAt
- Creates audit log entry
- TODO: Sends email notification

## Background Jobs

### 1. **Apply Scheduled Name Changes**
Location: `src/lib/tenant-name-change-jobs.ts`

Function: `applyScheduledNameChanges()`

Features:
- Finds all requests with status `scheduled` and due date <= now
- Verifies tenant exists and new name is still available
- Updates tenant name in database
- Marks request as `applied` with appliedAt timestamp
- Creates audit log entry
- Returns summary with count of applied changes

### 2. **Auto-Approve Pending Requests**
Location: `src/lib/tenant-name-change-jobs.ts`

Function: `autoApprovePendingRequests()`

Features:
- Finds all requests with status `pending` for >= 30 days
- Updates status to `auto_approved`
- Schedules for application at 2 AM next day
- Creates audit log entry
- Returns summary with count of auto-approved requests

### 3. **Cron Endpoint**
Location: `src/app/api/cron/tenant-name-changes/route.ts`

Endpoint: **GET** `/api/cron/tenant-name-changes?task=apply|auto-approve|all`

Query parameters:
- `task`: Type of task to run (`apply`, `auto-approve`, or `all`)

Optional header for security:
- `Authorization: Bearer {CRON_SECRET}` (if `CRON_SECRET` env var is set)

Example responses:
```json
{
  "success": true,
  "timestamp": "2024-01-15T02:00:00Z",
  "applyScheduledNameChanges": {
    "success": true,
    "applied": 3,
    "errors": []
  },
  "autoApprovePendingRequests": {
    "success": true,
    "autoApproved": 1,
    "errors": []
  }
}
```

## Setup Instructions

### 1. Database Migration
The `tenantNameChangeRequests` table was already added to the schema. Run migrations:

```bash
npm run migrate
# or if using another migration tool
npm run db:push
```

### 2. Environment Configuration

Add to `.env`:
```env
# Optional: Cron job security
CRON_SECRET=your-secret-key-here
```

### 3. Configure Cron Jobs

#### Option A: Vercel Deployment
Create/update `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/tenant-name-changes?task=apply",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/tenant-name-changes?task=auto-approve",
      "schedule": "0 1 * * *"
    }
  ]
}
```

#### Option B: External Cron Service (EasyCron, cron-job.org)
Set up HTTP GET requests:

**Apply scheduled changes** (every 15 minutes):
```
GET https://yourdomain.com/api/cron/tenant-name-changes?task=apply
Authorization: Bearer {CRON_SECRET}
```

**Auto-approve requests** (daily at 1 AM UTC):
```
GET https://yourdomain.com/api/cron/tenant-name-changes?task=auto-approve
Authorization: Bearer {CRON_SECRET}
```

## UI Components

### 1. **Tenant Settings Page**
Location: `src/app/(goodsale)/[tenant]/settings/page.tsx`

Features:
- Display current tenant name change request status
- Show active requests with status badges
- Display rejection reasons for rejected requests
- "Request Name Change" button in card
- Dialog form to submit new request
- Shows old name (read-only), new name input, and reason textarea
- Validates input and prevents duplicate requests

### 2. **Admin Name Changes Page**
Location: `src/app/(admin)/admin/tenant-name-changes/page.tsx`

Features:
- List all name change requests with pagination
- Filter by status (Pending, Approved, Scheduled, Auto-Approved, Applied, Rejected)
- Display tenant name, requester info, change details, and status
- Action buttons to Approve/Reject pending requests
- Decision dialog with confirmation
- For rejections: required rejection reason input
- For approvals: shows scheduling info
- Color-coded status badges with icons
- Responsive table with proper styling

### 3. **Admin Sidebar Navigation**
Location: `src/components/admin-sidebar.tsx`

Added menu item:
```typescript
{ href: "/admin/tenant-name-changes", label: "Name Changes", icon: FileText }
```

## Request Lifecycle

```
1. Tenant submits request
   ├─ Validates input (name uniqueness, no active requests)
   ├─ Creates record with status: "pending"
   ├─ Sends email notification (TODO)
   └─ Logs action in audit_logs

2. Admin reviews on dashboard
   ├─ Views pending requests
   ├─ Approves → status: "approved" → "scheduled" 
   │           └─ Sets scheduledApprovalDate to next day 2 AM
   │           └─ Logs approval action
   │           └─ Sends approval email (TODO)
   └─ Rejects → status: "rejected"
              └─ Sets rejectionReason
              └─ Logs rejection
              └─ Sends rejection email (TODO)

3. Auto-approval (if no admin action for 30 days)
   ├─ Cron job runs daily
   ├─ Finds pending requests >= 30 days old
   ├─ Sets status to "auto_approved"
   ├─ Schedules for next day 2 AM
   └─ Logs auto-approval

4. Cron job applies scheduled changes
   ├─ Runs at 2 AM (via scheduled task)
   ├─ Finds "scheduled" and "auto_approved" with due date <= now
   ├─ Validates name still available
   ├─ Updates tenant.name in database
   ├─ Sets status to "applied" with appliedAt timestamp
   ├─ Logs application
   └─ Sends notification email (TODO)
```

## Testing Guide

### Manual Testing

1. **Submit a request:**
   - Login as tenant owner
   - Navigate to Settings
   - Click "Request Name Change"
   - Fill in new name and reason
   - Click "Submit Request"
   - Verify success toast and request appears in card

2. **View request status:**
   - Navigate to Settings
   - Verify active request shows with status badge

3. **Admin approval:**
   - Login as super admin
   - Navigate to Admin → Name Changes
   - Filter by "Pending"
   - Click "Approve" on a request
   - Confirm in dialog
   - Verify status changes to "Scheduled"

4. **Admin rejection:**
   - Click "Reject" on a pending request
   - Enter rejection reason
   - Submit
   - Verify status changes to "Rejected"
   - Verify tenant sees rejection reason in settings

5. **Cron job testing:**
   - Call `/api/cron/tenant-name-changes?task=apply` to test apply logic
   - Call `/api/cron/tenant-name-changes?task=auto-approve` to test auto-approve
   - Check audit logs for entries
   - Verify tenant names were updated in database

### API Testing with cURL

```bash
# Request name change
curl -X POST http://localhost:3000/api/tenants/name-change-request \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"newName":"New Shop Name","reason":"Rebranding"}'

# Get request status
curl http://localhost:3000/api/tenants/name-change-request \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# List admin requests
curl "http://localhost:3000/api/admin/tenant-name-changes?page=1&status=pending" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN"

# Approve request
curl -X PATCH http://localhost:3000/api/admin/tenant-name-changes/REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN" \
  -d '{"action":"approve"}'

# Reject request
curl -X PATCH http://localhost:3000/api/admin/tenant-name-changes/REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN" \
  -d '{"action":"reject","rejectionReason":"Name already in use"}'

# Test cron job
curl "http://localhost:3000/api/cron/tenant-name-changes?task=all" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Audit Logging

All actions are logged in `audit_logs` table:

- **REQUEST_TENANT_NAME_CHANGE**: When tenant submits request
- **APPROVE_TENANT_NAME_CHANGE**: When admin approves
- **REJECT_TENANT_NAME_CHANGE**: When admin rejects
- **AUTO_APPROVE_TENANT_NAME_CHANGE**: When system auto-approves after 30 days
- **APPLY_TENANT_NAME_CHANGE**: When scheduled change is applied

## Future Enhancements

### 1. Email Notifications
Implement email service integration to send:
- Confirmation when request is submitted
- Approval notification with scheduled date
- Rejection notification with reason
- Applied notification when name change takes effect

### 2. Webhook Support
Trigger webhooks when status changes for integration with external systems

### 3. Batch Operations
Allow admins to approve/reject multiple requests at once

### 4. Name Change History
Show tenants a history of all past name change requests (approved, rejected, applied)

### 5. Advanced Scheduling
Allow admins to set custom application times instead of fixed 2 AM

### 6. Subdomain Management
Once subdomain immutability is implemented, show mapping between old/new names and subdomains

## Troubleshooting

### Requests not being applied at scheduled time
- Check cron job configuration (vercel.json or external service)
- Verify `/api/cron/tenant-name-changes?task=apply` is being called
- Check server logs for errors
- Ensure `CRON_SECRET` matches if security is enabled

### Auto-approval not triggering
- Verify daily cron for `?task=auto-approve` is configured
- Check that requests are actually 30+ days old
- Review audit logs for auto-approval attempts

### Name uniqueness constraint violation
- Ensure frontend validation matches backend
- Check if another tenant's name change was already applied
- Consider race conditions in high-concurrency scenarios

### Missing audit logs
- Verify audit log creation is not failing silently
- Check database permissions for `audit_logs` table
- Review error logs for constraint violations

## Configuration Reference

| Setting | Default | Description |
|---------|---------|-------------|
| Schedule Time | 2 AM UTC | Time of day when approved requests are applied |
| Auto-Approve Days | 30 | Days before pending request auto-approves |
| Rejection Required | true | Rejection reason mandatory when rejecting |
| Cancellation Allowed | false | Owners cannot cancel after approval |
| Email Notifications | false | Currently not implemented |
| Cron Secret | N/A | Optional authorization token for cron endpoints |

## Files Modified/Created

**Created:**
- `src/app/api/tenants/name-change-request/route.ts` - Tenant endpoints
- `src/app/api/admin/tenant-name-changes/route.ts` - Admin listing
- `src/app/api/admin/tenant-name-changes/[id]/route.ts` - Admin decisions
- `src/app/api/cron/tenant-name-changes/route.ts` - Cron endpoint
- `src/lib/tenant-name-change-jobs.ts` - Background job utilities
- `src/app/(admin)/admin/tenant-name-changes/page.tsx` - Admin UI
- `src/app/(goodsale)/[tenant]/settings/page.tsx` - Updated with UI
- `src/components/admin-sidebar.tsx` - Updated navigation

**Database:**
- Added `tenantNameChangeRequests` table to schema
- Added `pendingNameChangeId` field to `tenants` table

## Support

For issues or questions about the implementation:
1. Check the troubleshooting section
2. Review audit logs for diagnostic information
3. Consult API endpoint documentation above
4. Check browser console for client-side errors
