
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Bell, LogOut, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuHeader,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { notifications } from '@/lib/notifications';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function AdminHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const fallbackAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-3')?.imageUrl || '';
  const currentUser = session?.user;
  const userAvatar = currentUser?.avatarUrl || fallbackAvatar;

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/admin/login' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger />
      <div className="flex-1">
        {/* Potentially add breadcrumbs or page title here */}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuHeader className="flex justify-between items-center">
                    <DropdownMenuLabel>Platform Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && <Badge variant="secondary">{unreadCount} Unread</Badge>}
                </DropdownMenuHeader>
                <DropdownMenuSeparator />
                {notifications.slice(0,3).map(notif => ( // Show only a few relevant notifications
                    <DropdownMenuItem key={notif.id} className={cn("flex items-start gap-3", !notif.isRead && "bg-secondary")}>
                       <div className="mt-1">
                         <div className="h-4 w-4 rounded-full bg-primary" />
                       </div>
                       <div className="flex-1">
                           <p className="font-medium">{notif.title}</p>
                           <p className="text-xs text-muted-foreground">{notif.description}</p>
                           <p className="text-xs text-muted-foreground/70 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                       </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
               <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} data-ai-hint="person portrait" />
                  <AvatarFallback>{(currentUser?.name || 'SA').charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{session?.user?.name || 'Super Admin'}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {session?.user?.email || 'admin@goodsale.app'}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/admin/profile">
                <DropdownMenuItem>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
