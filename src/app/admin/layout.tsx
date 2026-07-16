'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import AnimatedPage from '@/components/layout/AnimatedPage';
import AppAmbient from '@/components/layout/AppAmbient';
import {
  FileText,
  Users,
  Settings,
  LogOut,
  Home,
  Mail,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/auth/login');
    } else if (!isAdmin) {
      // Logged in but not an admin (role comes from the `user_roles` table,
      // same source of truth the middleware uses).
      router.push('/');
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Don't render anything while redirecting non-admins
  }

  const handleSignOut = async () => {
    await signOut();
    // Auth context will handle redirect to home
  };

  return (
    <div className="dashboard-shell relative flex min-h-screen">
      <AppAmbient />
      {/* Admin Sidebar */}
      <div className="sidebar-organic w-64">
        <div className="border-b border-border/40 p-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold">ZarcFit Admin</span>
          </Link>
        </div>
        
        <div className="p-4">
          <nav className="space-y-2.5">
            <Link 
              href="/admin"
              className="sidebar-nav-item transition-colors hover:bg-muted/50"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/admin/blog"
              className="sidebar-nav-item transition-colors hover:bg-muted/50"
            >
              <FileText className="h-5 w-5" />
              <span>Blog Posts</span>
            </Link>
            <Link 
              href="/admin/users"
              className="sidebar-nav-item transition-colors hover:bg-muted/50"
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Link>
            <Link 
              href="/admin/contact"
              className="sidebar-nav-item transition-colors hover:bg-muted/50"
            >
              <Mail className="h-5 w-5" />
              <span>Contact Messages</span>
            </Link>
            <Link 
              href="/admin/settings"
              className="sidebar-nav-item transition-colors hover:bg-muted/50"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
          
          <div className="mt-8 pt-4 border-t">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-primary transition-colors">
              <Home className="h-5 w-5" />
              <span>View Site</span>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start mt-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="relative flex-1 overflow-auto bg-muted/15 p-6">
          <AnimatedPage ambient={false}>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
} 