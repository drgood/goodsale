
import { db, tenants as tenantsTable } from "@/db";
import { desc } from "drizzle-orm";
import TenantsClient from "./TenantsClient";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
    // Server-side fetch of tenants for fast initial render
    const rows = await db
        .select()
        .from(tenantsTable)
        .orderBy(desc(tenantsTable.createdAt));

    // Normalize to a serializable shape expected by the client component
    const initialTenants = rows.map((t: any) => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        plan: (t.plan || '').toString(),
        status: (t.status || 'active') as 'active' | 'suspended' | 'deleted',
        userCount: Number(t.userCount || 0),
        productCount: Number(t.productCount || 0),
        totalSales: Number(t.totalSales || 0),
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    }));

    return <TenantsClient initialTenants={initialTenants} />;
}
