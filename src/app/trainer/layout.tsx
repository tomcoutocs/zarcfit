'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import AnimatedPage from '@/components/layout/AnimatedPage';
import AppAmbient from '@/components/layout/AppAmbient';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Utensils,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react';

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/trainer/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Clients',
      href: '/trainer/clients',
      icon: Users,
    },
    {
      name: 'Workout Plans',
      href: '/trainer/programs',
      icon: Dumbbell,
    },
    {
      name: 'Meal Plans',
      href: '/trainer/meal-plans',
      icon: Utensils,
    },
    {
      name: 'Messages',
      href: '/trainer/messages',
      icon: MessageSquare,
    },
    {
      name: 'Schedule',
      href: '/trainer/schedule',
      icon: Calendar,
    },
    {
      name: 'Settings',
      href: '/trainer/settings',
      icon: Settings,
    },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      <AppAmbient />
      {/* Sidebar */}
      <aside className="sidebar-organic fixed inset-y-0 left-0 z-50 hidden w-64 lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-border/40 p-6">
            <Link href="/trainer/dashboard">
              <h1 className="text-2xl font-bold text-primary">ZarcoFit</h1>
              <p className="text-sm text-muted-foreground">Trainer Portal</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2.5 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'sidebar-nav-item h-auto justify-start',
                      isActive(item.href) && 'nav-pill-active'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="border-t border-border/40 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarFallback>
                  {user?.email?.substring(0, 2).toUpperCase() || 'TR'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground">Trainer</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 rounded-2xl"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-card/50 p-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/trainer/dashboard">
            <h1 className="text-xl font-bold text-primary">ZarcoFit</h1>
          </Link>
          <Avatar>
            <AvatarFallback>
              {user?.email?.substring(0, 2).toUpperCase() || 'TR'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative lg:pl-64">
        <div className="container mx-auto p-6 lg:p-8">
          <AnimatedPage ambient={false}>{children}</AnimatedPage>
        </div>
      </main>
    </div>
  );
}
