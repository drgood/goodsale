
'use client';
import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, ShoppingCart, Users, Package, ArrowRight, BarChartHorizontal, AlertTriangle, Crown, TrendingUp } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Sale, Product, User, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { getWeek, startOfMonth, startOfYear, getMonth, endOfYear, eachDayOfInterval, eachWeekOfInterval, format, parseISO, eachMonthOfInterval, startOfWeek, endOfWeek, endOfMonth, isToday, subMonths, subDays, startOfDay, endOfDay } from 'date-fns';
import { TrialBanner } from '@/components/trial-banner';

type Timeframe = 'day' | 'week' | 'month';

export default function DashboardPage() {
  const params = useParams();
  const tenantSubdomain = params.tenant as string;
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!tenantSubdomain) return;
      
      try {
        setIsLoading(true);

        // Fetch sales, products, users and customers from API
        const [salesRes, productsRes, usersRes, customersRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/products'),
          fetch('/api/users'),
          fetch('/api/customers')
        ]);

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setSales(salesData);
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [tenantSubdomain]);
  
  const [timeframe, setTimeframe] = useState<Timeframe>('day');

  const {
    totalRevenue,
    revenueChange,
    todaysRevenue,
    yesterdayRevenue,
    lowStockItems,
    newCustomers,
    previousMonthCustomers,
    recentSales,
    topProducts,
    chartData,
    topCashiers
  } = useMemo(() => {
    if (sales.length === 0) {
      return { 
        totalRevenue: 0, 
        revenueChange: null, 
        todaysRevenue: 0, 
        yesterdayRevenue: 0, 
        lowStockItems: 0, 
        newCustomers: 0, 
        previousMonthCustomers: 0, 
        recentSales: [], 
        topProducts: [], 
        chartData: [], 
        topCashiers: [] 
      };
    }
      
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const yesterday = subDays(now, 1);
    
    // Total Revenue (all time)
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    
    // This month vs last month revenue
    const thisMonthSales = sales.filter(s => {
      const saleDate = parseISO(s.createdAt);
      return saleDate >= currentMonthStart;
    });
    const lastMonthSales = sales.filter(s => {
      const saleDate = parseISO(s.createdAt);
      return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
    });
    
    const thisMonthRevenue = thisMonthSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const lastMonthRevenue = lastMonthSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    
    let revenueChange = null;
    if (lastMonthRevenue > 0) {
      const percentChange = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      revenueChange = percentChange;
    }
    
    // Today's vs Yesterday's revenue
    const todaysSales = sales.filter(s => isToday(parseISO(s.createdAt)));
    const yesterdaySales = sales.filter(s => {
      const saleDate = parseISO(s.createdAt);
      return saleDate >= startOfDay(yesterday) && saleDate <= endOfDay(yesterday);
    });
    
    const todaysRevenue = todaysSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const yesterdayRevenue = yesterdaySales.reduce((acc, sale) => acc + sale.totalAmount, 0);

    const lowStockItems = products.filter(p => p.stock < p.stockThreshold).length;
    
    // Calculate new customers this month vs last month
    const newCustomers = customers.filter(c => {
      const joinDate = new Date(c.joinedAt);
      return joinDate >= currentMonthStart;
    }).length;
    
    const previousMonthCustomers = customers.filter(c => {
      const joinDate = new Date(c.joinedAt);
      return joinDate >= lastMonthStart && joinDate <= lastMonthEnd;
    }).length;

    const recentSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    // Calculate top products based on sales
    const productSales: { [productId: string]: { product: Product, quantity: number, revenue: number } } = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            productSales[item.productId] = { product, quantity: 0, revenue: 0 };
          }
        }
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.quantity * item.price;
        }
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(ps => ps.product);
      
    // Chart Data Calculation
    let chartData: { name: string, total: number }[] = [];
    const referenceDate = sales.length > 0 ? parseISO(sales.reduce((latest, sale) => sale.createdAt > latest ? sale.createdAt : latest, sales[0].createdAt)) : new Date();

    
    if (timeframe === 'day') { // Show days of the week for the current week
      const weekStart = startOfWeek(referenceDate);
      const weekEnd = endOfWeek(referenceDate);
      const weekSales = sales.filter(s => {
          const saleDate = parseISO(s.createdAt);
          return saleDate >= weekStart && saleDate <= weekEnd;
      });
      const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      chartData = daysOfWeek.map(day => ({ name: format(day, 'EEE'), total: 0 }));
      weekSales.forEach(s => {
          const dayName = format(parseISO(s.createdAt), 'EEE');
          const dayData = chartData.find(d => d.name === dayName);
          if (dayData) dayData.total += s.totalAmount;
      });
    } else if (timeframe === 'week') { // Show weeks of the month for the current month
        const monthStart = startOfMonth(referenceDate);
        const monthEnd = endOfMonth(referenceDate);
        const monthSales = sales.filter(s => {
            const saleDate = parseISO(s.createdAt);
            return saleDate >= monthStart && saleDate <= monthEnd;
        });
        
        const weeksOfMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
        chartData = weeksOfMonth.map((_, i) => ({ name: `Week ${i+1}`, total: 0 }));

        monthSales.forEach(s => {
            const saleDate = parseISO(s.createdAt);
            const weekOfMonthIndex = getWeek(saleDate, { weekStartsOn: 1 }) - getWeek(startOfMonth(saleDate), { weekStartsOn: 1 });
            if(chartData[weekOfMonthIndex] !== undefined) {
                chartData[weekOfMonthIndex].total += s.totalAmount;
            }
        });
    } else { // month - shows months of the year
        const yearStart = startOfYear(referenceDate);
        const yearEnd = endOfYear(referenceDate);
        const yearSales = sales.filter(s => {
            const saleDate = parseISO(s.createdAt);
            return saleDate >= yearStart && saleDate <= yearEnd;
        });
        
        const monthsOfYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        chartData = monthsOfYear.map(month => ({ name: format(month, 'MMM'), total: 0 }));
        
        yearSales.forEach(s => {
            const monthIndex = getMonth(parseISO(s.createdAt));
            if(chartData[monthIndex]) {
                chartData[monthIndex].total += s.totalAmount;
            }
        });
    }
    
    // Top Cashiers Calculation
    const cashierSales: { [cashierId: string]: { user: User, total: number } } = {};
    sales.forEach(sale => {
      if (!cashierSales[sale.cashierId]) {
        const cashier = users.find(u => u.id === sale.cashierId);
        if (cashier) {
          cashierSales[sale.cashierId] = { user: cashier, total: 0 };
        }
      }
      if (cashierSales[sale.cashierId]) {
        cashierSales[sale.cashierId].total += sale.totalAmount;
      }
    });

    const topCashiers = Object.values(cashierSales).sort((a, b) => b.total - a.total).slice(0, 3);


    return { 
      totalRevenue, 
      revenueChange, 
      todaysRevenue, 
      yesterdayRevenue, 
      lowStockItems, 
      newCustomers, 
      previousMonthCustomers, 
      recentSales, 
      topProducts, 
      chartData, 
      topCashiers 
    };

  }, [sales, products, users, customers, timeframe]);
  
  // Guards after all hooks
  if (!tenantSubdomain) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to determine tenant. Please access the dashboard via your tenant URL.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You must be signed in to view this dashboard. Please log in again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // Cashier View
  if (currentUser?.role === 'Cashier') {
    return (
      <>
        <PageHeader title={`Welcome, ${currentUser.name.split(' ')[0]}!`} description="Your daily overview." />
        <TrialBanner tenant={tenantSubdomain} />
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col items-center justify-center text-center p-6">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Ready to Sell?</CardTitle>
                    <CardDescription>Start your shift or jump right into making sales.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href={`/${tenantSubdomain}/pos`}>
                        <Button size="lg" className="w-full text-lg py-8">
                            Go to Point of Sale
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Today&apos;s Top Performers</CardTitle>
                     <CardDescription>Cashiers with the highest sales volume today.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableBody>
                            {topCashiers.map(({user, total}, index) => (
                                <TableRow key={user.id}>
                                     <TableCell>
                                        <div className="flex items-center gap-3">
                                            {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                                            <Image src={user.avatarUrl || '/placeholder.png'} alt={user.name} width={40} height={40} className="rounded-full aspect-square object-cover" />
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.role}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        GH₵{total.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </>
    );
  }

  // Owner/Manager View
  return (
    <>
      <PageHeader title={`Welcome, ${currentUser?.name.split(' ')[0]}!`} description="Here's a summary of your shop's performance.">
        <Link href={`/${tenantSubdomain}/reports`}>
          <Button variant="outline" size="sm" className="h-7 gap-1">
            <BarChartHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">View All Reports</span>
          </Button>
        </Link>
      </PageHeader>
      <TrialBanner tenant={tenantSubdomain} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={`GH₵${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
          icon={DollarSign} 
          change={revenueChange !== null ? `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last month` : undefined}
          changeType={revenueChange !== null ? (revenueChange >= 0 ? 'increase' : 'decrease') : undefined}
        />
        <StatCard 
          title="Today's Revenue" 
          value={`GH₵${todaysRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          change={yesterdayRevenue > 0 ? `${todaysRevenue >= yesterdayRevenue ? '+' : ''}${(((todaysRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)}% vs yesterday` : undefined}
          changeType={todaysRevenue >= yesterdayRevenue ? 'increase' : 'decrease'}
        />
        <StatCard 
          title="New Customers" 
          value={`+${newCustomers}`} 
          icon={Users} 
          change={previousMonthCustomers > 0 ? `${newCustomers >= previousMonthCustomers ? '+' : ''}${(((newCustomers - previousMonthCustomers) / previousMonthCustomers) * 100).toFixed(1)}% vs last month` : undefined}
          changeType={newCustomers >= previousMonthCustomers ? 'increase' : 'decrease'}
        />
        <StatCard 
          title="Low Stock Items" 
          value={`${lowStockItems}`} 
          icon={AlertTriangle} 
          change={lowStockItems > 0 ? `${lowStockItems} items need attention` : 'Stock levels healthy'} 
          changeType={lowStockItems > 0 ? "decrease" : "increase"} 
        />
      </div>
      <div className="grid gap-4 mt-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline">Revenue Overview</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant={timeframe === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe('day')}>Week</Button>
                <Button variant={timeframe === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe('week')}>Month</Button>
                <Button variant={timeframe === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe('month')}>Year</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `GH₵${value / 1000}k`}
                  />
                  <Tooltip
                      contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          borderColor: 'hsl(var(--border))' 
                      }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Top Selling Products</CardTitle>
                    <CardDescription>Your best performing products this month.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            {topProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Image src={product.imageUrl || '/placeholder.png'} alt={product.name} width={40} height={40} className="rounded-md aspect-square object-cover" />
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        GH₵{product.price.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Top Performers</CardTitle>
                     <CardDescription>Your best performing cashiers by sales volume.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableBody>
                            {topCashiers.map(({user, total}, index) => (
                                <TableRow key={user.id}>
                                     <TableCell>
                                        <div className="flex items-center gap-3">
                                            {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                                            <Image src={user.avatarUrl || '/placeholder.png'} alt={user.name} width={40} height={40} className="rounded-full aspect-square object-cover" />
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.role}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        GH₵{total.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
