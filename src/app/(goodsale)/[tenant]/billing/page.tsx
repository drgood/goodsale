'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Calendar, DollarSign, CheckCircle, Clock, Check } from 'lucide-react';

interface Subscription {
  id: string;
  planId: string;
  billingPeriod: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: string;
  planName?: string;
}

interface BillingRecord {
  id: string;
  subscriptionId: string;
  amount: string;
  paymentMethod: string;
  status: string;
  invoiceNumber?: string;
  paidAt: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  isPopular?: boolean;
}

export default function TenantBillingPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([fetchSubscription(), fetchBillingHistory(), fetchPlans()]);
    }
  }, [session]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      // Fetch current tenant's subscription
      // This would require a GET endpoint at /api/tenants/subscription
      const response = await fetch('/api/tenants/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      // Fetch tenant's billing history
      // This would require a GET endpoint at /api/tenants/billing-history
      const response = await fetch('/api/tenants/billing-history');
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data);
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'canceled':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'suspended':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const getBillingPeriodLabel = (period: string) => {
    const periods: Record<string, string> = {
      '1_month': '1 Month',
      '6_months': '6 Months',
      '12_months': '12 Months',
      '24_months': '24 Months',
    };
    return periods[period] || period;
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const daysUntilExpiry = subscription ? getDaysUntilExpiry(subscription.endDate) : 0;
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription plan and view payment history."
      >
        <Button onClick={() => setShowPlans(!showPlans)} variant="outline">
          {showPlans ? 'Hide Plans' : 'View Available Plans'}
        </Button>
      </PageHeader>

      {/* Available Plans */}
      {showPlans && (
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose the plan that best fits your business needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.isPopular ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {plan.isPopular && <Badge>Most Popular</Badge>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">GH₵{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features && plan.features.length > 0 ? (
                        plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground">No features listed</li>
                      )}
                    </ul>
                    <Link href={subscription?.planId === plan.id ? '#' : `billing/upgrade?planId=${plan.id}`}>
                      <Button 
                        className="w-full" 
                        variant={subscription?.planId === plan.id ? 'outline' : 'default'}
                        disabled={subscription?.planId === plan.id}
                      >
                        {subscription?.planId === plan.id ? 'Current Plan' : 'Upgrade to This Plan'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Need a custom plan? Contact our sales team at sales@goodsale.com</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(subscription.status)}
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded ${getStatusBadgeColor(
                    subscription.status
                  )}`}
                >
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-lg font-semibold">{subscription.planName || 'Premium'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Period</p>
                  <p className="text-lg font-semibold">
                    {getBillingPeriodLabel(subscription.billingPeriod)}
                  </p>
                </div>
              </div>

              {/* Dates & Amount */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">GH₵{parseFloat(subscription.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="text-lg font-semibold">
                    {new Date(subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Expiry Warning */}
            {isExpiringSoon && subscription.status === 'active' && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                      Subscription Expiring Soon
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                      Your subscription will expire in {daysUntilExpiry} days. Please contact our support
                      to renew.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {subscription.status === 'expired' && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-200">
                      Subscription Expired
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                      Your subscription has expired. Please contact our support to renew your
                      subscription and regain access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!subscription && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No active subscription found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact our support team to set up a subscription.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all your past payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.invoiceNumber || 'N/A'}
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Info */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            For billing inquiries, subscription changes, or issues, please contact our support team.
          </p>
          <p>
            <strong>Email:</strong> support@goodsale.com
          </p>
          <p>
            <strong>Phone:</strong> +233 XXX XXX XXXX
          </p>
        </CardContent>
      </Card>
    </>
  );
}
