'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
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
      name: 'Programs',
      href: '/trainer/programs',
      icon: Dumbbell,
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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <Link href="/trainer/dashboard">
              <h1 className="text-2xl font-bold text-primary">ZarcoFit</h1>
              <p className="text-sm text-muted-foreground">Trainer Portal</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t">
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
              className="w-full gap-2"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 border-b bg-card p-4">
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
      <main className="lg:pl-64">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
