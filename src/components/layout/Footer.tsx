import React from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/50 bg-card/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold">ZarcFit</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Transforming lives through tailored fitness programs and expert coaching.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/main/about', label: 'About' },
                { href: '/main/coaching', label: 'Coaching' },
                { href: '/main/programs', label: 'Programs' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Resources</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/main/blog', label: 'Blog' },
                { href: '/main/faq', label: 'FAQs' },
                { href: '/main/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Connect</h3>
            <ul className="space-y-2.5 text-sm">
              {['Instagram', 'Facebook', 'YouTube', 'Twitter'].map((social) => (
                <li key={social}>
                  <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                    {social}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} ZarcFit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
