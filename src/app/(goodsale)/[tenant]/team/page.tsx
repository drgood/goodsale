
'use client'
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function TeamPage() {
  const { toast } = useToast();
  const params = useParams();
  const { data: session } = useSession();
  const currentUser = session?.user;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const addUserFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load team members."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role: role.toLowerCase(), password: 'password123' })
      });

      if (response.ok) {
        await fetchUsers();
        setIsAddUserDialogOpen(false);
        if (addUserFormRef.current) {
          addUserFormRef.current.reset();
        }
        toast({ title: "User Added", description: `${name} has been added to the team with default password.` });
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add user."
      });
    }
  };

  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userToEdit) return;

    const formData = new FormData(event.currentTarget);
    const newRole = formData.get("role") as string;
    
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userToEdit.id, role: newRole.toLowerCase() })
      });

      if (response.ok) {
        await fetchUsers();
        setIsEditDialogOpen(false);
        setUserToEdit(null);
        toast({ title: "User Updated", description: `${userToEdit.name}'s role has been changed to ${newRole}.` });
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user."
      });
    }
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    if (userToDelete.id === currentUser?.id) {
      toast({
        variant: 'destructive',
        title: "Action Denied",
        description: "You cannot remove yourself from the team."
      });
      setIsDeleteDialogOpen(false);
      return;
    }
    
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userToDelete.id })
      });

      if (response.ok) {
        await fetchUsers();
        toast({ variant: 'destructive', title: "User Removed", description: `"${userToDelete.name}" has been removed from the team.` });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove user."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Team Management" description="Manage your team members and their roles.">
        <Dialog open={isAddUserDialogOpen} onOpenChange={(open) => {
          setIsAddUserDialogOpen(open);
          if (!open && addUserFormRef.current) {
            addUserFormRef.current.reset();
          }
        }}>
        <DialogTrigger asChild>
            <Button size="sm" className="h-7 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add User</span>
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
                Create a new user account for your team. They will be able to log in immediately.
            </DialogDescription>
            </DialogHeader>
            <form ref={addUserFormRef} onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" required defaultValue="Cashier">
                <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add User</Button>
            </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[80px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} className={user.id === currentUser?.id ? 'bg-muted/50' : ''}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt="User avatar"
                        className="aspect-square rounded-full object-cover"
                        height="40"
                        src={user.avatarUrl || '/placeholder.png'}
                        width="40"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                        <div>{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Owner' ? 'default' : user.role === 'Manager' ? 'secondary' : 'outline' }>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize">
                      {user.id === currentUser?.id ? <Badge variant="secondary">Active Session</Badge> : "Active"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" disabled={user.role === 'Owner'}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => openEditDialog(user)}>Edit Role</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => confirmDeleteUser(user)}>Remove from team</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{users?.length ?? 0}</strong> of <strong>{users?.length ?? 0}</strong> users
          </div>
        </CardFooter>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {userToEdit?.name}</DialogTitle>
            <DialogDescription>
              Update the role for this user.
            </DialogDescription>
          </DialogHeader>
          {userToEdit && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select name="role" required defaultValue={userToEdit.role}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the user
              &quot;{userToDelete?.name}&quot; from your team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
