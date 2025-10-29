'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, PlusCircle, Loader2, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLogin?: Date;
  createdAt?: Date;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState<string | null>(null);
  const [adminToEdit, setAdminToEdit] = useState<SuperAdmin | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user.isSuperAdmin) return;

    const fetchAdmins = async () => {
      setIsLoadingAdmins(true);
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to fetch admins');
        const data = await response.json();
        setAdmins(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load admin users',
        });
      } finally {
        setIsLoadingAdmins(false);
      }
    };

    fetchAdmins();
  }, [session?.user.isSuperAdmin, toast]);

  const openEditDialog = (admin: SuperAdmin) => {
    setAdminToEdit(admin);
    setIsEditDialogOpen(true);
  };

  const handleAddAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingAdmin(true);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create admin');
      }

      const newAdmin = await response.json();
      setAdmins([...admins, newAdmin]);
      form.reset();
      setIsAddDialogOpen(false);
      toast({
        title: "Admin Created",
        description: `"${name}" has been added as a super admin.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create admin',
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleEditAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToEdit) return;
    setIsEditingAdmin(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const status = formData.get("status") as string;

    try {
      const response = await fetch(`/api/admin/users/${adminToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ...(password && { password }),
          status,
        }),
      });

      if (!response.ok) throw new Error('Failed to update admin');

      const updated = await response.json();
      setAdmins(admins.map(a => a.id === adminToEdit.id ? updated : a));
      setIsEditDialogOpen(false);
      setAdminToEdit(null);
      toast({
        title: "Admin Updated",
        description: `"${name}" has been successfully updated.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update admin',
      });
    } finally {
      setIsEditingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    setIsDeletingAdmin(adminId);

    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete admin');

      setAdmins(admins.filter(a => a.id !== adminId));
      toast({
        variant: 'destructive',
        title: 'Admin Deleted',
        description: `"${adminName}" has been removed.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete admin',
      });
    } finally {
      setIsDeletingAdmin(null);
    }
  };

  return (
    <div>
      <PageHeader title="Admin Users" description="Manage super admin accounts and permissions.">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Admin</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Create a new super admin account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name</Label>
                <Input id="add-name" name="name" placeholder="e.g., John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" name="email" type="email" placeholder="admin@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">Password</Label>
                <Input id="add-password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAddingAdmin}>
                  {isAddingAdmin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Admin
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Super Admins</CardTitle>
          <CardDescription>Manage platform administrators</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No admin users yet
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map(admin => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(admin)}
                            disabled={isEditingAdmin || isDeletingAdmin === admin.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                            disabled={isDeletingAdmin === admin.id}
                          >
                            {isDeletingAdmin === admin.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin: {adminToEdit?.name}</DialogTitle>
            <DialogDescription>
              Update admin details and permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={adminToEdit?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={adminToEdit?.email} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (leave empty to keep current)</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={adminToEdit?.status}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isEditingAdmin}>
                {isEditingAdmin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
