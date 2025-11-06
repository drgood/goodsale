
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  UserCircle,
  Users,
  FileText,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { GoodSaleLogo } from "./goodsale-logo";
import { useEffect, useRef, useState } from "react";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/billing", label: "Billing & Subscriptions", icon: DollarSign },
  { href: "/admin/tenant-name-changes", label: "Name Changes", icon: FileText },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/users", label: "Admin Users", icon: Users },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-3')?.imageUrl || '';
  const [pendingCount, setPendingCount] = useState(0);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    // Throttled fetch: skip if called within the last 5s
    const fetchPendingCount = async () => {
      const now = Date.now();
      if (now - lastFetchRef.current < 5000) return;
      lastFetchRef.current = now;

      try {
        const res = await fetch('/api/admin/subscription-requests/count', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.count || 0);
        }
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return;
        console.error('Failed to fetch pending count:', error);
      }
    };

    // Initial fetch
    fetchPendingCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);

    // Also refresh on window focus (respects throttle)
    const onFocus = () => fetchPendingCount();
    window.addEventListener('focus', onFocus);

    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const isActive = (href: string) => {
    if (href.endsWith('/')) {
        href = href.slice(0, -1);
    }
    if (pathname.startsWith(href) && (pathname === href || pathname.charAt(href.length) === '/')) {
      return true;
    }
    return false;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 text-sidebar-foreground p-2">
            <ShieldCheck className="h-6 w-6 text-sidebar-primary" />
            <span className="font-headline text-lg font-semibold text-sidebar-primary">Admin Panel</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <item.icon />
                  <span>{item.label}</span>
                  {item.href === '/admin/billing' && pendingCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3">
            <Avatar className="h-10 w-10">
                <AvatarImage src={userAvatar} data-ai-hint="person portrait" />
                <AvatarFallback>SA</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
                <span className="font-semibold text-sidebar-foreground">Super Admin</span>
                <span className="text-xs text-sidebar-foreground/70">admin@goodsale.app</span>
            </div>
        </div>
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/admin/profile">
                    <SidebarMenuButton tooltip="Profile Settings" className="justify-start" isActive={pathname === '/admin/profile'}>
                        <UserCircle />
                        <span>Profile Settings</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/">
              <SidebarMenuButton tooltip="Exit Admin" className="justify-start">
                <LogOut />
                <span>Exit Admin</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
