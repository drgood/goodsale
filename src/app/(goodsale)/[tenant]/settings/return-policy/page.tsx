'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ReturnPolicy {
  id?: string;
  returnWindowDays: number;
  refundMethod: string;
  restockingFeePercent: number;
  requiresApproval: boolean;
  allowPartialReturns: boolean;
  notifyCustomer: boolean;
}

export default function ReturnPolicyPage() {
  const { toast } = useToast();
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [policy, setPolicy] = useState<ReturnPolicy>({
    returnWindowDays: 30,
    refundMethod: 'original',
    restockingFeePercent: 0,
    requiresApproval: true,
    allowPartialReturns: true,
    notifyCustomer: true
  });

  const [initialPolicy, setInitialPolicy] = useState<ReturnPolicy>({
    returnWindowDays: 30,
    refundMethod: 'original',
    restockingFeePercent: 0,
    requiresApproval: true,
    allowPartialReturns: true,
    notifyCustomer: true
  });

  useEffect(() => {
    const changed = JSON.stringify(policy) !== JSON.stringify(initialPolicy);
    setHasUnsavedChanges(changed);
  }, [policy, initialPolicy]);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch('/api/return-policies');
        if (response.ok) {
          const data = await response.json();
          setPolicy(data);
          setInitialPolicy(data);
        }
      } catch (error) {
        console.error('Error fetching return policy:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load return policy.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchPolicy();
    }
  }, [session, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/return-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy)
      });

      if (!response.ok) {
        throw new Error('Failed to save return policy');
      }

      const data = await response.json();
      setInitialPolicy(data);
      setHasUnsavedChanges(false);

      toast({
        title: 'Return Policy Saved',
        description: 'Your return policy has been successfully updated.'
      });
    } catch (error) {
      console.error('Error saving return policy:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save return policy.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setPolicy(initialPolicy);
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Return Policy"
        description="Configure your store's return policy and refund settings."
      />

      {hasUnsavedChanges && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-600" />
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              You have unsaved changes
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Return Window Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Return Window</CardTitle>
            <CardDescription>
              Number of days customers can return items after purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="return-window">Days to Accept Returns</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="return-window"
                  type="number"
                  min="1"
                  max="365"
                  value={policy.returnWindowDays}
                  onChange={(e) =>
                    setPolicy({ ...policy, returnWindowDays: parseInt(e.target.value) || 30 })
                  }
                  disabled={isSaving}
                  className="max-w-xs"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Refund Settings</CardTitle>
            <CardDescription>
              Configure how refunds are processed for returned items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="refund-method">Refund Method</Label>
                <Select
                  value={policy.refundMethod}
                  onValueChange={(value) => setPolicy({ ...policy, refundMethod: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger id="refund-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">
                      Refund to Original Payment Method
                    </SelectItem>
                    <SelectItem value="store_credit">Store Credit Only</SelectItem>
                    <SelectItem value="both">
                      Let Customer Choose (Credit or Original)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restocking-fee">Restocking Fee (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="restocking-fee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={policy.restockingFeePercent}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        restockingFeePercent: parseFloat(e.target.value) || 0
                      })
                    }
                    disabled={isSaving}
                    className="max-w-xs"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fee deducted from refund amount (e.g., 10 = 10%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval & Notification Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Workflow Settings</CardTitle>
            <CardDescription>
              Configure approval process and notification settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requires-approval" className="text-base">
                  Require Admin Approval
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Admin must approve returns before processing refunds
                </p>
              </div>
              <Switch
                id="requires-approval"
                checked={policy.requiresApproval}
                onCheckedChange={(checked) =>
                  setPolicy({ ...policy, requiresApproval: checked })
                }
                disabled={isSaving}
              />
            </div>

            <div className="border-t pt-6" />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-partial" className="text-base">
                  Allow Partial Returns
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Let customers return some items from an order, not all
                </p>
              </div>
              <Switch
                id="allow-partial"
                checked={policy.allowPartialReturns}
                onCheckedChange={(checked) =>
                  setPolicy({ ...policy, allowPartialReturns: checked })
                }
                disabled={isSaving}
              />
            </div>

            <div className="border-t pt-6" />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-customer" className="text-base">
                  Notify Customer
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Send notifications when returns are approved or rejected
                </p>
              </div>
              <Switch
                id="notify-customer"
                checked={policy.notifyCustomer}
                onCheckedChange={(checked) =>
                  setPolicy({ ...policy, notifyCustomer: checked })
                }
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Policy Summary */}
        <Card className="bg-slate-50 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="font-headline text-base">Policy Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground font-medium">Return Window</p>
                <p className="text-lg font-semibold">{policy.returnWindowDays} days</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Restocking Fee</p>
                <p className="text-lg font-semibold">{policy.restockingFeePercent}%</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Approval Required</p>
                <p className="text-lg font-semibold">{policy.requiresApproval ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={isSaving || !hasUnsavedChanges}
          >
            Discard Changes
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </div>
    </div>
  );
}
