'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Link from "next/link";
import type { Tenant } from "@/lib/types";

export default function TenantsClient({ initialTenants }: { initialTenants: Tenant[] }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [tenants, setTenants] = useState<Tenant[]>(initialTenants || []);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isAddTenantDialogOpen, setIsAddTenantDialogOpen] = useState(false);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user.isSuperAdmin) return;
    if ((initialTenants?.length || 0) > 0) return;

    const fetchTenants = async () => {
      setIsLoadingTenants(true);
      try {
        const response = await fetch('/api/admin/tenants');
        if (!response.ok) throw new Error('Failed to fetch tenants');
        const data = await response.json();
        setTenants(data.data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tenants' });
      } finally {
        setIsLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [session?.user.isSuperAdmin, toast, initialTenants]);

  const handleAddTenant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingTenant(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const subdomain = formData.get("subdomain") as string;
    const plan = formData.get("plan") as string;

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subdomain, plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tenant');
      }

      const newTenant = await response.json();
      setTenants([newTenant, ...tenants]);
      setIsAddTenantDialogOpen(false);
      event.currentTarget.reset();
      toast({ title: "Tenant Added", description: `"${name}" has been successfully created.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to create tenant' });
    } finally {
      setIsAddingTenant(false);
    }
  };

  const handleToggleSuspend = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update tenant');

      const updated = await response.json();
      setTenants(tenants.map(t => t.id === tenantId ? updated : t));
      toast({ title: `Tenant ${newStatus === 'active' ? 'Unsuspended' : 'Suspended'}`, description: `"${tenant.name}" has been ${newStatus}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update tenant status' });
    }
  };

  const confirmDeleteTenant = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/tenants/${tenantToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete tenant');

      setTenants(tenants.filter(t => t.id !== tenantToDelete.id));
      toast({ variant: 'destructive', title: "Tenant Deleted", description: `"${tenantToDelete.name}" has been permanently removed.` });
      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete tenant' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tenants" description="Manage all tenants on the platform.">
        <Dialog open={isAddTenantDialogOpen} onOpenChange={setIsAddTenantDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Tenant</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant account on the platform.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tenant Name</Label>
                <Input id="name" name="name" placeholder="e.g., GShop Electronics" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input id="subdomain" name="subdomain" placeholder="e.g., gshop" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select name="plan" defaultValue="starter">
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddTenantDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAddingTenant}>
                  {isAddingTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Tenant'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search tenants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v: 'all' | 'active' | 'suspended') => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead className="hidden md:table-cell">Subdomain</TableHead>
                <TableHead className="hidden md:table-cell">Plan</TableHead>
                <TableHead className="hidden lg:table-cell">Users</TableHead>
                <TableHead className="hidden lg:table-cell">Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/tenants/${tenant.id}`} className="hover:underline">{tenant.name}</Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tenant.subdomain}.goodsale.app</TableCell>
                  <TableCell className="hidden md:table-cell capitalize">{tenant.plan}</TableCell>
                  <TableCell className="hidden lg:table-cell">{tenant.userCount?.toLocaleString?.() ?? tenant.userCount ?? 0}</TableCell>
                  <TableCell className="hidden lg:table-cell">{tenant.productCount?.toLocaleString?.() ?? tenant.productCount ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className={cn('capitalize', tenant.status !== 'active' && 'bg-yellow-500 text-white')}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleToggleSuspend(tenant.id)}>
                          {tenant.status === 'active' ? 'Suspend' : 'Unsuspend'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => confirmDeleteTenant(tenant)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-end text-sm text-muted-foreground">
          {isLoadingTenants ? 'Loading tenants...' : `${filteredTenants.length} of ${tenants.length}`}
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tenant and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTenant} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
