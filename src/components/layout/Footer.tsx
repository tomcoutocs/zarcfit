import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">ZarcFit</h3>
            <p className="text-muted-foreground">
              Transforming lives through tailored fitness programs and expert coaching.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/main/about" className="text-muted-foreground hover:text-primary">
                  About Me
                </Link>
              </li>
              <li>
                <Link href="/main/coaching" className="text-muted-foreground hover:text-primary">
                  Online Coaching
                </Link>
              </li>
              <li>
                <Link href="/main/programs" className="text-muted-foreground hover:text-primary">
                  Programs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/main/blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/main/faq" className="text-muted-foreground hover:text-primary">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/main/contact" className="text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  YouTube
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
          <p>&copy; {currentYear} ZarcFit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 