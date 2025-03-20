'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Dumbbell, Utensils, Calendar, User, Clipboard, LogOut, Menu, X, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, icon, label, isActive = false }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

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

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r bg-background hidden md:block">
          <div className="p-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">ZarcFit</span>
            </Link>
          </div>
          
          <div className="p-4">
            <nav className="space-y-1">
              <NavItem 
                href="/dashboard/chat" 
                icon={<MessageSquare className="h-5 w-5" />} 
                label="Chat"
                isActive={pathname === '/dashboard/chat'}
              />
              <NavItem 
                href="/dashboard/workout" 
                icon={<Dumbbell className="h-5 w-5" />} 
                label="Workout Tracking"
                isActive={pathname === '/dashboard/workout'}
              />
              <NavItem 
                href="/dashboard/meal-plan" 
                icon={<Utensils className="h-5 w-5" />} 
                label="Meal Plan"
                isActive={pathname === '/dashboard/meal-plan'}
              />
              <NavItem 
                href="/dashboard/sleep" 
                icon={<Moon className="h-5 w-5" />} 
                label="Sleep Tracking"
                isActive={pathname === '/dashboard/sleep'}
              />
              <NavItem 
                href="/dashboard/calendar" 
                icon={<Calendar className="h-5 w-5" />} 
                label="Calendar"
                isActive={pathname === '/dashboard/calendar'}
              />
              <NavItem 
                href="/dashboard/profile" 
                icon={<User className="h-5 w-5" />} 
                label="Profile"
                isActive={pathname === '/dashboard/profile'}
              />
              <NavItem 
                href="/dashboard/plans" 
                icon={<Clipboard className="h-5 w-5" />} 
                label="Plans"
                isActive={pathname === '/dashboard/plans'}
              />
            </nav>
            
            <div className="mt-6 pt-6 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
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
          {/* Mobile Header */}
          <div className="block md:hidden border-b bg-background">
            <div className="flex items-center justify-between p-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold">ZarcFit</span>
              </Link>
              
              <div className="flex items-center gap-4">
                <Link href="/dashboard/profile">
                  <Button size="icon" variant="ghost">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                
                <Button 
                  size="sm" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            {mobileMenuOpen ? (
              <div className="border-t p-4">
                <nav className="space-y-1">
                  <NavItem 
                    href="/dashboard/chat" 
                    icon={<MessageSquare className="h-5 w-5" />} 
                    label="Chat"
                    isActive={pathname === '/dashboard/chat'}
                  />
                  <NavItem 
                    href="/dashboard/workout" 
                    icon={<Dumbbell className="h-5 w-5" />} 
                    label="Workout Tracking"
                    isActive={pathname === '/dashboard/workout'}
                  />
                  <NavItem 
                    href="/dashboard/meal-plan" 
                    icon={<Utensils className="h-5 w-5" />} 
                    label="Meal Plan"
                    isActive={pathname === '/dashboard/meal-plan'}
                  />
                  <NavItem 
                    href="/dashboard/sleep" 
                    icon={<Moon className="h-5 w-5" />} 
                    label="Sleep Tracking"
                    isActive={pathname === '/dashboard/sleep'}
                  />
                  <NavItem 
                    href="/dashboard/calendar" 
                    icon={<Calendar className="h-5 w-5" />} 
                    label="Calendar"
                    isActive={pathname === '/dashboard/calendar'}
                  />
                  <NavItem 
                    href="/dashboard/profile" 
                    icon={<User className="h-5 w-5" />} 
                    label="Profile"
                    isActive={pathname === '/dashboard/profile'}
                  />
                  <NavItem 
                    href="/dashboard/plans" 
                    icon={<Clipboard className="h-5 w-5" />} 
                    label="Plans"
                    isActive={pathname === '/dashboard/plans'}
                  />
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-6"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </nav>
              </div>
            ) : (
              <div className="p-2 border-t grid grid-cols-4 gap-1">
                <Link href="/dashboard/chat" className="flex flex-col items-center p-2 text-sm">
                  <MessageSquare className="h-5 w-5 mb-1" />
                  <span>Chat</span>
                </Link>
                <Link href="/dashboard/workout" className="flex flex-col items-center p-2 text-sm">
                  <Dumbbell className="h-5 w-5 mb-1" />
                  <span>Workout</span>
                </Link>
                <Link href="/dashboard/meal-plan" className="flex flex-col items-center p-2 text-sm">
                  <Utensils className="h-5 w-5 mb-1" />
                  <span>Meals</span>
                </Link>
                <Link href="/dashboard/sleep" className="flex flex-col items-center p-2 text-sm">
                  <Moon className="h-5 w-5 mb-1" />
                  <span>Sleep</span>
                </Link>
                <Link href="/dashboard/calendar" className="flex flex-col items-center p-2 text-sm">
                  <Calendar className="h-5 w-5 mb-1" />
                  <span>Calendar</span>
                </Link>
                <Link href="/dashboard/plans" className="flex flex-col items-center p-2 text-sm">
                  <Clipboard className="h-5 w-5 mb-1" />
                  <span>Plans</span>
                </Link>
                <Link href="/dashboard/profile" className="flex flex-col items-center p-2 text-sm">
                  <User className="h-5 w-5 mb-1" />
                  <span>Profile</span>
                </Link>
              </div>
            )}
          </div>
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 