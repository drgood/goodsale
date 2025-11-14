
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
import { signIn, useSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password.",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Login Successful",
        description: "Redirecting to your shop...",
      });

      // Force session refresh to get user data
      await fetch('/api/auth/session');
      const sessionResponse = await fetch('/api/auth/session');
      const session = await sessionResponse.json();

      const tenantId = session.user?.tenantId;
      if (!tenantId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to determine tenant.",
        });
        setIsLoading(false);
        return;
      }

      const tenantResponse = await fetch(`/api/tenants/${tenantId}`);
      if (!tenantResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to fetch tenant details.",
        });
        setIsLoading(false);
        return;
      }

      const tenant = await tenantResponse.json();
      const tenantSlug = tenant.subdomain;

      // Redirect to tenant's dashboard
      if (process.env.NODE_ENV === 'production') {
        const protocol = window.location.protocol;
        window.location.href = `${protocol}//${tenantSlug}.goodsale.online/dashboard`;
      } else {
        router.push(`/${tenantSlug}/dashboard`);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    // Google OAuth can be configured later
    toast({
      title: "Coming Soon",
      description: "Google login will be available soon.",
    });
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center">
        <GoodSaleLogo className="mb-4" />
        <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to access your shop&apos;s dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="owner@gshop.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          </div>
          <Button type="submit" className="w-full !mt-6" variant="default" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Log In'}
          </Button>
          <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
            Login with Google
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>Don&apos;t have an account? <Link href="/signup" className="underline font-semibold ml-1">Sign up</Link></p>
      </CardFooter>
    </Card>
  );
}
