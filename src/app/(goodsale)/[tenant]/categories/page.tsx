
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
import type { Category } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load categories."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const name = formData.get("name") as string;
        
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                await fetchCategories();
                form.reset();
                setIsAddDialogOpen(false);
                toast({ title: "Category Added", description: `"${name}" has been created.` });
            } else {
                throw new Error('Failed to create category');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add category."
            });
        }
    };

    const openEditDialog = (category: Category) => {
        setCategoryToEdit(category);
        setIsEditDialogOpen(true);
    };

    const handleEditCategory = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!categoryToEdit) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name") as string;
        
        try {
            const response = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: categoryToEdit.id, name })
            });

            if (response.ok) {
                await fetchCategories();
                setIsEditDialogOpen(false);
                setCategoryToEdit(null);
                toast({ title: "Category Updated", description: `The category has been renamed to "${name}".` });
            } else {
                throw new Error('Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update category."
            });
        }
    };

    const confirmDeleteCategory = (category: Category) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        
        try {
            const response = await fetch('/api/categories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: categoryToDelete.id })
            });

            if (response.ok) {
                await fetchCategories();
                toast({ title: "Category Deleted", description: `"${categoryToDelete.name}" has been removed.` });
                setIsDeleteDialogOpen(false);
                setCategoryToDelete(null);
            } else {
                throw new Error('Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete category."
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading categories...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader title="Categories" description="Organize your products into categories.">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-7 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Category</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                            Create a new category to group your products.
                        </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input id="name" name="name" placeholder="e.g., Electronics" required />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Create Category</Button>
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
                        {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-right">{category.productCount}</TableCell>
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
                                <DropdownMenuItem onSelect={() => openEditDialog(category)}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onSelect={() => confirmDeleteCategory(category)}>Delete</DropdownMenuItem>
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
                    Showing <strong>1-{categories.length}</strong> of <strong>{categories.length}</strong> categories
                </div>
                </CardFooter>
            </Card>

             {/* Edit Category Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category: {categoryToEdit?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditCategory} className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="edit-name">Category Name</Label>
                        <Input id="edit-name" name="name" defaultValue={categoryToEdit?.name} required />
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
                        This action cannot be undone. Deleting &quot;{categoryToDelete?.name}&quot; will remove it from all associated products.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
