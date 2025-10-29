
'use client'
import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus, DollarSign } from "lucide-react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/lib/types";
import { StatCard } from "@/components/stat-card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";

export default function CustomerInsightsPage() {
    const params = useParams();
    const tenantSubdomain = params.tenant as string;
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/customers');
                if (response.ok) {
                    const data = await response.json();
                    setCustomers(data);
                }
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const {
        totalCustomers,
        newCustomers,
        avgSpend,
        topCustomers,
        chartData
    } = useMemo(() => {
        const totalCustomers = customers.length;

        const newCustomers = customers.filter(c => {
            const joinDate = new Date(c.joinedAt);
            const today = new Date();
            return joinDate.getMonth() === today.getMonth() && joinDate.getFullYear() === today.getFullYear();
        }).length;
        
        const totalSpent = customers.reduce((acc, c) => acc + c.totalSpent, 0);
        const avgSpend = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

        const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
        
        const chartData = topCustomers.map(c => ({
            name: c.name.split(' ')[0], // Use first name for chart
            total: c.totalSpent
        })).sort((a,b) => b.total - a.total);

        return { totalCustomers, newCustomers, avgSpend, topCustomers, chartData };
    }, [customers]);

    return (
        <div className="grid gap-6">
            <PageHeader title="Customer Insights Report" description="Reports on customer loyalty and spending habits.">
                <Link href={`/${tenantSubdomain}/reports`}>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Back to Reports</span>
                    </Button>
                </Link>
            </PageHeader>
            
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Customers" value={totalCustomers.toString()} icon={Users} />
                <StatCard title="New Customers (This Month)" value={newCustomers.toString()} icon={UserPlus} />
                <StatCard title="Average Spend" value={`GH₵${avgSpend.toFixed(2)}`} icon={DollarSign} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="font-headline">Top Customer Spending</CardTitle>
                        <CardDescription>Comparison of spending by your top 5 customers.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `GH₵${value / 1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-headline">Top Customers List</CardTitle>
                        <CardDescription>Your most valuable customers based on total spending.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topCustomers.map(customer => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image src={customer.avatarUrl || '/placeholder.png'} alt={customer.name} width={40} height={40} className="rounded-full aspect-square object-cover" />
                                                <div>
                                                    <div className="font-medium">{customer.name}</div>
                                                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">GH₵{customer.totalSpent.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
