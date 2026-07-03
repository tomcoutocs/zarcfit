'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Dumbbell, Utensils, Calendar, User, Clipboard, LogOut, Menu, X, Moon, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, label, isActive = false, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
        isActive
          ? 'nav-link-active shadow-sm'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/dashboard/workout', icon: Dumbbell, label: 'Workout Tracking' },
  { href: '/dashboard/meal-plan', icon: Utensils, label: 'Meal Plan' },
  { href: '/dashboard/sleep', icon: Moon, label: 'Sleep Tracking' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/plans', icon: Clipboard, label: 'Plans' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <div className="border-b border-sidebar-border p-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/20">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Zarc<span className="text-primary">Fit</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={<item.icon className="h-5 w-5" />}
                label={item.label}
                isActive={isActive(item.href)}
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

        {/* Main */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header */}
          <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between p-4">
              <Link href="/" className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">ZarcFit</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/profile">
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
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={<item.icon className="h-5 w-5" />}
                      label={item.label}
                      isActive={isActive(item.href)}
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
              <div className="grid grid-cols-4 gap-1 border-t border-border/50 p-2">
                {navItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center rounded-lg p-2 text-xs',
                      isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className="mb-1 h-5 w-5" />
                    <span className="truncate">{item.label.split(' ')[0]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <main className="flex-1 overflow-auto bg-muted/20 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
