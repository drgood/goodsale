import { db, platformSettings } from "@/db";
import SettingsClient from "./SettingsClient";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const rows = await db.select().from(platformSettings).limit(1);
  const s = rows[0] || {
    platformName: 'GoodSale',
    currency: 'ghs',
    taxRate: '8',
    enforceMfa: false,
  };
  const initial = {
    platformName: s.platformName || 'GoodSale',
    currency: s.currency || 'ghs',
    taxRate: String(s.taxRate ?? '8'),
    enforceMfa: !!s.enforceMfa,
  };
  return <SettingsClient initialSettings={initial} />;
}
