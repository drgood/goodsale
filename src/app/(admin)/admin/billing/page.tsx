'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
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
import { PlusCircle, Download, DollarSign, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BillingRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: string;
  paymentMethod: string;
  status: string;
  invoiceNumber?: string;
  notes?: string;
  paidAt: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

interface Plan {
  id: string;
  name: string;
}

interface PlanPricing {
  id: string;
  billingPeriod: string;
  price: string;
  discountPercent: string;
}

interface SubscriptionRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  planId: string;
  planName: string;
  billingPeriod: string;
  totalAmount: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  requestedBy: string;
  requestedAt: string;
  status: string;
}

export default function BillingPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planPricings, setPlanPricings] = useState<PlanPricing[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState('1_month');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const billingPeriods = [
    { value: '1_month', label: '1 Month' },
    { value: '6_months', label: '6 Months' },
    { value: '12_months', label: '12 Months' },
    { value: '24_months', label: '24 Months' },
  ];

  // Fetch initial data
  useEffect(() => {
    if (session?.user?.isSuperAdmin) {
      Promise.all([fetchBillingRecords(), fetchSubscriptionRequests(), fetchTenants(), fetchPlans()]);
    }
  }, [session, page]);

  const fetchBillingRecords = async () => {
    try {
      const response = await fetch(`/api/admin/billing?page=${page}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      setBillingRecords(data.data);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching billing records:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch billing records',
      });
    }
  };

  const fetchSubscriptionRequests = async () => {
    try {
      const response = await fetch('/api/admin/subscription-requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      // Only show pending requests
      setSubscriptionRequests(data.filter((r: SubscriptionRequest) => r.details.status === 'pending'));
    } catch (error) {
      console.error('Error fetching subscription requests:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants?limit=500');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pricing when plan changes
  useEffect(() => {
    if (selectedPlan) {
      fetchPlanPricing(selectedPlan);
    }
  }, [selectedPlan]);

  const fetchPlanPricing = async (planId: string) => {
    try {
      const response = await fetch(`/api/admin/plan-pricing?planId=${planId}`);
      if (!response.ok) throw new Error('Failed to fetch pricing');
      const data = await response.json();
      setPlanPricings(data.data);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch plan pricing',
      });
    }
  };

  const getCurrentPrice = () => {
    const pricing = planPricings.find((p) => p.billingPeriod === selectedBillingPeriod);
    return pricing ? parseFloat(pricing.price) : 0;
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentPrice = getCurrentPrice();
      const response = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant,
          planId: selectedPlan,
          billingPeriod: selectedBillingPeriod,
          amount: currentPrice.toString(),
          paymentMethod: 'cash',
          invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
          notes,
          paidAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      toast({
        title: 'Payment Recorded',
        description: `GH₵${currentPrice.toFixed(2)} payment recorded successfully.`,
      });

      setShowDialog(false);
      setSelectedTenant('');
      setSelectedPlan('');
      setSelectedBillingPeriod('1_month');
      setInvoiceNumber('');
      setNotes('');
      await Promise.all([fetchBillingRecords(), fetchSubscriptionRequests()]);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to record payment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Invoice', 'Tenant', 'Amount', 'Period', 'Method', 'Date'].join(','),
      ...billingRecords.map((record) =>
        [
          record.invoiceNumber || 'N/A',
          record.tenantName,
          record.amount,
          '',
          record.paymentMethod,
          new Date(record.paidAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalRevenue = billingRecords.reduce(
    (sum, record) => sum + parseFloat(record.amount),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Billing Management" description="Record payments and manage subscriptions.">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Record Payment</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Cash Payment</DialogTitle>
              <DialogDescription>
                Record a new subscription payment from a tenant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder="Select tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Select plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Billing Period</Label>
                <Select value={selectedBillingPeriod} onValueChange={setSelectedBillingPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {billingPeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {getCurrentPrice() > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    Amount: <span className="font-bold">GH₵{getCurrentPrice().toFixed(2)}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invoice">Invoice Number (optional)</Label>
                <Input
                  id="invoice"
                  placeholder="e.g., INV-2024-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedTenant || !selectedPlan || isSubmitting}
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {billingRecords.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billingRecords.filter((r) => r.paymentMethod === 'cash').length}
            </div>
            <p className="text-xs text-muted-foreground">All recorded payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Subscription Requests */}
      {subscriptionRequests.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Pending Subscription Requests
                </CardTitle>
                <CardDescription>
                  {subscriptionRequests.length} tenant{subscriptionRequests.length !== 1 ? 's' : ''} waiting for activation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.tenantName}</p>
                        <p className="text-xs text-muted-foreground">{request.tenantSubdomain}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{request.planName}</TableCell>
                    <TableCell className="text-sm">
                      {request.billingPeriod === '1_month' ? '1 Month' :
                       request.billingPeriod === '6_months' ? '6 Months' :
                       request.billingPeriod === '12_months' ? '1 Year' : '2 Years'}
                    </TableCell>
                    <TableCell className="font-medium">GH₵{parseFloat(request.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium">{request.contactName}</p>
                        <p className="text-muted-foreground">{request.contactPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Pre-fill the dialog with request data
                          setSelectedTenant(request.tenantId);
                          setSelectedPlan(request.planId);
                          setSelectedBillingPeriod(request.billingPeriod);
                          setShowDialog(true);
                        }}
                      >
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Transactions</CardTitle>
            <CardDescription>View and manage all billing records</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No billing records found
                    </TableCell>
                  </TableRow>
                ) : (
                  billingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.invoiceNumber || 'N/A'}</TableCell>
                      <TableCell>{record.tenantName}</TableCell>
                      <TableCell>GH₵{parseFloat(record.amount).toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{record.paymentMethod}</TableCell>
                      <TableCell>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 rounded text-xs font-semibold">
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(record.paidAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
  );
}
