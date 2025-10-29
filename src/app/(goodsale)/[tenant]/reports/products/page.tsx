
'use client'
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { StatCard } from "@/components/stat-card";
import type { Product, Sale } from "@/lib/types";

export default function ProductPerformancePage() {
    const params = useParams();
    const tenantSubdomain = params.tenant as string;
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, salesRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/sales')
                ]);
                
                if (productsRes.ok) {
                    const data = await productsRes.json();
                    setProducts(data);
                }
                
                if (salesRes.ok) {
                    const data = await salesRes.json();
                    setSales(data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const { topProducts, worstProducts, lowStockProducts, bestSeller, highestRevenue } = useMemo(() => {
        const tenantSales = sales;
        const tenantProducts = products;

        const productPerformance: Record<string, { product: Product, quantity: number, revenue: number }> = {};

        tenantProducts.forEach(product => {
            productPerformance[product.id] = { product, quantity: 0, revenue: 0 };
        });

        tenantSales.forEach(sale => {
            sale.items.forEach(item => {
                if (productPerformance[item.productId]) {
                    productPerformance[item.productId].quantity += item.quantity;
                    productPerformance[item.productId].revenue += item.quantity * item.price;
                }
            });
        });

        const performanceArray = Object.values(productPerformance);
        
        performanceArray.sort((a, b) => b.quantity - a.quantity);

        const topProducts = performanceArray.slice(0, 5);
        const worstProducts = [...performanceArray].sort((a, b) => a.quantity - b.quantity).slice(0, 5);
        const lowStockProducts = performanceArray.filter(p => p.product.stock <= p.product.stockThreshold && p.quantity > 0).sort((a,b) => a.product.stock - b.product.stock);

        const bestSeller = performanceArray.length > 0 ? performanceArray.reduce((prev, current) => (prev.quantity > current.quantity) ? prev : current) : null;
        const highestRevenue = performanceArray.length > 0 ? performanceArray.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current) : null;

        return { topProducts, worstProducts, lowStockProducts, bestSeller, highestRevenue };

    }, [products, sales]);

    return (
        <div className="grid gap-6">
            <PageHeader title="Product Performance Report" description="Analytics on your best and worst selling products.">
                <Link href={`/${tenantSubdomain}/reports`}>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Back to Reports</span>
                    </Button>
                </Link>
            </PageHeader>
            
            <div className="grid gap-4 md:grid-cols-2">
                <StatCard 
                    title="Best Selling Item" 
                    value={bestSeller ? bestSeller.product.name : 'N/A'} 
                    icon={TrendingUp}
                    change={bestSeller ? `${bestSeller.quantity} units sold` : ''} 
                />
                <StatCard 
                    title="Highest Revenue Product" 
                    value={highestRevenue ? highestRevenue.product.name : 'N/A'} 
                    icon={TrendingUp} 
                    change={highestRevenue ? `GH₵${highestRevenue.revenue.toLocaleString()} generated` : ''}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Top 5 Selling Products</CardTitle>
                    <CardDescription>Products ranked by the number of units sold.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Units Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topProducts.map(({ product, quantity, revenue }) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image src={product.imageUrl || '/placeholder.png'} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-sm text-muted-foreground">{product.sku}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{quantity}</TableCell>
                                    <TableCell className="text-right">GH₵{revenue.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><TrendingDown className="h-6 w-6 text-destructive" /> Slowest Selling Products</CardTitle>
                        <CardDescription>These products have the lowest sales volume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableBody>
                                {worstProducts.map(({ product, quantity }) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-right">{quantity} sold</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-yellow-500" /> Low Stock Items</CardTitle>
                        <CardDescription>Popular products that are running out of stock.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                {lowStockProducts.map(({ product }) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-right">{product.stock} left in stock</TableCell>
                                    </TableRow>
                                ))}
                                {lowStockProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">No popular items are low on stock.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
