
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/header";
import { TenantSidebar } from "@/components/tenant-sidebar";
import { ShiftProvider } from "@/components/shift-manager";
import { UserProvider } from "@/context/user-context";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <SidebarProvider defaultOpen>
        <ShiftProvider>
          <TenantSidebar />
          <SidebarInset>
            <Header />
            <main className="p-4 lg:p-6">{children}</main>
          </SidebarInset>
        </ShiftProvider>
      </SidebarProvider>
    </UserProvider>
  );
}
