"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLogin: string | null;
  createdAt: string | null;
};

export default function AdminUsersClient({ initialAdmins }: { initialAdmins: AdminUser[] }) {
  const [admins] = useState<AdminUser[]>(Array.isArray(initialAdmins) ? initialAdmins : []);

  return (
    <div className="grid gap-6">
      <PageHeader title="Admin Users" description="Manage super admin users." />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Super Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={admin.status === "active" ? "default" : "secondary"}>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : "Never"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
