
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoodSaleLogo } from "@/components/goodsale-logo"
import Link from "next/link";
import { useRouter } from "next/navigation"
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { signIn } from 'next-auth/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Plan {
  id: string;
  name: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');

  // Fetch plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
          if (data.length > 0) {
            setSelectedPlan(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    };
    fetchPlans();
  }, []);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const shopName = formData.get('shopName') as string;
    const subdomain = (formData.get('subdomain') as string).toLowerCase().replace(/[^a-z0-9]/g, '');
    const planId = selectedPlan;

    // Basic validation
    if (!name.trim() || !email.trim() || !password || !shopName.trim() || !subdomain) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Call signup API to create tenant and user in database
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          shopName,
          subdomain,
          planId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create account');
      }

      const result = await response.json();

      toast({
        title: "Account Created!",
        description: "Welcome to GoodSale! Signing you in now.",
      });

      // Sign in the new user
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      // Redirect to tenant dashboard
      router.push(`/${result.subdomain}/dashboard`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMsg);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <GoodSaleLogo className="mb-4" />
        <CardTitle className="font-headline text-2xl">Create Your Account</CardTitle>
        <CardDescription>Get started with GoodSale and manage your business in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSignup} className="space-y-4">
          <p className="text-sm font-medium">Your Details</p>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="John Doe" required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required disabled={isLoading} minLength={8} />
          </div>

          <Separator className="!my-6" />

          <p className="text-sm font-medium">Your Shop's Details</p>
           <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input id="shopName" name="shopName" placeholder="My Awesome Shop" required disabled={isLoading} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
             <div className="flex items-center">
                <Input id="subdomain" name="subdomain" placeholder="myshop" className="rounded-r-none" required disabled={isLoading} />
                <span className="flex items-center h-10 rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">.goodsale.app</span>
            </div>
            <p className="text-xs text-muted-foreground">This will be your shop's unique web address.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plan">Subscription Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger id="plan" disabled={isLoading}>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">You can change this later in your billing settings.</p>
          </div>
          
          <Button type="submit" className="w-full !mt-6" variant="default" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>Already have an account? <Link href="/login" className="underline font-semibold ml-1">Log in</Link></p>
      </CardFooter>
    </Card>
  );
}
