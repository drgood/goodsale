
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { GoodSaleLogo } from "./goodsale-logo";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/users", label: "Admin Users", icon: Users },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-3')?.imageUrl || '';

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
