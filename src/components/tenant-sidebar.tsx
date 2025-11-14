

"use client";

import { useState, useEffect } from "react";
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
  Boxes,
  ShoppingCart,
  Settings,
  LogOut,
  Users,
  Briefcase,
  UserCircle,
  BarChartHorizontal,
  Tags,
  Truck,
  ClipboardList,
  CreditCard,
  RotateCcw,
  FileText,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useUserContext } from "@/context/user-context";
import { Skeleton } from "./ui/skeleton";
import { useSession, signOut } from "next-auth/react";

const menuItems = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['Owner', 'Manager', 'Cashier'] },
  { href: "pos", label: "POS", icon: ShoppingCart, roles: ['Owner', 'Manager', 'Cashier'] },
  { href: "awaiting-collection", label: "Awaiting Collection", icon: Package, roles: ['Owner', 'Manager', 'Cashier'] },
  { href: "products", label: "Products", icon: Boxes, roles: ['Owner', 'Manager'] },
  { href: "sales", label: "Sales", icon: BarChartHorizontal, roles: ['Owner', 'Manager'] },
  { href: "invoices", label: "Invoices", icon: FileText, roles: ['Owner', 'Manager'] },
  { href: "customers", label: "Customers", icon: Users, roles: ['Owner', 'Manager'] },
  { href: "returns", label: "Returns", icon: RotateCcw, roles: ['Owner', 'Manager'] },
  { href: "reports", label: "Reports", icon: BarChartHorizontal, roles: ['Owner', 'Manager'] },
];

const inventoryMenuItems = [
    { href: "categories", label: "Categories", icon: Tags, roles: ['Owner', 'Manager'] },
    { href: "suppliers", label: "Suppliers", icon: Truck, roles: ['Owner', 'Manager'] },
    { href: "purchase-orders", label: "Purchase Orders", icon: ClipboardList, roles: ['Owner', 'Manager'] },
]

const bottomMenuItems = [
    { href: "billing", label: "Billing", icon: CreditCard, roles: ['Owner'] },
    { href: "team", label: "Team Settings", icon: Briefcase, roles: ['Owner', 'Manager'] },
    { href: "settings", label: "Shop Settings", icon: Settings, roles: ['Owner'] },
]

export function TenantSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const currentUser = session?.user;
  const tenantSubdomain = params.tenant as string;
  const [shopLogo, setShopLogo] = useState<string>('');
  const [shopName, setShopName] = useState<string>(tenantSubdomain || '');
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);

  useEffect(() => {
    const fetchShopSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setShopLogo(data.logoUrl || '');
          // Always use the shop name from settings if available, otherwise use tenant subdomain
          setShopName(data.shopName || tenantSubdomain);
        }
      } catch (error) {
        console.error('Error fetching shop settings:', error);
      } finally {
        setIsLoadingLogo(false);
      }
    };
    fetchShopSettings();
  }, [tenantSubdomain]);

  const handleLogout = async () => {
    await signOut({ redirect: false });

    // Always send tenant users back to their tenant-specific login page
    if (tenantSubdomain) {
      router.push(`/${tenantSubdomain}/login`);
    } else {
      router.push('/login');
    }
  };

  const isActive = (href: string) => {
      if (href === 'reports') {
          return pathname.startsWith(`/${tenantSubdomain}/reports`);
      }
      return pathname === `/${tenantSubdomain}/${href}`;
  }
  
  // Map NextAuth roles to component role format
  const roleMap: { [key: string]: string } = {
    'owner': 'Owner',
    'manager': 'Manager',
    'cashier': 'Cashier',
    'admin': 'Owner'
  };
  const userRole = roleMap[currentUser?.role?.toLowerCase() || 'cashier'] || 'Cashier';

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 text-sidebar-foreground p-2">
            {isLoadingLogo ? (
              <Skeleton className="h-6 w-6 rounded" />
            ) : shopLogo ? (
              <Image
                src={shopLogo}
                alt="Shop Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Boxes className="h-6 w-6 text-sidebar-primary" />
            )}
            <span className="font-headline text-lg font-semibold text-sidebar-primary">{shopName}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.filter(item => item.roles.includes(userRole)).map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={`/${tenantSubdomain}/${item.href}`}>
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
        {['Owner', 'Manager'].includes(userRole) && (
         <SidebarMenu className="mt-4">
            <p className="px-4 text-xs text-sidebar-foreground/50 mb-2">Inventory</p>
            {inventoryMenuItems.filter(item => item.roles.includes(userRole)).map((item) => (
                <SidebarMenuItem key={item.label}>
                <Link href={`/${tenantSubdomain}/${item.href}`}>
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
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {['Owner', 'Manager'].includes(userRole) && (
          <SidebarMenu>
            {bottomMenuItems.filter(item => item.roles.includes(userRole)).map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={`/${tenantSubdomain}/${item.href}`}>
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
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
