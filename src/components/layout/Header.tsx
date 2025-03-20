'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, User, ChevronDown, Home } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    // The signOut function in auth-context already handles redirection
  };
  
  const navigateToLogin = () => {
    router.push('/auth/login');
  };
  
  const navigateToSignup = () => {
    router.push('/auth/signup');
  };
  
  const navigateToHome = () => {
    router.push('/');
  };

  return (
    <header className="w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">ZarcFit</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/main/about" className="text-sm font-medium hover:text-primary">
            About Me
          </Link>
          <Link href="/main/coaching" className="text-sm font-medium hover:text-primary">
            Online Coaching
          </Link>
          <Link href="/main/programs" className="text-sm font-medium hover:text-primary">
            Programs
          </Link>
          <Link href="/main/blog" className="text-sm font-medium hover:text-primary">
            Blog
          </Link>
          <Link href="/main/contact" className="text-sm font-medium hover:text-primary">
            Contact
          </Link>
          <Link href="/main/faq" className="text-sm font-medium hover:text-primary">
            FAQs
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User size={16} />
                  {user.user_metadata?.firstName || user.email?.split('@')[0] || 'Account'}
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/plans">My Plans</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="icon"
                onClick={navigateToLogin}
                aria-label="Login"
                className="h-9 w-9 rounded-full"
              >
                <User size={18} />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={navigateToHome}
                aria-label="Home"
                className="h-9 w-9 rounded-full"
              >
                <Home size={18} />
              </Button>
              <Button 
                variant="white" 
                className="font-semibold ml-1" 
                onClick={navigateToSignup}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden px-4 py-2 pb-4 bg-background shadow-md">
          <nav className="flex flex-col space-y-3">
            <Link 
              href="/" 
              className="px-2 py-1 text-sm font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/main/about" 
              className="px-2 py-1 text-sm font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              About Me
            </Link>
            <Link 
              href="/main/coaching" 
              className="px-2 py-1 text-sm font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Online Coaching
            </Link>
            <Link 
              href="/main/programs" 
              className="px-2 py-1 text-sm font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Programs
            </Link>
            <Link 
              href="/main/blog" 
              className="px-2 py-1 text-sm font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/main/contact" 
              className="px-2 py-1 text-sm font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link 
              href="/main/faq" 
              className="px-2 py-1 text-sm font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              FAQs
            </Link>
            <div className="flex flex-col space-y-2 pt-2">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground px-2">
                    Signed in as: {user.user_metadata?.firstName || user.email}
                  </p>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <User size={16} />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => {
                        setIsOpen(false);
                        navigateToLogin();
                      }}
                    >
                      <User size={16} />
                      Login
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => {
                        setIsOpen(false);
                        navigateToHome();
                      }}
                    >
                      <Home size={16} />
                      Home
                    </Button>
                  </div>
                  <Button 
                    variant="white" 
                    className="w-full font-semibold"
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/auth/signup');
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
} 