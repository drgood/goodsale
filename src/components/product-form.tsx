
'use client'
import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/image-upload";
import type { Product, Category, Supplier } from "@/lib/types";

type ProductFormProps = {
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    productToEdit?: Product | null;
    categories: Category[];
    suppliers: Supplier[];
    submitButtonText?: string;
};

export function ProductForm({ onSubmit, onCancel, productToEdit, categories, suppliers, submitButtonText = "Save Product" }: ProductFormProps) {
    const [imageUrl, setImageUrl] = useState(productToEdit?.imageUrl || '');
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set('imageUrl', imageUrl);
        onSubmit(e);
    };
    
    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto px-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" defaultValue={productToEdit?.name} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sku" className="text-right">SKU</Label>
                <Input id="sku" name="sku" defaultValue={productToEdit?.sku} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select name="category" required defaultValue={productToEdit?.categoryName}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">Supplier</Label>
                <Select name="supplier" required defaultValue={productToEdit?.supplierName}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.name}>{supplier.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={productToEdit?.price} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="costPrice" className="text-right">Cost Price</Label>
                <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue={productToEdit?.costPrice} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Stock</Label>
                <Input id="stock" name="stock" type="number" defaultValue={productToEdit?.stock} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockThreshold" className="text-right">Stock Threshold</Label>
                <Input id="stockThreshold" name="stockThreshold" type="number" defaultValue={productToEdit?.stockThreshold} className="col-span-3" required />
            </div>
            {productToEdit && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-status" className="text-right">Status</Label>
                    <Select name="status" required defaultValue={productToEdit?.status}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Image</Label>
                <div className="col-span-3">
                    <ImageUpload 
                        value={imageUrl}
                        onChange={setImageUrl}
                        previewSize="sm"
                    />
                    <input type="hidden" name="imageUrl" value={imageUrl} />
                </div>
            </div>
            <DialogFooter className='mt-4'>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{submitButtonText}</Button>
            </DialogFooter>
        </form>
    );
}
