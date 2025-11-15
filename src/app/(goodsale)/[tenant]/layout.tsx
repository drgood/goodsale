'use client';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/header";
import { TenantSidebar } from "@/components/tenant-sidebar";
import { ShiftProvider } from "@/components/shift-manager";
import { usePathname } from 'next/navigation';

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.endsWith('/login') || pathname?.endsWith('/signup');

  // If on auth page, render without layout
  if (isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        {children}
      </div>
    );
  }

  // Regular layout for authenticated pages
  return (
    <SidebarProvider defaultOpen>
      <ShiftProvider>
        <TenantSidebar />
        <SidebarInset>
          <Header />
          <main className="p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </ShiftProvider>
    </SidebarProvider>
  );
}
