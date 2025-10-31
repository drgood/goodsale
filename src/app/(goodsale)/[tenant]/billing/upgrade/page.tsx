'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
}

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const { toast } = useToast();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('1_month');
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        router.push('../billing');
        return;
      }

      try {
        const response = await fetch('/api/plans');
        if (response.ok) {
          const plans = await response.json();
          const selectedPlan = plans.find((p: Plan) => p.id === planId);
          if (selectedPlan) {
            setPlan(selectedPlan);
          } else {
            toast({
              variant: 'destructive',
              title: 'Plan not found',
              description: 'The selected plan could not be found.',
            });
            router.push('../billing');
          }
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Unable to load plan details.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [planId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/subscription/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan?.id,
          billingPeriod,
          contactInfo,
          totalAmount: totalPrice.toFixed(2),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit upgrade request');
      }
      
      toast({
        title: 'Request Submitted Successfully!',
        description: 'Our team will contact you within 24 hours to arrange cash payment.',
      });

      // Redirect back to billing after a short delay
      setTimeout(() => {
        router.push('../billing');
      }, 2000);
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to submit upgrade request. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading plan details...</p>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const billingPeriods = [
    { value: '1_month', label: '1 Month', discount: 0 },
    { value: '6_months', label: '6 Months', discount: 10 },
    { value: '12_months', label: '12 Months (1 Year)', discount: 20 },
    { value: '24_months', label: '24 Months (2 Years)', discount: 30 },
  ];

  const selectedPeriod = billingPeriods.find(p => p.value === billingPeriod);
  // Remove any non-numeric characters except decimal point
  const cleanPrice = plan.price.replace(/[^0-9.]/g, '');
  const basePrice = parseFloat(cleanPrice) || 0;
  const discountedPrice = basePrice * (1 - (selectedPeriod?.discount || 0) / 100);
  const months = billingPeriod === '1_month' ? 1 : billingPeriod === '6_months' ? 6 : billingPeriod === '12_months' ? 12 : 24;
  const totalPrice = discountedPrice * months;

  return (
    <>
      <PageHeader
        title="Upgrade Subscription"
        description="Complete your subscription upgrade"
      >
        <Link href="../billing">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Billing
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Billing Period</Label>
              <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label} {period.discount > 0 && `(${period.discount}% off)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Price:</span>
                <span>GH₵{plan.price}</span>
              </div>
              {selectedPeriod && selectedPeriod.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 mb-2">
                  <span>Discount ({selectedPeriod.discount}%):</span>
                  <span>-GH₵{((basePrice - discountedPrice) * months).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>GH₵{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm font-semibold mb-2">Features:</p>
              <ul className="space-y-2">
                {plan.features && plan.features.length > 0 ? (
                  plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">No features listed</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Our team will reach out to you to complete the payment and activate your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message (Optional)</Label>
                <Textarea
                  id="message"
                  rows={4}
                  placeholder="Any special requirements or questions..."
                  value={contactInfo.message}
                  onChange={(e) => setContactInfo({ ...contactInfo, message: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  Payment Method: Cash Only
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
                  <strong>Next Steps:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>Submit this form to request the upgrade</li>
                  <li>Our team will contact you within 24 hours</li>
                  <li>Make cash payment at our office or arrange collection</li>
                  <li>Your subscription will be activated immediately after payment confirmation</li>
                </ol>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                  Note: You can continue using your trial until payment is completed.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Submitting...' : 'Submit Upgrade Request'}
                </Button>
                <Link href="../billing">
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
