'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link";
import { useRouter, useParams } from "next/navigation"
import { useToast } from '@/hooks/use-toast';
import { signIn } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
}

export default function TenantLoginPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  
  // Fetch tenant info by subdomain
  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const response = await fetch(`/api/tenants/by-subdomain/${tenantSlug}`);
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (response.ok && isJson) {
          const tenant = await response.json();
          setTenantInfo(tenant);
        } else {
          console.error('Unexpected tenant response', {
            status: response.status,
            contentType,
          });
          toast({
            variant: "destructive",
            title: "Tenant Not Found",
            description: "This shop doesn't exist or could not be loaded.",
          });
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to load shop information.",
        });
      } finally {
        setIsLoadingTenant(false);
      }
    };

    fetchTenantInfo();
  }, [tenantSlug, router, toast]);
  
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
        
        // Redirect to dashboard
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
      setIsLoading(false);
    }
  }

  if (isLoadingTenant) {
    return (
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <Skeleton className="h-12 w-32 mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tenantInfo) {
    return null;
  }

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="text-3xl font-bold text-primary">
            {tenantInfo.name}
          </div>
        </div>
        <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={isLoading} 
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isLoading} 
            />
          </div>
          <Button type="submit" className="w-full !mt-6" variant="default" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Log In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>Don&apos;t have an account? <Link href="/signup" className="underline font-semibold ml-1">Sign up</Link></p>
      </CardFooter>
    </Card>
  );
}
