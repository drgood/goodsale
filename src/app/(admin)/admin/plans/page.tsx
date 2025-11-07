
import { db, plans as plansTable } from "@/db";
import PlansClient from "./PlansClient";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const rows = await db.select().from(plansTable);
  const initialPlans = rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    features: Array.isArray(p.features)
      ? p.features
      : (typeof p.features === 'string'
          ? (() => { try { const parsed = JSON.parse(p.features); return Array.isArray(parsed) ? parsed : String(p.features).split('\n').filter((x: string) => x.trim()); } catch { return String(p.features).split('\n').filter((x: string) => x.trim()); } })()
          : []),
    isCurrent: !!p.isCurrent,
  }));

  return <PlansClient initialPlans={initialPlans} />;
}
