# Return Policy System Implementation

## Overview
A comprehensive return management system for GoodSale that allows tenants to configure return policies and manage product returns with approval workflows and refund processing.

## Database Schema

### Tables Created

#### 1. `return_policies`
Stores tenant-specific return policy configuration.

**Columns:**
- `id` (UUID) - Primary key
- `tenantId` (UUID) - Foreign key to tenants (cascade delete)
- `returnWindowDays` (Integer) - Number of days customers can return items (default: 30)
- `refundMethod` (VARCHAR) - Type of refunds allowed: "original", "store_credit", or "both" (default: "original")
- `restockingFeePercent` (Numeric) - Percentage fee on refunds (default: 0)
- `requiresApproval` (Boolean) - Whether returns need admin approval (default: true)
- `allowPartialReturns` (Boolean) - Whether customers can return partial items (default: true)
- `notifyCustomer` (Boolean) - Send notifications to customers (default: true)
- `createdAt` (Timestamp) - Policy creation time
- `updatedAt` (Timestamp) - Last update time

#### 2. `returns`
Tracks all return requests with status and refund information.

**Columns:**
- `id` (UUID) - Primary key
- `tenantId` (UUID) - Foreign key to tenants (cascade delete)
- `saleId` (UUID) - Foreign key to sales (cascade delete)
- `customerId` (UUID) - Foreign key to customers (nullable)
- `requestedBy` (UUID) - Foreign key to users (nullable, who requested the return)
- `reason` (Text) - Reason for return
- `status` (VARCHAR) - Status: "pending", "approved", "rejected", "refunded", "cancelled"
- `totalReturnAmount` (Numeric) - Total value of items being returned
- `restockingFeeAmount` (Numeric) - Applied restocking fee (if any)
- `refundAmount` (Numeric) - Final refund amount after fees
- `refundMethod` (VARCHAR) - How refund will be given: "cash", "card", "mobile", "store_credit"
- `approvedBy` (UUID) - User who approved the return
- `approvalReason` (Text) - Reason for approval
- `rejectionReason` (Text) - Reason for rejection (if rejected)
- `refundedAt` (Timestamp) - When refund was processed
- `createdAt` (Timestamp) - Return request creation time
- `updatedAt` (Timestamp) - Last update time

#### 3. `return_items`
Details of individual items being returned as part of a return request.

**Columns:**
- `id` (UUID) - Primary key
- `returnId` (UUID) - Foreign key to returns (cascade delete)
- `saleItemId` (UUID) - Foreign key to sale_items (nullable)
- `productId` (UUID) - Foreign key to products (nullable)
- `productName` (VARCHAR) - Product name for reference
- `quantity` (Integer) - Number of items being returned
- `unitPrice` (Numeric) - Price per unit at time of return
- `returnAmount` (Numeric) - Total return value for this item (quantity × unitPrice)
- `condition` (VARCHAR) - Item condition: "like_new", "good", "fair", "damaged"

## API Endpoints

### 1. Return Management

#### GET /api/returns
Fetch all returns for the current tenant.

**Response:**
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "saleId": "uuid",
    "customerId": "uuid",
    "requestedBy": "uuid",
    "reason": "Defective product",
    "status": "pending",
    "totalReturnAmount": 100.00,
    "restockingFeeAmount": 0.00,
    "refundAmount": 100.00,
    "refundMethod": null,
    "approvedBy": null,
    "approvalReason": null,
    "rejectionReason": null,
    "refundedAt": null,
    "createdAt": "2025-11-04T12:00:00Z",
    "updatedAt": "2025-11-04T12:00:00Z"
  }
]
```

#### POST /api/returns
Create a new return request.

**Request Body:**
```json
{
  "saleId": "uuid",
  "customerId": "uuid",
  "reason": "Item is damaged",
  "refundMethod": "cash",
  "items": [
    {
      "saleItemId": "uuid",
      "productId": "uuid",
      "productName": "Laptop",
      "quantity": 1,
      "unitPrice": 100.00,
      "condition": "damaged"
    }
  ]
}
```

**Response:** Returns the created return record with status 201.

#### GET /api/returns/[id]
Fetch a specific return request with all items.

**Response:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "saleId": "uuid",
  "customerId": "uuid",
  "status": "pending",
  "totalReturnAmount": 100.00,
  "refundAmount": 100.00,
  "items": [
    {
      "id": "uuid",
      "returnId": "uuid",
      "productName": "Laptop",
      "quantity": 1,
      "unitPrice": 100.00,
      "returnAmount": 100.00,
      "condition": "damaged"
    }
  ],
  "createdAt": "2025-11-04T12:00:00Z"
}
```

#### PATCH /api/returns/[id]
Update a return request status or process refund.

**Request Body (Approve):**
```json
{
  "action": "approve",
  "approvalReason": "Item verification complete"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "rejectionReason": "Outside return window"
}
```

**Request Body (Process Refund):**
```json
{
  "action": "refund",
  "refundMethod": "cash"
}
```

When refund is processed:
- Return status changes to "refunded"
- Customer balance is updated if customer exists
- Refund timestamp is recorded

### 2. Return Policy Management

#### GET /api/return-policies
Fetch the return policy for current tenant.

**Response:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "returnWindowDays": 30,
  "refundMethod": "original",
  "restockingFeePercent": 10,
  "requiresApproval": true,
  "allowPartialReturns": true,
  "notifyCustomer": true,
  "createdAt": "2025-11-04T12:00:00Z",
  "updatedAt": "2025-11-04T12:00:00Z"
}
```

If no policy exists, returns defaults:
```json
{
  "returnWindowDays": 30,
  "refundMethod": "original",
  "restockingFeePercent": 0,
  "requiresApproval": true,
  "allowPartialReturns": true,
  "notifyCustomer": true
}
```

#### POST /api/return-policies
Create or update return policy for current tenant.

**Request Body:**
```json
{
  "returnWindowDays": 30,
  "refundMethod": "both",
  "restockingFeePercent": 10,
  "requiresApproval": true,
  "allowPartialReturns": true,
  "notifyCustomer": true
}
```

**Response:** Returns the created/updated policy with status 201.

## Query Functions

Located in `src/lib/queries.ts`:

- `getReturnPolicyByTenant(tenantId: string)` - Get policy for a tenant
- `createOrUpdateReturnPolicy(tenantId, data)` - Create or update policy
- `getReturnsByTenant(tenantId: string)` - Get all returns for tenant
- `getReturnById(returnId: string)` - Get return with items
- `createReturn(data)` - Create new return request
- `updateReturn(returnId, data)` - Update return status or details

## Features

### Return Policy Configuration
- Tenants can set return window (days from purchase)
- Choose refund methods (original payment, store credit, or both)
- Apply optional restocking fees
- Require approval before processing refunds
- Allow or disable partial returns
- Toggle customer notifications

### Return Request Workflow
1. **Create Return** - Request return from a previous sale
   - Specify items to return
   - Provide condition of items
   - Add reason for return

2. **Approval** (if policy requires)
   - Admin reviews return request
   - Can approve or reject with reason
   - Checks return window validity

3. **Refund Processing**
   - Select refund method
   - System deducts restocking fee if configured
   - Updates customer balance
   - Records refund timestamp

### Refund Methods Supported
- Cash
- Card
- Mobile Money
- Store Credit

### Return Status Flow
```
pending → approved → refunded
       → rejected
       → cancelled
```

## Validation Rules

1. **Return Window Validation** - Should verify sale date against return policy window
2. **Items Validation** - At least one item must be included
3. **Amount Validation** - Return amount cannot exceed sale total
4. **Customer Balance** - Updated when refund is processed

## Integration Points

### With Existing Systems

**Customers**
- Return requests linked to customer
- Customer balance updated on refund processing
- Customer notifications (when implemented)

**Sales**
- Returns linked to specific sales
- Can reference sale items
- Sale status may need updating when return processed

**Audit Logging**
- All return actions should be logged (when audit integration added)
- Track approvals, rejections, and refunds

**Notifications**
- Return request created notification
- Approval/rejection notifications
- Refund processed notifications

## Next Steps

1. **UI Pages**
   - Return policy settings page (`/[tenant]/settings/return-policy`)
   - Returns management page (`/[tenant]/returns`)
   - Return detail/approval page

2. **Notifications**
   - Integrate with existing notification system
   - Send alerts for return events

3. **Validation**
   - Add return window date validation
   - Verify sale eligibility

4. **Audit Logging**
   - Log all return events
   - Track user actions

5. **Reports**
   - Return statistics
   - Refund tracking
   - Return reasons analysis

## Testing

### API Testing Checklist

- [ ] Create return policy via POST /api/return-policies
- [ ] Fetch return policy via GET /api/return-policies
- [ ] Create return request via POST /api/returns
- [ ] Fetch all returns via GET /api/returns
- [ ] Fetch single return via GET /api/returns/[id]
- [ ] Approve return via PATCH /api/returns/[id] with action="approve"
- [ ] Reject return via PATCH /api/returns/[id] with action="reject"
- [ ] Process refund via PATCH /api/returns/[id] with action="refund"
- [ ] Verify customer balance updates on refund

### Database Testing

Verify tables created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('return_policies', 'returns', 'return_items');
```

## File Structure

```
src/
├── app/api/
│   ├── returns/
│   │   ├── route.ts              # GET all, POST create
│   │   └── [id]/route.ts         # GET detail, PATCH update
│   └── return-policies/
│       └── route.ts              # GET policy, POST update
├── db/
│   └── schema.ts                 # Database tables (updated)
└── lib/
    └── queries.ts                # Query functions (updated)
```

## Security Considerations

1. **Authorization** - All endpoints check tenant ownership
2. **Validation** - Input validation on all POST/PATCH endpoints
3. **Foreign Keys** - Database enforces referential integrity
4. **Cascade Delete** - Returns automatically deleted with tenant/sale
5. **Session Check** - All endpoints require authenticated session
