'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface NameChangeRequest {
  id: string;
  tenantId: string;
  oldName: string;
  newName: string;
  reason: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  scheduledApprovalDate: string | null;
  appliedAt: string | null;
  requesterName: string;
  requesterEmail: string;
  tenantName: string;
}

export default function TenantNameChangesPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [requests, setRequests] = useState<NameChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<NameChangeRequest | null>(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch requests
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session?.user?.isSuperAdmin) {
      fetchRequests();
    }
  }, [session, statusFilter, page]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const url = new URL('/api/admin/tenant-name-changes', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '10');
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.data);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch name change requests',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecisionClick = (request: NameChangeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setDecisionAction(action);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setShowDecisionDialog(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest) return;

    if (decisionAction === 'reject' && !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/tenant-name-changes/${selectedRequest.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: decisionAction,
            ...(decisionAction === 'reject' && { rejectionReason }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${decisionAction} request`);
      }

      toast({
        title: 'Success',
        description: `Request has been ${decisionAction}ed`,
      });

      setShowDecisionDialog(false);
      setSelectedRequest(null);
      setDecisionAction(null);
      setRejectionReason('');
      await fetchRequests();
    } catch (error) {
      console.error('Error processing decision:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to process decision',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
      case 'scheduled':
      case 'auto_approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'applied':
        return <Zap className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'approved':
      case 'scheduled':
      case 'auto_approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'applied':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  return (
    <>
      <PageHeader
        title="Tenant Name Changes"
        description="Review and manage pending tenant name change requests."
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Requests</CardTitle>
            <CardDescription>Show requests by status</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="auto_approved">Auto Approved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Name Change Requests</CardTitle>
            <CardDescription>
              {requests.length} request{requests.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : requests.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No requests found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.tenantName}</TableCell>
                        <TableCell>{request.requesterName}</TableCell>
                        <TableCell className="text-sm">
                          <div className="text-muted-foreground">
                            {request.oldName} → {request.newName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span
                              className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(
                                request.status
                              )}`}
                            >
                              {request.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDecisionClick(request, 'reject')
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleDecisionClick(request, 'approve')
                                }
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                          {request.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedRequest(request)}
                            >
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionAction === 'approve'
                ? 'Approve Name Change'
                : 'Reject Name Change'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  <p className="mt-2">
                    Tenant: <strong>{selectedRequest.tenantName}</strong>
                  </p>
                  <p>
                    Change: <strong>{selectedRequest.oldName}</strong> →{' '}
                    <strong>{selectedRequest.newName}</strong>
                  </p>
                  <p>
                    Reason: <em>{selectedRequest.reason}</em>
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {decisionAction === 'reject' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="e.g., Name is offensive, already in use, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          {decisionAction === 'approve' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This request will be approved and scheduled for application at
                2:00 AM tomorrow.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDecisionDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={isProcessing}
              variant={decisionAction === 'approve' ? 'default' : 'destructive'}
            >
              {isProcessing
                ? 'Processing...'
                : decisionAction === 'approve'
                  ? 'Approve'
                  : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
