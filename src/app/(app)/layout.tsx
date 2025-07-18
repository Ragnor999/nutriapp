

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CalendarDays, LayoutGrid, LogOut, Menu, Shield, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';

const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: React.ElementType }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-accent text-primary'
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const navItems = (
    <>
      <NavLink href="/dashboard" icon={LayoutGrid}>
        Dashboard
      </NavLink>
      <NavLink href="/calendar" icon={CalendarDays}>
        Calendar
      </NavLink>
      {isAdmin && (
        <NavLink href="/admin" icon={Shield}>
          Admin
        </NavLink>
      )}
    </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo />
          </div>
          <nav className="flex-1 grid items-start px-2 text-sm font-medium lg:px-4">{navItems}</nav>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <div className="mb-4 flex flex-col gap-2">
                  <Logo />
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-semibold">{user.name}</span>
                  </div>
                </div>
                {navItems}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            {/* On desktop, show name next to logo if screen is large enough */}
            <div className="hidden items-center gap-x-4 md:flex">
                <div className="flex items-center gap-2 text-sm font-semibold">
                   <span>Signed in as:</span>
                   <span className="font-bold text-primary">{user.name}</span>
                </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary/50">
                  <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="avatar user" />
                  <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Settings</DropdownMenuItem>
              <DropdownMenuItem disabled>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
