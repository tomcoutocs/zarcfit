'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, User, ChevronDown, Dumbbell, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MARKETING_NAV_LINKS } from '@/lib/site-nav';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm transition-colors group-hover:border-primary/30">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">ZarcFit</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-muted/50 hover:text-foreground',
                pathname === link.href
                  ? 'nav-pill-active font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-border/60 bg-card/50">
                  <User size={16} />
                  {user.user_metadata?.firstName || user.email?.split('@')[0] || 'Account'}
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/client">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/profile">Profile</Link>
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
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                Sign in
              </Button>
              <Button className="font-medium" onClick={() => router.push('/auth/signup')}>
                Become a trainer
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 hover:bg-muted/60 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border/40 bg-background/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {MARKETING_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm',
                  pathname === link.href ? 'bg-muted font-medium text-foreground' : 'hover:bg-muted/60'
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-4">
              {user ? (
                <>
                  <Button className="w-full gap-2" onClick={() => { setIsOpen(false); router.push('/client'); }}>
                    Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => { setIsOpen(false); handleSignOut(); }}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full" onClick={() => { setIsOpen(false); router.push('/auth/login'); }}>
                    Sign in
                  </Button>
                  <Button className="w-full font-medium" onClick={() => { setIsOpen(false); router.push('/auth/signup'); }}>
                    Become a trainer
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
