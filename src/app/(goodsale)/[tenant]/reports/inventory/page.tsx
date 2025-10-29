
'use client'
import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Archive, AlertTriangle, Package, DollarSign } from "lucide-react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from '@/lib/types';
import { StatCard } from '@/components/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function InventoryReportPage() {
    const params = useParams();
    const tenantSubdomain = params.tenant as string;
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data.filter((p: Product) => p.status === 'active'));
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const { 
        totalValue, 
        totalUnits, 
        lowStockCount, 
        outOfStockCount 
    } = useMemo(() => {
        const tenantProducts = products;
        
        const totalValue = tenantProducts.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
        const totalUnits = tenantProducts.reduce((acc, p) => acc + p.stock, 0);
        const lowStockCount = tenantProducts.filter(p => p.stock > 0 && p.stock <= p.stockThreshold).length;
        const outOfStockCount = tenantProducts.filter(p => p.stock === 0).length;

        return {
            totalValue,
            totalUnits,
            lowStockCount,
            outOfStockCount
        }
    }, [products]);

    return (
        <div className="grid gap-6">
            <PageHeader title="Inventory Report" description="View current stock levels and inventory valuation.">
                <Link href={`/${tenantSubdomain}/reports`}>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Back to Reports</span>
                    </Button>
                </Link>
            </PageHeader>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Inventory Value" 
                    value={`GH₵${totalValue.toLocaleString()}`} 
                    icon={DollarSign}
                    change='Based on cost price'
                />
                <StatCard 
                    title="Total Products (SKUs)" 
                    value={products.length.toString()}
                    icon={Package} 
                />
                <StatCard 
                    title="Low Stock Items" 
                    value={lowStockCount.toString()} 
                    icon={AlertTriangle}
                    changeType={lowStockCount > 0 ? 'decrease' : undefined}
                />
                 <StatCard 
                    title="Out of Stock Items" 
                    value={outOfStockCount.toString()} 
                    icon={Archive}
                    changeType={outOfStockCount > 0 ? 'decrease' : undefined}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Current Inventory Details</CardTitle>
                    <CardDescription>A complete list of all active products in your inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Cost Price</TableHead>
                                <TableHead className="text-center">Stock Level</TableHead>
                                <TableHead className="text-right">Stock Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image src={product.imageUrl || '/placeholder.png'} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                                            <span className="font-medium">{product.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                                    <TableCell>{product.categoryName || 'Uncategorized'}</TableCell>
                                    <TableCell className="text-right">GH₵{product.costPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={
                                            product.stock === 0 ? 'destructive' :
                                            product.stock <= product.stockThreshold ? 'default' : 'secondary'
                                        } className={cn(
                                            product.stock > product.stockThreshold && 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                                            product.stock <= product.stockThreshold && product.stock > 0 && 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                                        )}>
                                            {product.stock}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">GH₵{(product.costPrice * product.stock).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
