import { db, superAdmins } from "@/db";
import AdminUsersClient from "./AdminUsersClient";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const rows = await db.select({ id: superAdmins.id, name: superAdmins.name, email: superAdmins.email, status: superAdmins.status, lastLogin: superAdmins.lastLogin, createdAt: superAdmins.createdAt }).from(superAdmins);
  const initialAdmins = rows.map(a => ({ ...a }));
  return <AdminUsersClient initialAdmins={initialAdmins} />;
}
