
'use client';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageHeader } from "@/components/page-header";
import { notFound } from 'next/navigation';
import { StatCard } from '@/components/stat-card';
import { DollarSign, Package, Users, ShoppingCart, ArrowLeft, Loader2, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Tenant } from '@/lib/types';

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
}

interface TenantSale {
  id: string;
  totalAmount: string | number;
  cashierName?: string;
  createdAt: string | Date;
}

interface TenantDetails {
  tenant: Tenant;
  users: TenantUser[];
  recentSales: TenantSale[];
  stats: {
    totalUsers: number;
    totalSales: number;
  };
}

export default function TenantDetailsPage() {
    const params = useParams();
    const { tenantId } = params as { tenantId: string };
    const router = useRouter();
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [data, setData] = useState<TenantDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [newPlan, setNewPlan] = useState<string>('');
    const [isChangingPlan, setIsChangingPlan] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (!session?.user.isSuperAdmin || !tenantId) return;

        const fetchTenantDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/admin/tenants/${tenantId}`);
                if (!response.ok) throw new Error('Failed to fetch tenant details');
                const tenantData = await response.json();
                setData(tenantData);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'Failed to load tenant details',
                });
                notFound();
            } finally {
                setIsLoading(false);
            }
        };

        fetchTenantDetails();
    }, [session?.user.isSuperAdmin, tenantId, router, toast]);

    const handleOpenPlanDialog = () => {
        if (data) {
            setNewPlan(data.tenant.plan);
            setIsPlanDialogOpen(true);
        }
    };

    const handleChangePlan = async () => {
        if (!data || newPlan === data.tenant.plan) {
            setIsPlanDialogOpen(false);
            return;
        }

        setIsChangingPlan(true);
        try {
            const response = await fetch(`/api/admin/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: newPlan }),
            });

            if (!response.ok) throw new Error('Failed to update plan');

            const updated = await response.json();
            setData({
                ...data,
                tenant: updated
            });
            setIsPlanDialogOpen(false);
            toast({
                title: "Plan Updated",
                description: `Plan changed to ${newPlan}.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update plan',
            });
        } finally {
            setIsChangingPlan(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!data) {
        notFound();
    }

    const tenant = data.tenant;
    const tenantUsers = data.users;
    const tenantSales = data.recentSales;

    
    return (
        <>
        <div className="grid gap-6">
            <PageHeader 
                title={tenant.name}
                description={`Details for ${tenant.subdomain}.goodsale.app`}
            >
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        className="h-7 gap-1"
                        onClick={handleOpenPlanDialog}
                    >
                        Change Plan
                    </Button>
                    <Link href="/admin/tenants">
                        <Button variant="outline" size="sm" className="h-7 gap-1">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Back to Tenants</span>
                        </Button>
                    </Link>
                </div>
            </PageHeader>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`GH₵${Number(tenant.totalSales).toLocaleString()}`} icon={DollarSign} />
                <StatCard title="Products" value={tenant.productCount?.toString() || '0'} icon={Package} />
                <StatCard title="Users" value={data.stats.totalUsers.toString()} icon={Users} />
                <StatCard title="Total Sales" value={data.stats.totalSales.toString()} icon={ShoppingCart} />
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Billing Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-4">
                                <CreditCard className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Subscription Plan</p>
                                    <p className="text-lg font-semibold">{tenant.plan}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Member Since</p>
                                    <p className="text-lg font-semibold">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <DollarSign className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Monthly Recurring</p>
                                    <p className="text-lg font-semibold">Pending Setup</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Payment Method:</span>
                                <span className="font-medium">Not configured</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Billing Email:</span>
                                <span className="font-medium">admin@{tenant.subdomain}.goodsale.app</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Next Renewal:</span>
                                <span className="font-medium">{new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Tenant Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenantUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image src={user.avatarUrl || '/placeholder.png'} alt={user.name} width={40} height={40} className="rounded-full aspect-square object-cover" />
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'Owner' ? 'default' : user.role === 'Manager' ? 'secondary' : 'outline' }>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell capitalize">
                                            {user.status}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sale ID</TableHead>
                                    <TableHead>Cashier</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenantSales.map(sale => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-mono text-xs">{sale.id.substring(0, 12)}...</TableCell>
                                    <TableCell>{sale.cashierName}</TableCell>
                                    <TableCell className="text-right">GH₵{typeof sale.totalAmount === 'number' ? sale.totalAmount.toFixed(2) : parseFloat(sale.totalAmount as string).toFixed(2)}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>

        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Subscription Plan</DialogTitle>
                    <DialogDescription>
                        Update the subscription plan for {tenant.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Current Plan: <span className="font-semibold">{data.tenant.plan}</span></Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="plan-select">New Plan</Label>
                        <Select value={newPlan} onValueChange={setNewPlan} disabled={isChangingPlan}>
                            <SelectTrigger id="plan-select">
                                <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Starter">Starter</SelectItem>
                                <SelectItem value="Growth">Growth</SelectItem>
                                <SelectItem value="Enterprise">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={() => setIsPlanDialogOpen(false)}
                        disabled={isChangingPlan}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleChangePlan}
                        disabled={isChangingPlan || newPlan === data.tenant.plan}
                    >
                        {isChangingPlan ? 'Updating...' : 'Update Plan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
