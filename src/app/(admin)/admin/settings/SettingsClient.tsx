"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsClient({ initialSettings }: { initialSettings: { platformName: string; currency: string; taxRate: string; enforceMfa: boolean } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState(initialSettings.platformName);
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [taxRate, setTaxRate] = useState(initialSettings.taxRate);
  const [mfa, setMfa] = useState(initialSettings.enforceMfa);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformName, currency, taxRate: parseFloat(taxRate), enforceMfa: mfa }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      toast({ title: "Settings Saved", description: "Your changes to the system settings have been saved." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="System Settings" description="Manage global configuration for the GoodSale platform." />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Platform Branding</CardTitle>
              <CardDescription>Update the platform's name and logo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-logo">Platform Logo</Label>
                <Input id="platform-logo" type="file" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Configuration</CardTitle>
              <CardDescription>Manage default settings for new tenants and system-wide security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Localization & Tax</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghs">GHS (GH₵)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="jpy">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Security</h3>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label htmlFor="mfa">Enforce MFA</Label>
                    <p className="text-xs text-muted-foreground">Require all users to use multi-factor authentication.</p>
                  </div>
                  <Switch id="mfa" checked={mfa} onCheckedChange={setMfa} aria-label="Enforce multi-factor authentication" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="default" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save All Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
