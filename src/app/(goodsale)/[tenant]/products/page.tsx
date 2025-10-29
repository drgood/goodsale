
'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, File, ListFilter, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product, Category, Supplier } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/components/product-form';

type ProductStatus = Product['status'];

export default function ProductsPage() {
    const { toast } = useToast();
    const params = useParams();
    const tenantSubdomain = params.tenant as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [statusFilters, setStatusFilters] = useState<ProductStatus[]>(['active', 'draft']);

    // Fetch data from API
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/categories'),
                    fetch('/api/suppliers')
                ]);

                if (productsRes.ok) {
                    const productsData = await productsRes.json();
                    setProducts(productsData);
                }
                if (categoriesRes.ok) {
                    const categoriesData = await categoriesRes.json();
                    setCategories(categoriesData);
                }
                if (suppliersRes.ok) {
                    const suppliersData = await suppliersRes.json();
                    setSuppliers(suppliersData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => statusFilters.includes(p.status));
    }, [products, statusFilters]);

    const handleFilterChange = (status: ProductStatus) => {
        setStatusFilters(prev => 
          prev.includes(status) 
            ? prev.filter(s => s !== status)
            : [...prev, status]
        );
    };

    const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        
        const imageUrl = formData.get('imageUrl') as string || `https://picsum.photos/seed/${formData.get("sku")}/400/300`;

        const categoryName = formData.get("category") as string;
        const supplierName = formData.get("supplier") as string;
        const category = categories.find(c => c.name === categoryName);
        const supplier = suppliers.find(s => s.name === supplierName);

        const productData = {
            name: formData.get("name") as string,
            sku: formData.get("sku") as string,
            categoryId: category?.id || null,
            supplierId: supplier?.id || null,
            price: parseFloat(formData.get("price") as string),
            costPrice: parseFloat(formData.get("costPrice") as string),
            stock: parseInt(formData.get("stock") as string, 10),
            stockThreshold: parseInt(formData.get("stockThreshold") as string, 10),
            imageUrl: imageUrl,
            imageHint: 'product image',
            status: 'draft' as const,
        };
        
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const newProduct = await response.json();
                setProducts([{
                    ...newProduct,
                    categoryName: category?.name,
                    supplierName: supplier?.name,
                    price: parseFloat(newProduct.price),
                    costPrice: parseFloat(newProduct.costPrice)
                }, ...products]);
                setIsAddProductDialogOpen(false);
                form.reset();
                toast({ title: "Product Added", description: `"${productData.name}" has been added to your inventory.` });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to add product' });
            }
        } catch (error) {
            console.error('Error adding product:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add product' });
        }
      };
    
    const handleEditProduct = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!productToEdit) return;

        const formData = new FormData(event.currentTarget);
        const imageUrl = formData.get('imageUrl') as string || productToEdit.imageUrl;

        const categoryName = formData.get("category") as string;
        const supplierName = formData.get("supplier") as string;
        const category = categories.find(c => c.name === categoryName);
        const supplier = suppliers.find(s => s.name === supplierName);

        const updateData = {
            name: formData.get("name") as string,
            sku: formData.get("sku") as string,
            categoryId: category?.id || null,
            supplierId: supplier?.id || null,
            price: parseFloat(formData.get("price") as string),
            costPrice: parseFloat(formData.get("costPrice") as string),
            stock: parseInt(formData.get("stock") as string, 10),
            stockThreshold: parseInt(formData.get("stockThreshold") as string, 10),
            status: formData.get("status") as ProductStatus,
            imageUrl: imageUrl,
        };

        try {
            const response = await fetch(`/api/products/${productToEdit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updated = await response.json();
                const updatedProduct = {
                    ...updated,
                    categoryName: category?.name,
                    supplierName: supplier?.name,
                    price: parseFloat(updated.price),
                    costPrice: parseFloat(updated.costPrice)
                };
                setProducts(products.map(p => p.id === productToEdit.id ? updatedProduct : p));
                setIsEditProductDialogOpen(false);
                setProductToEdit(null);
                toast({ title: "Product Updated", description: `"${updateData.name}" has been updated.` });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product' });
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product' });
        }
    };

    const handleDuplicateProduct = async (product: Product) => {
        const duplicateData = {
            name: `${product.name} (Copy)`,
            sku: `${product.sku}-COPY`,
            categoryId: product.categoryId,
            supplierId: product.supplierId,
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            stockThreshold: product.stockThreshold,
            imageUrl: product.imageUrl,
            imageHint: product.imageHint,
            status: 'draft' as const,
        };
        
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(duplicateData)
            });

            if (response.ok) {
                const newProduct = await response.json();
                setProducts([{
                    ...newProduct,
                    categoryName: product.categoryName,
                    supplierName: product.supplierName,
                    price: parseFloat(newProduct.price),
                    costPrice: parseFloat(newProduct.costPrice)
                }, ...products]);
                toast({ title: "Product Duplicated", description: `A copy of "${product.name}" has been created.` });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to duplicate product' });
            }
        } catch (error) {
            console.error('Error duplicating product:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to duplicate product' });
        }
    };
    
    const openEditDialog = (product: Product) => {
        setProductToEdit(product);
        setIsEditProductDialogOpen(true);
    };

    const confirmDeleteProduct = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            const response = await fetch(`/api/products/${productToDelete.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setProducts(products.filter(p => p.id !== productToDelete.id));
                toast({ title: "Product Deleted", description: `"${productToDelete.name}" has been removed.` });
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product' });
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product' });
        }
    };
    
    const handleExport = () => {
        const headers = ["id", "tenantId", "name", "sku", "categoryName", "supplierName", "price", "costPrice", "stock", "stockThreshold", "imageUrl", "imageHint", "status"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + filteredProducts.map(p => {
                return headers.map(header => {
                    // @ts-ignore
                    const value = p[header as keyof Product] ?? '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(",");
            }).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `products_export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Export Successful", description: "Your products have been exported to CSV." });
    };
    
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').slice(1);
            const productsToImport = [];
            
            for (const line of lines) {
                if (!line.trim()) continue;
                const [name, sku, priceStr, stockStr] = line.split(',');
                const price = parseFloat(priceStr);
                const stock = parseInt(stockStr, 10);
                
                if (name && sku && !isNaN(price) && !isNaN(stock)) {
                    productsToImport.push({
                        name,
                        sku,
                        price,
                        costPrice: 0,
                        stock,
                        stockThreshold: 10,
                        categoryId: null,
                        supplierId: null,
                        imageUrl: `https://picsum.photos/seed/${sku}/400/300`,
                        imageHint: 'product image',
                        status: 'draft' as const,
                    });
                }
            }

            try {
                const imported = [];
                for (const productData of productsToImport) {
                    const response = await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productData)
                    });
                    
                    if (response.ok) {
                        const newProduct = await response.json();
                        imported.push({
                            ...newProduct,
                            price: parseFloat(newProduct.price),
                            costPrice: parseFloat(newProduct.costPrice)
                        });
                    }
                }

                setProducts([...imported, ...products]);
                setIsImportDialogOpen(false);
                toast({ title: "Import Successful", description: `${imported.length} products have been imported.` });
            } catch (error) {
                console.error('Error importing products:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to import products' });
            }
        };
        reader.readAsText(file);
    };

  if (isLoading) {
    return <div className="flex flex-col gap-4"><p>Loading...</p></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Products" description="Manage your products and inventory.">
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('active')} onCheckedChange={() => handleFilterChange('active')}>
                        Active
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('draft')} onCheckedChange={() => handleFilterChange('draft')}>
                        Draft
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('archived')} onCheckedChange={() => handleFilterChange('archived')}>
                        Archived
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 gap-1">
                        <Upload className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Import</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Import Products</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file to add products in bulk. The file should have columns for name, sku, price, and stock.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleImport} />
                        <p className="text-xs text-muted-foreground mt-1">
                            Required columns: name, sku, price, stock.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={handleExport}>
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
            </Button>
            <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-7 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Product</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new product to your inventory.
                    </DialogDescription>
                    </DialogHeader>
                    <ProductForm
                        onSubmit={handleAddProduct}
                        onCancel={() => setIsAddProductDialogOpen(false)}
                        categories={categories}
                        suppliers={suppliers}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Cost Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={product.imageUrl || '/placeholder-product.png'}
                      width="64"
                      data-ai-hint={product.imageHint || undefined}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'secondary' : product.status === 'archived' ? 'outline' : 'default'}>
                        {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">GH₵{product.price.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">GH₵{product.costPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.stock <= product.stockThreshold ? "destructive" : "outline"}>
                        {product.stock}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem onSelect={() => openEditDialog(product)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDuplicateProduct(product)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => confirmDeleteProduct(product)}
                        >
                            Delete
                        </DropdownMenuItem>
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
            Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                    Update the details for &quot;{productToEdit?.name}&quot;.
                </DialogDescription>
            </DialogHeader>
            <ProductForm
                onSubmit={handleEditProduct}
                onCancel={() => {
                    setIsEditProductDialogOpen(false);
                    setProductToEdit(null);
                }}
                productToEdit={productToEdit}
                categories={categories}
                suppliers={suppliers}
                submitButtonText='Save Changes'
            />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product
                    &quot;{productToDelete?.name}&quot;.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
