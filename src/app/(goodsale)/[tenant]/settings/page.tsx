
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
                        <CardDescription>Update your shop's name and contact information.</CardDescription>
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
    </>
  );
}
