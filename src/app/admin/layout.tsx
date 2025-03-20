'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Home
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is an admin
    // This is a basic check - in a real app, you'd likely have roles in your database
    const checkAdmin = async () => {
      if (!isLoading && user) {
        // Check if user email is admin (this is just for demo purposes)
        // In real application, you would check for admin role in user metadata or a separate admin table
        const adminEmails = ['admin@zarcfit.com']; // Add your admin emails here
        if (user.email && adminEmails.includes(user.email)) {
          setIsAdmin(true);
        } else {
          // Not an admin, redirect to home
          router.push('/');
        }
      } else if (!isLoading && !user) {
        // Not logged in
        router.push('/auth/login');
      }
    };

    checkAdmin();
  }, [user, isLoading, router]);

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
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <div className="w-64 border-r bg-background">
        <div className="p-4 border-b">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold">ZarcFit Admin</span>
          </Link>
        </div>
        
        <div className="p-4">
          <nav className="space-y-2">
            <Link 
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/admin/blog"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>Blog Posts</span>
            </Link>
            <Link 
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Link>
            <Link 
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
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
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
} 