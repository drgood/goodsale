
'use client';
import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Bell, UserCircle, LogOut, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuHeader,
} from '@/components/ui/dropdown-menu';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchNotifications, markAllNotificationsAsRead, type Notification } from '@/lib/notifications';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ShiftManager } from './shift-manager';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Skeleton } from './ui/skeleton';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenant;
  const { data: session } = useSession();
  const currentUser = session?.user;

  const isOnline = useOnlineStatus();
  const offlineSalesCount = useLiveQuery(() => db.offlineSales.count(), []);
  
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Fetch notifications on mount and every 45 seconds
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      const notifs = await fetchNotifications(10);
      setUserNotifications(notifs || []);
      setIsLoadingNotifications(false);
    };
    
    loadNotifications();
    const interval = setInterval(loadNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setUserNotifications(userNotifications.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger />
      <div className="flex-1">
        <div className="flex items-center gap-2">
            {isOnline ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span>Online</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <WifiOff className="h-4 w-4" />
                    <span>Offline Mode</span>
                </div>
            )}
             {offlineSalesCount !== undefined && offlineSalesCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-2">
                    <RefreshCw className={cn("h-3 w-3", isOnline && "animate-spin")} />
                    {offlineSalesCount} sale{offlineSalesCount > 1 ? 's' : ''} to sync
                </Badge>
            )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ShiftManager />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuHeader className="flex justify-between items-center">
              <span className="font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </DropdownMenuHeader>
            <DropdownMenuSeparator />
            {isLoadingNotifications ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : userNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {userNotifications.map((notif) => {
                  const handleNotificationClick = async () => {
                    // Mark as read
                    if (!notif.isRead) {
                      await markAllNotificationsAsRead();
                      setUserNotifications(userNotifications.map(n => ({ ...n, isRead: true })));
                    }
                    
                    // Navigate based on notification type and data
                    if (notif.data) {
                      const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
                      if (data.productId && notif.type === 'stock') {
                        router.push(`/${tenantId}/products/${data.productId}`);
                      } else if (data.saleId && notif.type === 'sale') {
                        router.push(`/${tenantId}/sales`);
                      }
                    }
                  };
                  
                  return (
                    <DropdownMenuItem
                      key={notif.id}
                      onClick={handleNotificationClick}
                      className="flex flex-col items-start py-3 px-4 cursor-pointer hover:bg-accent"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <p className={cn('text-sm font-medium', !notif.isRead && 'font-semibold')}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notif.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {!notif.isRead && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
               {currentUser ? (
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatarUrl || undefined} data-ai-hint="person portrait" />
                      <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
               ) : (
                   <Skeleton className="h-8 w-8 rounded-full" />
               )}
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {currentUser ? (
              <>
                <DropdownMenuLabel>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {currentUser.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={`/${tenantId}/profile`}>
                  <DropdownMenuItem>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                  <Link href={`/${tenantId}/settings`}>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Shop Settings</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuLabel>Loading...</DropdownMenuLabel>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
