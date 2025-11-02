import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db, tenants as tenantsTable } from "@/db";
import { Building2, DollarSign, Users, Activity } from "lucide-react";
import { desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    // Fetch all tenants from database
    const allTenants = await db
        .select()
        .from(tenantsTable)
        .orderBy(desc(tenantsTable.createdAt));

    const totalTenants = allTenants.length;
    const activeTenants = allTenants.filter(t => t.status === 'active').length;
    const totalPlatformRevenue = allTenants.reduce((acc, t) => acc + Number(t.totalSales), 0);

    const recentTenants = allTenants.slice(0, 5);
    const totalUsers = allTenants.reduce((acc, t) => acc + (t.userCount || 0), 0);
    return (
        <>
            <PageHeader title="Super Admin Dashboard" description="Overview of the GoodSale platform." />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Tenants" value={totalTenants.toString()} icon={Building2} change={`+${activeTenants} active`} changeType="increase" />
                <StatCard title="Platform Revenue" value={`GH₵${(totalPlatformRevenue / 1_000_000).toFixed(2)}M`} icon={DollarSign} change="+12.5%" changeType="increase" />
                <StatCard title="Total Users" value={totalUsers.toLocaleString()} icon={Users} />
                <StatCard title="System Status" value="Operational" icon={Activity} change="All systems normal" changeType="increase" />
            </div>
            <div className="grid gap-4 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Recently Joined Tenants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tenant Name</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                                    <TableHead className="text-right">Joined On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTenants.map(tenant => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>
                                            <div className="font-medium">{tenant.name}</div>
                                            <div className="hidden text-sm text-muted-foreground md:inline">
                                                {tenant.subdomain}.goodsale.app
                                            </div>
                                        </TableCell>
                                        <TableCell>{tenant.plan}</TableCell>
                                        <TableCell className="hidden sm:table-cell capitalize font-medium text-muted-foreground">{tenant.status}</TableCell>
                                        <TableCell className="text-right">{tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
