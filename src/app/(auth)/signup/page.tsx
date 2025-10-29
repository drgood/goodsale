
'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoodSaleLogo } from "@/components/goodsale-logo"
import Link from "next/link";
import { useRouter } from "next/navigation"
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/context/user-context';
import type { Tenant, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { tenants, setTenants, users, setUsers, setCurrentUser } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const shopName = formData.get('shopName') as string;
    const subdomain = (formData.get('subdomain') as string).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Basic validation
    if (tenants.some(t => t.subdomain === subdomain)) {
        toast({ variant: 'destructive', title: 'Subdomain taken', description: 'That subdomain is already in use. Please choose another.' });
        setIsLoading(false);
        return;
    }
    if (users.some(u => u.email === email)) {
        toast({ variant: 'destructive', title: 'Email in use', description: 'An account with that email already exists.' });
        setIsLoading(false);
        return;
    }

    setTimeout(() => {
      // Create new tenant
      const newTenant: Tenant = {
        id: `t${tenants.length + 10}`,
        name: shopName,
        subdomain: subdomain,
        plan: 'Starter',
        status: 'active',
        createdAt: new Date().toISOString(),
        userCount: 1,
        productCount: 0,
        totalSales: 0,
      };
      
      // Create new user
      const newUser: User = {
        id: `u${users.length + 100}`,
        tenantId: newTenant.id,
        name: name,
        email: email,
        role: 'Owner',
        avatarUrl: `https://picsum.photos/seed/user${users.length + 10}/100/100`,
        status: 'active',
      };
      
      // Update state
      setTenants(prev => [newTenant, ...prev]);
      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);

      toast({
        title: "Account Created!",
        description: "Welcome to GoodSale! We're redirecting you to your new dashboard.",
      });

      router.push(`/${newTenant.subdomain}/dashboard`);

    }, 1000);
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <GoodSaleLogo className="mb-4" />
        <CardTitle className="font-headline text-2xl">Create Your Account</CardTitle>
        <CardDescription>Get started with GoodSale and manage your business in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
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
