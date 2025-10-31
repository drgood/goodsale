'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface SubscriptionRequest {
  id: string;
  timestamp: string;
  details: {
    planId: string;
    billingPeriod: string;
    contactInfo: {
      name: string;
      email: string;
      phone: string;
      message: string;
    };
    totalAmount: string;
    status: string;
    tenantName?: string;
    tenantSubdomain?: string;
    planName?: string;
  };
  entityId: string; // tenantId
}

export default function SubscriptionRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amountReceived, setAmountReceived] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/subscription-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load subscription requests.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedRequest || !invoiceNumber || !amountReceived) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide invoice number and amount received.',
      });
      return;
    }

    setIsActivating(true);

    try {
      const response = await fetch('/api/admin/subscription-requests/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          tenantId: selectedRequest.entityId,
          planId: selectedRequest.details.planId,
          billingPeriod: selectedRequest.details.billingPeriod,
          amount: amountReceived,
          invoiceNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate subscription');
      }

      toast({
        title: 'Success',
        description: 'Subscription activated successfully!',
      });

      setSelectedRequest(null);
      setInvoiceNumber('');
      setAmountReceived('');
      fetchRequests();
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to activate subscription.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'activated':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activated</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBillingPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      '1_month': '1 Month',
      '6_months': '6 Months',
      '12_months': '1 Year',
      '24_months': '2 Years',
    };
    return labels[period] || period;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading subscription requests...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Subscription Requests"
        description="Manage tenant subscription upgrade requests"
      />

      <Card>
        <CardHeader>
          <CardTitle>Pending & Recent Requests</CardTitle>
          <CardDescription>View and activate subscription upgrade requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subscription requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.details.tenantName || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{request.details.tenantSubdomain || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{request.details.contactInfo.name}</p>
                        <p className="text-xs text-muted-foreground">{request.details.contactInfo.email}</p>
                        <p className="text-xs text-muted-foreground">{request.details.contactInfo.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{request.details.planName || request.details.planId}</TableCell>
                    <TableCell className="text-sm">{getBillingPeriodLabel(request.details.billingPeriod)}</TableCell>
                    <TableCell className="font-medium">GH₵{request.details.totalAmount}</TableCell>
                    <TableCell className="text-sm">{new Date(request.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(request.details.status)}</TableCell>
                    <TableCell>
                      {request.details.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAmountReceived(request.details.totalAmount);
                          }}
                        >
                          Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Activation Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Subscription</DialogTitle>
            <DialogDescription>
              Confirm cash payment received and activate the subscription
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <p className="text-sm font-medium">{selectedRequest?.details.tenantName}</p>
            </div>

            <div className="space-y-2">
              <Label>Contact</Label>
              <p className="text-sm">{selectedRequest?.details.contactInfo.name}</p>
              <p className="text-xs text-muted-foreground">{selectedRequest?.details.contactInfo.phone}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Billing Period</Label>
                <p className="text-sm">{selectedRequest && getBillingPeriodLabel(selectedRequest.details.billingPeriod)}</p>
              </div>
              <div className="space-y-2">
                <Label>Expected Amount</Label>
                <p className="text-sm font-medium">GH₵{selectedRequest?.details.totalAmount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice">Invoice Number *</Label>
              <Input
                id="invoice"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount Received (GH₵) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)} disabled={isActivating}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={isActivating}>
              {isActivating ? 'Activating...' : 'Confirm & Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
