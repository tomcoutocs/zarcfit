'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Dumbbell,
  Utensils,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Moon,
  LayoutDashboard,
  Target,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import AnimatedPage from '@/components/layout/AnimatedPage';
import { NavBadge } from '@/components/layout/NavBadge';
import { useUnreadMessageCount } from '@/hooks/use-unread-messages';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ href, icon, label, isActive = false, badge = 0, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'sidebar-nav-item transition-all',
        isActive
          ? 'nav-pill-active text-primary'
          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <NavBadge count={badge} className="ml-0" />
    </Link>
  );
}

const navItems = [
  { href: '/client', icon: LayoutDashboard, label: 'Overview', mobilePrimary: true },
  { href: '/client/chat', icon: MessageSquare, label: 'Chat', mobilePrimary: true, badgeKey: 'messages' as const },
  { href: '/client/workout', icon: Dumbbell, label: 'Workout Tracking', mobilePrimary: true },
  { href: '/client/meal-plan', icon: Utensils, label: 'Meal Plan', mobilePrimary: true },
  { href: '/client/sleep', icon: Moon, label: 'Sleep Tracking', mobilePrimary: false },
  { href: '/client/goals', icon: Target, label: 'Goals', mobilePrimary: false },
  { href: '/client/progress', icon: TrendingUp, label: 'Progress', mobilePrimary: false },
  { href: '/client/calendar', icon: Calendar, label: 'Calendar', mobilePrimary: false },
  { href: '/client/profile', icon: User, label: 'Profile', mobilePrimary: false },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const unreadMessages = useUnreadMessageCount();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/client') return pathname === '/client';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getBadge = (item: (typeof navItems)[0]) => {
    if (item.badgeKey === 'messages') return unreadMessages;
    return 0;
  };

  const primaryNav = navItems.filter((n) => n.mobilePrimary);
  const secondaryNav = navItems.filter((n) => !n.mobilePrimary);

  return (
    <ProtectedRoute>
      <div className="dashboard-shell flex min-h-screen bg-background">

        <aside className="sidebar-organic hidden w-64 flex-col md:flex">
          <div className="border-b border-sidebar-border p-5">
            <Link href="/client" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted text-primary">
                <Dumbbell className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">ZarcFit</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-2.5 p-4">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={<item.icon className="h-5 w-5" />}
                label={item.label}
                isActive={isActive(item.href)}
                badge={getBadge(item)}
              />
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between p-4">
              <Link href="/" className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">ZarcFit</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/client/profile">
                  <Button size="icon" variant="ghost">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {mobileMenuOpen ? (
              <div className="border-t border-border/50 p-4">
                <nav className="space-y-2.5">
                  {navItems.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={<item.icon className="h-5 w-5" />}
                      label={item.label}
                      isActive={isActive(item.href)}
                      badge={getBadge(item)}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                  <Button variant="ghost" className="mt-4 w-full justify-start" onClick={handleSignOut}>
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                  </Button>
                </nav>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1 border-t border-border/50 p-2">
                {primaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex flex-col items-center rounded-lg p-2 text-[10px]',
                      isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className="mb-0.5 h-5 w-5" />
                    <span className="truncate">{item.label.split(' ')[0]}</span>
                    {getBadge(item) > 0 && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className={cn(
                    'flex flex-col items-center rounded-lg p-2 text-[10px]',
                    secondaryNav.some((n) => isActive(n.href))
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <MoreHorizontal className="mb-0.5 h-5 w-5" />
                  <span>More</span>
                </button>
              </div>
            )}
          </div>

          <main className="relative flex-1 overflow-auto bg-background p-4 pb-20 md:p-6 md:pb-6 lg:p-8">
            <AnimatedPage ambient={false}>{children}</AnimatedPage>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
