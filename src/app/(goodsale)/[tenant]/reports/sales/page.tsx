
'use client'
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, DollarSign, ShoppingCart, Users, TrendingUp, File } from "lucide-react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const chartData = [
  { date: "Jan", sales: 12000 },
  { date: "Feb", sales: 18000 },
  { date: "Mar", sales: 15000 },
  { date: "Apr", sales: 22000 },
  { date: "May", sales: 25000 },
  { date: "Jun", sales: 21000 },
  { date: "Jul", sales: 28000 },
];

export default function SalesReportPage() {
    const params = useParams();
    const { toast } = useToast();
    const tenantSubdomain = params.tenant as string;
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        fetchSales();
    }, []);
    
    const fetchSales = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/sales');
            if (response.ok) {
                const data = await response.json();
                setSales(data);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load sales data."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const {
        tenantSales,
        totalRevenue,
        totalProfit,
        totalSalesCount,
        avgSaleValue,
        recentSales
    } = useMemo(() => {
        const tenantSales = sales;

        const totalRevenue = tenantSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalProfit = tenantSales.reduce((acc, s) => acc + s.totalProfit, 0);
        const totalSalesCount = tenantSales.length;
        const avgSaleValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
        
        const recentSales = [...tenantSales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
        
        return { tenantSales, totalRevenue, totalProfit, totalSalesCount, avgSaleValue, recentSales };
    }, [sales]);

    const handleExport = () => {
        const headers = ["id", "cashierName", "createdAt", "itemCount", "paymentMethod", "totalAmount", "discountAmount", "totalProfit"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + tenantSales.map(s => [
                s.id,
                `"${s.cashierName}"`,
                s.createdAt,
                s.itemCount,
                s.paymentMethod,
                s.totalAmount,
                s.discountAmount || 0,
                s.totalProfit,
            ].join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Export Successful", description: "Your sales report has been downloaded." });
      };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading sales report...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            <PageHeader title="Sales Report" description="A detailed breakdown of your sales performance.">
                 <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 gap-1" onClick={handleExport}>
                        <File className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                    </Button>
                    <Link href={`/${tenantSubdomain}/reports`}>
                        <Button variant="outline" size="sm" className="h-7 gap-1">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Back to Reports</span>
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`GH₵${totalRevenue.toLocaleString()}`} icon={DollarSign} change="+15%" changeType="increase" />
                <StatCard title="Total Profit" value={`GH₵${totalProfit.toLocaleString()}`} icon={DollarSign} change="+12%" changeType="increase" />
                <StatCard title="Total Sales" value={totalSalesCount.toString()} icon={ShoppingCart} change="+25%" changeType="increase" />
                <StatCard title="Avg. Sale Value" value={`GH₵${avgSaleValue.toFixed(2)}`} icon={TrendingUp} change="-2%" changeType="decrease" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Sales Over Time</CardTitle>
                    <CardDescription>Visual representation of sales trends for the current year.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `GH₵${value / 1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Transactions</CardTitle>
                    <CardDescription>A log of the 10 most recent sales.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sale ID</TableHead>
                                <TableHead>Cashier</TableHead>
                                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                                <TableHead className="text-right">Profit</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentSales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-mono text-xs">{sale.id.substring(0, 12)}...</TableCell>
                                    <TableCell>{sale.cashierName}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant="outline">{sale.paymentMethod}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">GH₵{sale.totalProfit.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">GH₵{sale.totalAmount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{recentSales.length}</strong> of <strong>{tenantSales.length}</strong> sales
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
