'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChevronDown, Eye } from 'lucide-react';

interface ReturnItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  returnAmount: number;
  condition?: string;
}

interface Return {
  id: string;
  saleId: string;
  customerId?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
  totalReturnAmount: number;
  restockingFeeAmount: number;
  refundAmount: number;
  refundMethod?: string;
  approvalReason?: string;
  rejectionReason?: string;
  refundedAt?: string;
  createdAt: string;
  items?: ReturnItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  refunded: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200',
};

export default function ReturnsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [returns, setReturns] = useState<Return[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'refund'>('approve');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const response = await fetch('/api/returns');
        if (response.ok) {
          const data = await response.json();
          setReturns(data);
        }
      } catch (error) {
        console.error('Error fetching returns:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load returns.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchReturns();
    }
  }, [session, toast]);

  const handleViewDetails = async (returnRecord: Return) => {
    try {
      const response = await fetch(`/api/returns/${returnRecord.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedReturn(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching return details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load return details.'
      });
    }
  };

  const handleOpenActionModal = (type: 'approve' | 'reject' | 'refund') => {
    setActionType(type);
    setActionNotes('');
    setRefundMethod('cash');
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!selectedReturn) return;

    setIsActionLoading(true);
    try {
      const body: Record<string, any> = { action: actionType };

      if (actionType === 'approve') {
        body.approvalReason = actionNotes;
      } else if (actionType === 'reject') {
        body.rejectionReason = actionNotes;
      } else if (actionType === 'refund') {
        body.refundMethod = refundMethod;
      }

      const response = await fetch(`/api/returns/${selectedReturn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to process action');
      }

      const updated = await response.json();
      setSelectedReturn(updated);

      // Update returns list
      setReturns(returns.map(r => r.id === updated.id ? updated : r));

      toast({
        title: `Return ${actionType}d`,
        description: `Return has been successfully ${actionType}d.`
      });

      setShowActionModal(false);
    } catch (error) {
      console.error('Error processing action:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process action.'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredReturns = statusFilter === 'all'
    ? returns
    : returns.filter(r => r.status === statusFilter);

  const getActionButtons = (returnRecord: Return) => {
    const buttons = [];

    if (returnRecord.status === 'pending') {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600 hover:bg-green-50"
          onClick={() => {
            setSelectedReturn(returnRecord);
            handleOpenActionModal('approve');
          }}
        >
          Approve
        </Button>
      );
      buttons.push(
        <Button
          key="reject"
          size="sm"
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
          onClick={() => {
            setSelectedReturn(returnRecord);
            handleOpenActionModal('reject');
          }}
        >
          Reject
        </Button>
      );
    }

    if (returnRecord.status === 'approved') {
      buttons.push(
        <Button
          key="refund"
          size="sm"
          variant="default"
          onClick={() => {
            setSelectedReturn(returnRecord);
            handleOpenActionModal('refund');
          }}
        >
          Process Refund
        </Button>
      );
    }

    return buttons;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Returns Management"
        description="View and manage product returns and refunds."
      />

      {/* Status Filter */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Returns</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredReturns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {statusFilter === 'all'
                ? 'No returns yet.'
                : `No ${statusFilter} returns.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReturns.map((returnRecord) => (
            <Card key={returnRecord.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        Return from Sale: {returnRecord.saleId.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(returnRecord.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${statusColors[returnRecord.status]} font-semibold`}>
                      {returnRecord.status.charAt(0).toUpperCase() + returnRecord.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Return Amount</p>
                      <p className="font-semibold text-lg">
                        ${returnRecord.totalReturnAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Restocking Fee</p>
                      <p className="font-semibold text-lg">
                        -${returnRecord.restockingFeeAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Refund Amount</p>
                      <p className="font-semibold text-lg text-green-600">
                        ${returnRecord.refundAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Items</p>
                      <p className="font-semibold text-lg">
                        {returnRecord.items?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  {returnRecord.reason && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                      <p className="text-xs text-muted-foreground font-medium">Reason</p>
                      <p className="text-sm">{returnRecord.reason}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {returnRecord.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-950/20 rounded p-3 border border-red-200 dark:border-red-900">
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium">Rejection Reason</p>
                      <p className="text-sm text-red-700 dark:text-red-400">{returnRecord.rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetails(returnRecord)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    {getActionButtons(returnRecord)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedReturn && (
            <>
              <DialogHeader>
                <DialogTitle>Return Details</DialogTitle>
                <DialogDescription>
                  Return ID: {selectedReturn.id.slice(0, 8)}...
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`${statusColors[selectedReturn.status]} font-semibold`}>
                      {selectedReturn.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedReturn.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Return Amount</p>
                    <p className="font-semibold">${selectedReturn.totalReturnAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Refund Amount</p>
                    <p className="font-semibold text-green-600">
                      ${selectedReturn.refundAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold mb-2">Returned Items</h3>
                  <div className="space-y-2">
                    {selectedReturn.items?.map((item) => (
                      <div key={item.id} className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} @ ${item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${item.returnAmount.toFixed(2)}</p>
                            {item.condition && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {item.condition}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                {selectedReturn.reason && (
                  <div>
                    <h3 className="font-semibold mb-2">Return Reason</h3>
                    <p className="text-sm bg-slate-50 dark:bg-slate-900 rounded p-3">
                      {selectedReturn.reason}
                    </p>
                  </div>
                )}

                {/* Approval Info */}
                {selectedReturn.status !== 'pending' && selectedReturn.approvalReason && (
                  <div>
                    <h3 className="font-semibold mb-2">Approval Notes</h3>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950/20 rounded p-3">
                      {selectedReturn.approvalReason}
                    </p>
                  </div>
                )}

                {/* Refund Info */}
                {selectedReturn.status === 'refunded' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Refund Method</p>
                      <p className="font-medium capitalize">{selectedReturn.refundMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Refunded At</p>
                      <p className="font-medium">
                        {selectedReturn.refundedAt
                          ? new Date(selectedReturn.refundedAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Approve Return'
                : actionType === 'reject'
                  ? 'Reject Return'
                  : 'Process Refund'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Approve this return request and allow the customer to proceed.'
                : actionType === 'reject'
                  ? 'Reject this return request.'
                  : 'Process the refund for this approved return.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'refund' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="refund-method">Refund Method</Label>
                  <Select value={refundMethod} onValueChange={setRefundMethod}>
                    <SelectTrigger id="refund-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                      <SelectItem value="store_credit">Store Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedReturn && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                    <p className="text-xs text-muted-foreground">Refund Amount</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${selectedReturn.refundAmount.toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="notes">
                  {actionType === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    actionType === 'approve'
                      ? 'Add any notes about the approval...'
                      : 'Explain why this return is being rejected...'
                  }
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionModal(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isActionLoading}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {isActionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
