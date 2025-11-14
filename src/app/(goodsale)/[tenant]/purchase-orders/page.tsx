
'use client';
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Search, X, PackagePlus, Trash2, CheckCircle, Truck, Eye, Edit } from "lucide-react";
import type { PurchaseOrder, PurchaseOrderItem, Supplier, Product, Category } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ProductForm } from "@/components/product-form";
import { useParams } from 'next/navigation';

export default function PurchaseOrdersPage() {
    const { toast } = useToast();
    const params = useParams();
    const tenantSubdomain = params.tenant as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Dialog and Form State
    const [isCreateOrEditDialogOpen, setIsCreateOrEditDialogOpen] = useState(false);
    const [poToEdit, setPoToEdit] = useState<PurchaseOrder | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

    // Details/Action Dialogs State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [poForDetails, setPoForDetails] = useState<PurchaseOrder | null>(null);
    const [isReceiveConfirmOpen, setIsReceiveConfirmOpen] = useState(false);
    const [poToReceive, setPoToReceive] = useState<PurchaseOrder | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [productsRes, posRes, suppliersRes, categoriesRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/purchase-orders'),
                fetch('/api/suppliers'),
                fetch('/api/categories')
            ]);

            if (productsRes.ok) setProducts(await productsRes.json());
            if (posRes.ok) setPurchaseOrders(await posRes.json());
            if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
            if (categoriesRes.ok) setCategories(await categoriesRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load data."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const availableProductsForPo = useMemo(() => {
        if (!selectedSupplier) return [];
        const supplierProducts = products.filter(p => p.supplierName === selectedSupplier.name && p.status === 'active');
        
        if (!productSearchTerm) {
            return supplierProducts;
        }

        return supplierProducts.filter(p => 
            p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
        );

    }, [selectedSupplier, products, productSearchTerm]);

    const handleAddPoItem = (product: Product) => {
        if (poItems.some(item => item.productId === product.id)) {
            toast({
                variant: 'destructive',
                title: 'Product already added',
                description: 'This product is already in the purchase order.'
            });
            return;
        }
        const newItem: PurchaseOrderItem = {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            costPrice: product.costPrice,
        };
        setPoItems([...poItems, newItem]);
    };
    
    const handleUpdatePoItem = (productId: string, field: 'quantity' | 'costPrice', value: number) => {
        if (value < 0) return;
        setPoItems(poItems.map(item => item.productId === productId ? { ...item, [field]: value } : item));
    };

    const handleRemovePoItem = (productId: string) => {
        setPoItems(poItems.filter(item => item.productId !== productId));
    };

    const totalCost = useMemo(() => {
        return poItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
    }, [poItems]);

    const resetCreateForm = () => {
        setSelectedSupplier(null);
        setPoItems([]);
        setProductSearchTerm("");
        setPoToEdit(null);
        setIsCreateOrEditDialogOpen(false);
    }
    
    const handleCreateOrUpdatePo = async () => {
        if (!selectedSupplier || poItems.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Incomplete PO',
                description: 'Please select a supplier and add at least one item.'
            });
            return;
        }
        
        try {
            if (poToEdit) {
                // Update existing PO
                const response = await fetch('/api/purchase-orders', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: poToEdit.id,
                        status: poToEdit.status,
                        items: poItems,
                        totalCost: totalCost
                    })
                });

                if (response.ok) {
                    await fetchData();
                    toast({
                        title: 'Purchase Order Updated',
                        description: `${poToEdit.poNumber} has been successfully updated.`
                    });
                } else {
                    throw new Error('Failed to update PO');
                }
            } else {
                // Create new PO
                const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, '0')}`;
                const response = await fetch('/api/purchase-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supplierId: selectedSupplier.id,
                        poNumber,
                        status: 'Draft',
                        items: poItems,
                        totalCost
                    })
                });

                if (response.ok) {
                    await fetchData();
                    toast({
                        title: 'Purchase Order Created',
                        description: `${poNumber} has been saved as a draft.`
                    });
                } else {
                    const errorData = await response.json();
                    console.error('Server error:', errorData);
                    throw new Error(errorData.details || 'Failed to create PO');
                }
            }
            
            resetCreateForm();
        } catch (error) {
            console.error('Error saving PO:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save purchase order."
            });
        }
    };

    const openEditDialog = (poToEdit: PurchaseOrder) => {
        if (poToEdit.status !== 'Draft') {
            toast({ variant: 'destructive', title: 'Action not allowed', description: 'Only draft purchase orders can be edited.'})
            return;
        }
        setPoToEdit(poToEdit);
        setSelectedSupplier(suppliers.find(s => s.id === poToEdit.supplierId) || null);
        setPoItems(poToEdit.items);
        setIsCreateOrEditDialogOpen(true);
    };

    const handleUpdatePoStatus = async (poId: string, status: PurchaseOrder['status']) => {
        try {
            const po = purchaseOrders.find(p => p.id === poId);
            if (!po) return;

            const response = await fetch('/api/purchase-orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: poId,
                    status,
                    items: po.items,
                    totalCost: po.totalCost
                })
            });

            if (response.ok) {
                await fetchData();
                toast({ title: "Status Updated", description: `PO has been marked as ${status}.` });
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update status."
            });
        }
    };

    const handleConfirmReceiveStock = (po: PurchaseOrder) => {
        setPoToReceive(po);
setIsReceiveConfirmOpen(true);
    };

    const handleReceiveStock = async () => {
        if (!poToReceive) return;
        
        await handleUpdatePoStatus(poToReceive.id, 'Received');
        
        toast({
            title: "Stock Received!",
            description: `Inventory has been updated from ${poToReceive.poNumber}.`
        });

        setIsReceiveConfirmOpen(false);
        setPoToReceive(null);
    };

    const handleConfirmDelete = (po: PurchaseOrder) => {
        setPoToDelete(po);
        setIsDeleteConfirmOpen(true);
    };

    const handleDeletePo = async () => {
        if (!poToDelete) return;
        
        try {
            const response = await fetch('/api/purchase-orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: poToDelete.id })
            });

            if (response.ok) {
                await fetchData();
                toast({
                    variant: "destructive",
                    title: "PO Deleted",
                    description: `${poToDelete.poNumber} has been removed.`
                });
                setIsDeleteConfirmOpen(false);
                setPoToDelete(null);
            } else {
                throw new Error('Failed to delete PO');
            }
        } catch (error) {
            console.error('Error deleting PO:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete purchase order."
            });
        }
    };

    const openDetailsDialog = (po: PurchaseOrder) => {
        setPoForDetails(po);
        setIsDetailsOpen(true);
    };

    const handleAddProductOnTheFly = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        if (!selectedSupplier) return;

        const imageFile = formData.get('image') as File;
        let imageUrl = `https://picsum.photos/seed/${formData.get("sku")}/400/300`;
        if (imageFile && imageFile.size > 0) {
            imageUrl = URL.createObjectURL(imageFile);
        }

        const categoryName = formData.get("category") as string;
        const supplierName = formData.get("supplier") as string;
        const category = categories.find(c => c.name === categoryName);
        const supplier = suppliers.find(s => s.name === supplierName);

        const newProduct: Product = {
            id: `p${products.length + 100}`,
            tenantId: tenant.id,
            name: formData.get("name") as string,
            sku: formData.get("sku") as string,
            categoryId: category?.id || null,
            categoryName: categoryName,
            supplierId: supplier?.id || null,
            supplierName: supplierName,
            price: parseFloat(formData.get("price") as string),
            costPrice: parseFloat(formData.get("costPrice") as string),
            stock: parseInt(formData.get("stock") as string, 10),
            stockThreshold: parseInt(formData.get("stockThreshold") as string, 10),
            imageUrl: imageUrl,
            imageHint: 'product image',
            status: 'draft',
        };

        setProducts([newProduct, ...products]);
        handleAddPoItem(newProduct);
        
        toast({ title: "Product Added", description: `"${newProduct.name}" created and added to the PO.` });
        setIsAddProductDialogOpen(false);
        form.reset();
    };

    return (
        <div className="flex flex-col gap-4">
            <PageHeader title="Purchase Orders" description="Create and manage your inventory restock orders.">
                 <Dialog open={isCreateOrEditDialogOpen} onOpenChange={(isOpen) => {
                     if (!isOpen) resetCreateForm();
                     setIsCreateOrEditDialogOpen(isOpen);
                 }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-7 gap-1">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Create PO</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{poToEdit ? `Edit Purchase Order: ${poToEdit.poNumber}` : 'Create New Purchase Order'}</DialogTitle>
                            <DialogDescription>
                                {poToEdit ? 'Update the items and quantities for this PO.' : 'Select a supplier, add products, and specify quantities to create a new PO.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier-select">1. Select Supplier</Label>
                                    <Select 
                                        onValueChange={(supplierId) => setSelectedSupplier(suppliers.find(s => s.id === supplierId) || null)}
                                        disabled={!!poToEdit}
                                        value={selectedSupplier?.id}
                                    >
                                        <SelectTrigger id="supplier-select">
                                            <SelectValue placeholder="Select a supplier to begin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label>2. Add Products to Order</Label>
                                     <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={!selectedSupplier} className="h-7 gap-1">
                                                <PlusCircle className="h-3.5 w-3.5" />
                                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Create Product</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create New Product</DialogTitle>
                                                <DialogDescription>
                                                   This will add a new product to your catalog and this PO. The supplier will be set to &quot;{selectedSupplier?.name}&quot;.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <ProductForm 
                                                onSubmit={handleAddProductOnTheFly}
                                                onCancel={() => setIsAddProductDialogOpen(false)}
                                                categories={categories}
                                                suppliers={suppliers}
                                                submitButtonText="Create and Add to PO"
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products..."
                                        className="pl-8"
                                        value={productSearchTerm}
                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                        disabled={!selectedSupplier}
                                    />
                                </div>
                                <ScrollArea className="rounded-md border flex-1">
                                    {selectedSupplier ? (
                                        <div className="p-2 space-y-1">
                                        {availableProductsForPo.length > 0 ? availableProductsForPo.map(p => (
                                            <div key={p.id} onClick={() => handleAddPoItem(p)} className="p-2 rounded-md hover:bg-muted flex justify-between items-center cursor-pointer">
                                                <div>
                                                    <p className="font-medium">{p.name}</p>
                                                    <p className="text-sm text-muted-foreground">SKU: {p.sku} &bull; Stock: {p.stock}</p>
                                                </div>
                                                <p className="text-sm">Cost: GH₵{p.costPrice.toFixed(2)}</p>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-muted-foreground p-4 text-center">
                                                {productSearchTerm ? "No products match your search." : "No products found for this supplier."}
                                            </p>
                                        )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-sm text-muted-foreground p-4 text-center">Please select a supplier to see their products.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
                                <h3 className="font-headline text-lg">Order Summary</h3>
                                <ScrollArea className="flex-1 -mx-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="px-4">Product</TableHead>
                                                <TableHead className="w-[100px]">Qty</TableHead>
                                                <TableHead className="w-[120px]">Cost/Item</TableHead>
                                                <TableHead className="text-right w-[50px] px-4"><span className="sr-only">Remove</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {poItems.length > 0 ? poItems.map(item => (
                                                <TableRow key={item.productId}>
                                                    <TableCell className="font-medium text-sm px-4">{item.productName}</TableCell>
                                                    <TableCell className="px-1">
                                                        <Input type="number" value={item.quantity} onChange={(e) => handleUpdatePoItem(item.productId, 'quantity', parseInt(e.target.value) || 0)} className="h-8 w-full" min="1" />
                                                    </TableCell>
                                                    <TableCell className="px-1">
                                                        <Input type="number" value={item.costPrice.toFixed(2)} onChange={(e) => handleUpdatePoItem(item.productId, 'costPrice', parseFloat(e.target.value) || 0)} className="h-8 w-full" min="0" step="0.01" />
                                                    </TableCell>
                                                    <TableCell className="px-4">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemovePoItem(item.productId)}><X className="h-4 w-4 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">Select products to add them here.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                                {poItems.length > 0 && (
                                    <div className="mt-auto border-t pt-4 space-y-4">
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-muted-foreground font-medium">Total Order Cost:</span>
                                            <span className="text-2xl font-bold">GH₵{totalCost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={resetCreateForm}>Cancel</Button>
                            <Button onClick={handleCreateOrUpdatePo} disabled={poItems.length === 0}>
                                {poToEdit ? 'Save Changes' : 'Save as Draft'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.map((po) => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                                    <TableCell>{po.supplierName}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            po.status === 'Received' ? 'secondary' :
                                            po.status === 'Ordered' ? 'default' : 'outline'
                                        } className={cn(
                                            po.status === 'Received' && 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                                            po.status === 'Ordered' && 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                                            po.status === 'Draft' && 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                                        )}>{po.status}</Badge>
                                    </TableCell>
                                    <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">GH₵{po.totalCost.toFixed(2)}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => openDetailsDialog(po)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                {po.status === 'Draft' && (
                                                    <DropdownMenuItem onSelect={() => openEditDialog(po)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                )}
                                                {po.status === 'Draft' && (
                                                    <DropdownMenuItem onSelect={() => handleUpdatePoStatus(po.id, 'Ordered')}>
                                                        <Truck className="mr-2 h-4 w-4" /> Mark as Ordered
                                                    </DropdownMenuItem>
                                                )}
                                                {po.status === 'Ordered' && (
                                                    <DropdownMenuItem onSelect={() => handleConfirmReceiveStock(po)}>
                                                        <PackagePlus className="mr-2 h-4 w-4" /> Receive Stock
                                                    </DropdownMenuItem>
                                                )}
                                                {po.status === 'Draft' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onSelect={() => handleConfirmDelete(po)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Draft
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
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
                        Showing <strong>{purchaseOrders.length}</strong> of <strong>{purchaseOrders.length}</strong> purchase orders
                    </div>
                </CardFooter>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>PO Details: {poForDetails?.poNumber}</DialogTitle>
                        <DialogDescription>
                            Supplier: {poForDetails?.supplierName} &bull; Created: {poForDetails ? new Date(poForDetails.createdAt).toLocaleDateString() : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[50vh] pr-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {poForDetails?.items.map(item => (
                                    <TableRow key={item.productId}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">GH₵{item.costPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">GH₵{(item.quantity * item.costPrice).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total Cost</span>
                        <span>GH₵{poForDetails?.totalCost.toFixed(2)}</span>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isReceiveConfirmOpen} onOpenChange={setIsReceiveConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Receive Stock?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will add the quantities from PO {poToReceive?.poNumber} to your inventory. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPoToReceive(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReceiveStock}>Confirm & Receive Stock</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the draft PO {poToDelete?.poNumber}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPoToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePo} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
