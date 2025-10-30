
'use client';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopLogo, setShopLogo] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [taxRate, setTaxRate] = useState("0");
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  
  // Track initial values for unsaved changes
  const [initialValues, setInitialValues] = useState({shopName: "", shopLogo: "", currency: "GHS", taxRate: "0", receiptHeader: "", receiptFooter: ""});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Name change request state
  const [showNameChangeDialog, setShowNameChangeDialog] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [nameChangeReason, setNameChangeReason] = useState("");
  const [isSubmittingNameChange, setIsSubmittingNameChange] = useState(false);
  const [nameChangeRequest, setNameChangeRequest] = useState<Record<string, unknown> | null>(null);
  const [isLoadingNameChangeStatus, setIsLoadingNameChangeStatus] = useState(false);
  const [currentTenantName, setCurrentTenantName] = useState("");
  
  // Detect unsaved changes
  useEffect(() => {
    const changed = shopName !== initialValues.shopName ||
                   shopLogo !== initialValues.shopLogo ||
                   currency !== initialValues.currency ||
                   taxRate !== initialValues.taxRate ||
                   receiptHeader !== initialValues.receiptHeader ||
                   receiptFooter !== initialValues.receiptFooter;
    setHasUnsavedChanges(changed);
  }, [shopName, shopLogo, currency, taxRate, receiptHeader, receiptFooter, initialValues]);

  // Warn on page navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Fetch name change request status
  useEffect(() => {
    const fetchNameChangeStatus = async () => {
      try {
        setIsLoadingNameChangeStatus(true);
        const response = await fetch('/api/tenants/name-change-request');
        if (response.ok) {
          const data = await response.json();
          setNameChangeRequest(data.data);
        }
      } catch (error) {
        console.error('Error fetching name change status:', error);
      } finally {
        setIsLoadingNameChangeStatus(false);
      }
    };
    
    if (session) {
      fetchNameChangeStatus();
    }
  }, [session]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          const normalizedCurrency = (data.currency || 'GHS').toUpperCase();
          setShopName(data.shopName || '');
          setShopLogo(data.logoUrl || '');
          setCurrency(normalizedCurrency);
          setTaxRate(data.taxRate?.toString() || '0');
          setReceiptHeader(data.receiptHeader || '');
          setReceiptFooter(data.receiptFooter || '');
          setCurrentTenantName(data.shopName || '');
          setInitialValues({
            shopName: data.shopName || '',
            shopLogo: data.logoUrl || '',
            currency: normalizedCurrency,
            taxRate: data.taxRate?.toString() || '0',
            receiptHeader: data.receiptHeader || '',
            receiptFooter: data.receiptFooter || ''
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load settings.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchSettings();
    }
  }, [session, toast]);

  const validateSettings = (): string | null => {
    if (!shopName.trim()) {
      return 'Shop name is required';
    }
    const taxNum = parseFloat(taxRate);
    if (isNaN(taxNum) || taxNum < 0 || taxNum > 100) {
      return 'Tax rate must be between 0 and 100';
    }
    return null;
  };

  const handleSave = async () => {
    const validation = validateSettings();
    if (validation) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validation
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          logoUrl: shopLogo,
          currency: currency.toUpperCase(),
          taxRate: parseFloat(taxRate),
          receiptHeader,
          receiptFooter
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setInitialValues({
        shopName,
        shopLogo,
        currency,
        taxRate,
        receiptHeader,
        receiptFooter
      });
      setHasUnsavedChanges(false);
      
      toast({
        title: "Settings Saved",
        description: "Your shop settings have been successfully updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShopName(initialValues.shopName);
    setShopLogo(initialValues.shopLogo);
    setCurrency(initialValues.currency);
    setTaxRate(initialValues.taxRate);
    setReceiptHeader(initialValues.receiptHeader);
    setReceiptFooter(initialValues.receiptFooter);
    setHasUnsavedChanges(false);
  };

  const handleSubmitNameChange = async () => {
    if (!newTenantName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a new tenant name'
      });
      return;
    }

    if (newTenantName.trim() === currentTenantName) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'New name must be different from current name'
      });
      return;
    }

    if (!nameChangeReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please provide a reason for the name change'
      });
      return;
    }

    setIsSubmittingNameChange(true);
    try {
      const response = await fetch('/api/tenants/name-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: newTenantName.trim(),
          reason: nameChangeReason.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit name change request');
      }

      const result = await response.json();
      setNameChangeRequest(result);
      setNewTenantName('');
      setNameChangeReason('');
      setShowNameChangeDialog(false);
      toast({
        title: 'Request Submitted',
        description: 'Your name change request has been submitted for admin approval.'
      });
    } catch (error) {
      console.error('Error submitting name change request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit name change request'
      });
    } finally {
      setIsSubmittingNameChange(false);
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

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="grid gap-6">
        <PageHeader title="Settings" description="Manage your shop's configuration and branding." />
        {hasUnsavedChanges && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-600" />
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">You have unsaved changes</p>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Shop Details</CardTitle>
                        <CardDescription>Update your shop&apos;s name and contact information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="shop-name">Shop Name</Label>
                            <Input 
                                id="shop-name" 
                                value={shopName} 
                                onChange={(e) => setShopName(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shop-logo">Shop Logo</Label>
                            <ImageUpload 
                                value={shopLogo}
                                onChange={setShopLogo}
                                previewSize="sm"
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Tenant Name</CardTitle>
                        <CardDescription>Request to change your tenant name (requires admin approval).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingNameChangeStatus ? (
                            <Skeleton className="h-10 w-full" />
                        ) : nameChangeRequest && nameChangeRequest.status && ['pending', 'approved', 'scheduled', 'auto_approved'].includes(String(nameChangeRequest.status)) ? (
                            <div className="space-y-2">
                                <div className="text-sm">
                                    <p className="font-medium">Active Request</p>
                                    <p className="text-muted-foreground text-xs">{currentTenantName} → {String(nameChangeRequest.newName)}</p>
                                </div>
                                <div>
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(String(nameChangeRequest.status))}`}>
                                        {String(nameChangeRequest.status).replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                {nameChangeRequest.status === 'rejected' && nameChangeRequest.rejectionReason ? (
                                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-2">
                                        <p className="text-xs font-medium text-red-800 dark:text-red-200">Reason:</p>
                                        <p className="text-xs text-red-700 dark:text-red-300">{String(nameChangeRequest.rejectionReason)}</p>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <Button 
                                variant="outline" 
                                onClick={() => setShowNameChangeDialog(true)}
                            >
                                Request Name Change
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Receipt & Currency</CardTitle>
                        <CardDescription>Customize receipts and set your local currency and tax.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select value={currency} onValueChange={setCurrency} disabled={isSaving}>
                                    <SelectTrigger id="currency">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GHS">GHS (GH₵)</SelectItem>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax-rate">Tax Rate (%) <span className="text-xs text-muted-foreground">0-100</span></Label>
                                <Input 
                                    id="tax-rate" 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={taxRate} 
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                         </div>
                        <div className="space-y-2">
                            <Label htmlFor="receipt-header">Receipt Header</Label>
                            <Textarea 
                                id="receipt-header" 
                                placeholder="e.g., Thank you for shopping with us!" 
                                value={receiptHeader}
                                onChange={(e) => setReceiptHeader(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="receipt-footer">Receipt Footer</Label>
                            <Textarea 
                                id="receipt-footer" 
                                placeholder="e.g., Returns accepted within 30 days." 
                                value={receiptFooter}
                                onChange={(e) => setReceiptFooter(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={handleDiscard} 
                              disabled={isSaving || !hasUnsavedChanges}
                            >
                              Discard Changes
                            </Button>
                            <Button 
                              variant="default" 
                              onClick={handleSave} 
                              disabled={isSaving || !hasUnsavedChanges}
                            >
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
    
    <AlertDialog open={showNavigationWarning} onOpenChange={setShowNavigationWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to leave?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowNavigationWarning(false)}>Stay</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              setShowNavigationWarning(false);
              if (pendingNavigation) router.push(pendingNavigation);
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={showNameChangeDialog} onOpenChange={setShowNameChangeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Tenant Name Change</DialogTitle>
          <DialogDescription>
            Submit a request to change your tenant name. An admin will review and approve or reject your request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-name">Current Name</Label>
            <Input 
              id="current-name" 
              value={currentTenantName}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-name">New Name</Label>
            <Input 
              id="new-name" 
              placeholder="Enter new tenant name"
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              disabled={isSubmittingNameChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea 
              id="reason" 
              placeholder="e.g., Rebranding, correcting spelling, company name change"
              value={nameChangeReason}
              onChange={(e) => setNameChangeReason(e.target.value)}
              disabled={isSubmittingNameChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowNameChangeDialog(false)}
            disabled={isSubmittingNameChange}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitNameChange}
            disabled={isSubmittingNameChange}
          >
            {isSubmittingNameChange ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
