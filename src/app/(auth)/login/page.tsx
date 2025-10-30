
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

  const [email, setEmail] = useState('owner@gshop.com');
  const [password, setPassword] = useState('password123');
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
      } else {
        toast({
          title: "Login Successful",
          description: "Redirecting...",
        });
        
        // Force session refresh to get user data
        await fetch('/api/auth/session');
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        
        // Redirect based on role
        const tenantSlug = session.user?.tenantId || 'gshop';
        const role = session.user?.role || 'cashier';
        
        let redirectPath = `/${tenantSlug}/dashboard`;
        if (role === 'owner' || role === 'admin') {
          redirectPath = `/${tenantSlug}/dashboard/owner`;
        } else if (role === 'manager') {
          redirectPath = `/${tenantSlug}/dashboard/manager`;
        }
        
        router.push(redirectPath);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An error occurred. Please try again.",
      });
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
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Demo: <code className="font-mono">owner@gshop.com</code> / <code className="font-mono">password123</code>
        </p>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>Don&apos;t have an account? <Link href="/signup" className="underline font-semibold ml-1">Sign up</Link></p>
      </CardFooter>
    </Card>
  );
}
