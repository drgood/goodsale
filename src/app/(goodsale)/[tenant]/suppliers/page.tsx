
'use client'
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import type { Supplier } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function SuppliersPage() {
    const { toast } = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/suppliers');
            if (response.ok) {
                const data = await response.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load suppliers."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const name = formData.get("name") as string;
        
        try {
            const response = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                await fetchSuppliers();
                form.reset();
                setIsAddDialogOpen(false);
                toast({ title: "Supplier Added", description: `"${name}" has been created.` });
            } else {
                throw new Error('Failed to create supplier');
            }
        } catch (error) {
            console.error('Error adding supplier:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add supplier."
            });
        }
    };

    const openEditDialog = (supplier: Supplier) => {
        setSupplierToEdit(supplier);
        setIsEditDialogOpen(true);
    };

    const handleEditSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!supplierToEdit) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name") as string;
        
        try {
            const response = await fetch('/api/suppliers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: supplierToEdit.id, name })
            });

            if (response.ok) {
                await fetchSuppliers();
                setIsEditDialogOpen(false);
                setSupplierToEdit(null);
                toast({ title: "Supplier Updated", description: `The supplier has been renamed to "${name}".` });
            } else {
                throw new Error('Failed to update supplier');
            }
        } catch (error) {
            console.error('Error updating supplier:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update supplier."
            });
        }
    };

    const confirmDeleteSupplier = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteSupplier = async () => {
        if (!supplierToDelete) return;
        
        try {
            const response = await fetch('/api/suppliers', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: supplierToDelete.id })
            });

            if (response.ok) {
                await fetchSuppliers();
                toast({ title: "Supplier Deleted", description: `"${supplierToDelete.name}" has been removed.` });
                setIsDeleteDialogOpen(false);
                setSupplierToDelete(null);
            } else {
                throw new Error('Failed to delete supplier');
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete supplier."
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading suppliers...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader title="Suppliers" description="Manage your product suppliers.">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-7 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Supplier</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                        <DialogDescription>
                            Add a new supplier to your list.
                        </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSupplier} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Supplier Name</Label>
                            <Input id="name" name="name" placeholder="e.g., Global Imports" required />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Create Supplier</Button>
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
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Products</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell className="text-right">{supplier.productCount}</TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => openEditDialog(supplier)}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onSelect={() => confirmDeleteSupplier(supplier)}>Delete</DropdownMenuItem>
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
                    Showing <strong>1-{suppliers.length}</strong> of <strong>{suppliers.length}</strong> suppliers
                </div>
                </CardFooter>
            </Card>

             {/* Edit Supplier Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Supplier: {supplierToEdit?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSupplier} className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="edit-name">Supplier Name</Label>
                        <Input id="edit-name" name="name" defaultValue={supplierToEdit?.name} required />
                        </div>
                        <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. Deleting &quot;{supplierToDelete?.name}&quot; will remove it from all associated products.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
