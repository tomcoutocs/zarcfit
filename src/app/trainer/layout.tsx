'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import AnimatedPage from '@/components/layout/AnimatedPage';
import AppAmbient from '@/components/layout/AppAmbient';
import { NavBadge } from '@/components/layout/NavBadge';
import { useUnreadMessageCount } from '@/hooks/use-unread-messages';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Utensils,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/trainer/dashboard', icon: LayoutDashboard, mobilePrimary: true },
  { name: 'Clients', href: '/trainer/clients', icon: Users, mobilePrimary: true },
  { name: 'Workout Plans', href: '/trainer/programs', icon: Dumbbell, mobilePrimary: true },
  { name: 'Meal Plans', href: '/trainer/meal-plans', icon: Utensils, mobilePrimary: false },
  { name: 'Messages', href: '/trainer/messages', icon: MessageSquare, mobilePrimary: true, badge: 'messages' as const },
  { name: 'Schedule', href: '/trainer/schedule', icon: Calendar, mobilePrimary: false },
  { name: 'Settings', href: '/trainer/settings', icon: Settings, mobilePrimary: false },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadMessages = useUnreadMessageCount();

  const isActive = (href: string) => pathname?.startsWith(href);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getBadge = (item: (typeof navigation)[0]) => {
    if (item.badge === 'messages') return unreadMessages;
    return 0;
  };

  const primaryNav = navigation.filter((n) => n.mobilePrimary);

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      <AppAmbient />

      {/* Desktop sidebar */}
      <aside className="sidebar-organic fixed inset-y-0 left-0 z-50 hidden w-64 lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border/40 p-6">
            <Link href="/trainer/dashboard">
              <h1 className="text-2xl font-bold text-primary">ZarcoFit</h1>
              <p className="text-sm text-muted-foreground">Trainer Portal</p>
            </Link>
          </div>

          <nav className="flex-1 space-y-2.5 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const badge = getBadge(item);
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'sidebar-nav-item h-auto w-full justify-start',
                      isActive(item.href) && 'nav-pill-active'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <NavBadge count={badge} className="ml-0" />
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/40 p-4">
            <div className="mb-3 flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || 'TR'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Trainer</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2 rounded-2xl" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header + nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-card/50 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between p-4">
          <Link href="/trainer/dashboard">
            <h1 className="text-xl font-bold text-primary">ZarcoFit</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/trainer/settings">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user?.email?.substring(0, 2).toUpperCase() || 'TR'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button size="sm" variant="outline" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-border/40 p-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn('w-full justify-start', isActive(item.href) && 'nav-pill-active')}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      {item.name}
                      <NavBadge count={getBadge(item)} />
                    </Button>
                  </Link>
                );
              })}
              <Button variant="ghost" className="mt-2 w-full justify-start" onClick={handleSignOut}>
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>
            </nav>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1 border-t border-border/40 p-2 pb-safe">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center rounded-lg p-2 text-[10px]',
                    isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="mb-0.5 h-5 w-5" />
                  <span className="truncate">{item.name.split(' ')[0]}</span>
                  {getBadge(item) > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center rounded-lg p-2 text-[10px] text-muted-foreground"
            >
              <MoreHorizontal className="mb-0.5 h-5 w-5" />
              <span>More</span>
            </button>
          </div>
        )}
      </header>

      <main className="relative lg:pl-64">
        <div className="container mx-auto p-4 pb-20 lg:p-8 lg:pb-8">
          <AnimatedPage ambient={false}>{children}</AnimatedPage>
        </div>
      </main>
    </div>
  );
}
