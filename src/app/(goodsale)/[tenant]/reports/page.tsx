
'use client'
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, TrendingUp, BarChart, History, UserMinus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ReportsPage() {
    const params = useParams();
    const tenantId = params.tenant as string;
    
    const reports = [
        {
            title: "Sales Report",
            description: "Detailed breakdown of all sales transactions.",
            icon: FileText,
            href: `/${tenantId}/reports/sales`
        },
        {
            title: "Product Performance",
            description: "Analytics on your best and worst selling products.",
            icon: TrendingUp,
            href: `/${tenantId}/reports/products`
        },
        {
            title: "Customer Insights",
            description: "Reports on customer loyalty and spending habits.",
            icon: Users,
            href: `/${tenantId}/reports/customers`
        },
        {
            title: "Inventory Report",
            description: "View current stock levels and inventory valuation.",
            icon: BarChart,
            href: `/${tenantId}/reports/inventory`
        },
        {
            title: "Debtors Report",
            description: "Track all customers with an outstanding balance.",
            icon: UserMinus,
            href: `/${tenantId}/reports/debtors`
        },
        {
            title: "Shift Reports",
            description: "Review end-of-day summaries from cashiers.",
            icon: History,
            href: `/${tenantId}/reports/shifts`
        }
    ];

    return (
        <div>
            <PageHeader title="Reports" description="Generate and view detailed reports for your business." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <Link href={report.href} key={report.title}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardHeader>
                                <report.icon className="h-8 w-8 text-primary mb-2" />
                                <CardTitle className="font-headline">{report.title}</CardTitle>
                                <CardDescription>{report.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
