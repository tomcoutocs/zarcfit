'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { User, Home } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-black text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40" 
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        ></div>
        
        {/* Top-right icon buttons */}
        {!user && (
          <div className="absolute top-4 right-4 z-20 flex gap-2 md:top-8 md:right-8">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push('/')}
              aria-label="Home"
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
            >
              <Home size={18} className="text-white" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push('/auth/login')}
              aria-label="Login"
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
            >
              <User size={18} className="text-white" />
            </Button>
          </div>
        )}
        
        <div className="relative container mx-auto px-4 py-24 flex flex-col items-center text-center z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Transform Your Body, Transform Your Life</h1>
          <p className="text-xl max-w-3xl mb-8">
            Join ZarcFit for personalized training programs, expert coaching, and a supportive community to help you achieve your fitness goals.
          </p>
          
          {user ? (
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="font-semibold"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/main/programs')}
              >
                Browse Programs
              </Button>
            </div>
          ) : (
            <div>
              <Button 
                size="lg" 
                className="font-semibold"
                onClick={() => router.push('/auth/signup')}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ZarcFit?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Personalized Programs</h3>
              <p className="text-muted-foreground">
                Custom training plans designed specifically for your goals, fitness level, and preferences.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Expert Coaching</h3>
              <p className="text-muted-foreground">
                Guidance from certified fitness professionals with years of experience.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Community Support</h3>
              <p className="text-muted-foreground">
                Join a community of like-minded individuals on the same journey to better health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Success Stories</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border rounded-lg">
              <p className="italic mb-4">
                &quot;ZarcFit completely transformed my approach to fitness. I&apos;ve lost 30 pounds and feel stronger than ever!&quot;
              </p>
              <p className="font-semibold">- Sarah M.</p>
            </div>
            
            <div className="p-6 border rounded-lg">
              <p className="italic mb-4">
                &quot;The personalized workout plans and nutrition guidance helped me achieve results I never thought possible.&quot;
              </p>
              <p className="font-semibold">- Michael T.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Fitness Journey?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Join ZarcFit today and take the first step toward a healthier, stronger you.
          </p>
          
          {user ? (
            <Button 
              size="lg" 
              variant="secondary" 
              className="font-semibold" 
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="secondary" 
              className="font-semibold"
              onClick={() => router.push('/auth/signup')}
            >
              Join ZarcFit Now
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ZarcFit</h3>
              <p className="text-muted-foreground">
                Professional fitness coaching for everyone.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Programs</h3>
              <ul className="space-y-2">
                <li><Link href="/main/programs" className="text-muted-foreground hover:text-primary">Strength Training</Link></li>
                <li><Link href="/main/programs" className="text-muted-foreground hover:text-primary">Weight Loss</Link></li>
                <li><Link href="/main/programs" className="text-muted-foreground hover:text-primary">Muscle Building</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/main/blog" className="text-muted-foreground hover:text-primary">Blog</Link></li>
                <li><Link href="/main/faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
                <li><Link href="/main/contact" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-10 pt-6 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ZarcFit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
