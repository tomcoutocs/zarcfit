'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import AnimatedPage from '@/components/layout/AnimatedPage';
import { cn } from '@/lib/utils';
import {
  FileText,
  Users,
  Settings,
  LogOut,
  Home,
  Mail,
  Menu,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Contact', href: '/admin/contact', icon: Mail },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push('/auth/login');
    else if (!isAdmin) router.push('/');
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'sidebar-nav-item flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/50',
              isActive(item.href) && 'bg-muted font-medium'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="dashboard-shell relative flex min-h-screen bg-background">

      {/* Desktop sidebar */}
      <aside className="sidebar-organic hidden w-64 lg:block">
        <div className="border-b border-border/40 p-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold">ZarcFit Admin</span>
          </Link>
        </div>
        <div className="p-4">
          <nav className="space-y-2.5">
            <NavLinks />
          </nav>
          <div className="mt-8 border-t pt-4">
            <Link href="/" className="mb-2 flex items-center gap-3 rounded-md px-3 py-2 text-primary hover:bg-muted">
              <Home className="h-5 w-5" />
              <span>View Site</span>
            </Link>
            <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col lg:ml-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/admin" className="font-bold text-primary">
            ZarcFit Admin
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-background shadow-xl">
              <div className="flex items-center justify-between border-b p-4">
                <span className="font-bold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
              <div className="border-t p-4">
                <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="relative flex-1 overflow-auto bg-background p-4 lg:p-6">
          <AnimatedPage ambient={false}>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
}
