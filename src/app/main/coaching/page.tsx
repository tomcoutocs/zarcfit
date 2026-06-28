'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronRight } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';

export default function CoachingPage() {
  const router = useRouter();
  
  return (
    <>
      <PageHero
        badge="1-on-1 Coaching"
        title="Online Coaching"
        subtitle="Personalized guidance, support, and accountability — wherever you are"
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">1</div>
                  <div>
                    <h3 className="font-bold">Initial Consultation</h3>
                    <p className="text-muted-foreground">We&apos;ll discuss your goals, experience, preferences, and any limitations you may have.</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">2</div>
                  <div>
                    <h3 className="font-bold">Customized Plan Creation</h3>
                    <p className="text-muted-foreground">I&apos;ll develop a personalized workout and nutrition plan tailored to your specific needs.</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">3</div>
                  <div>
                    <h3 className="font-bold">Regular Check-ins</h3>
                    <p className="text-muted-foreground">Weekly check-ins to monitor progress, make adjustments, and answer any questions.</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">4</div>
                  <div>
                    <h3 className="font-bold">Ongoing Support</h3>
                    <p className="text-muted-foreground">Continuous guidance and adjustments to keep you progressing toward your goals.</p>
                  </div>
                </li>
              </ol>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">What You&apos;ll Get</h2>
              
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Personalized workout program updated monthly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Customized nutrition guidance based on your goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Weekly check-ins and progress assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Form checks on your exercises via video</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority email and messaging support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Access to my library of educational resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Accountability and motivation to keep you on track</span>
                </li>
              </ul>
            </div>
          </div>
        
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Coaching Packages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <CardDescription>3-Month Commitment</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$250</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Customized workout program</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Basic nutrition guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bi-weekly check-ins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-semibold" 
                  onClick={() => router.push('/auth/signup')}
                >
                  Get Started <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="flex flex-col relative overflow-hidden border-primary">
              <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                Most Popular
              </div>
              <CardHeader className="pt-8">
                <CardTitle>Premium</CardTitle>
                <CardDescription>6-Month Commitment</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$225</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Customized workout program</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Detailed nutrition plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Weekly check-ins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Priority email & chat support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Video form checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Monthly program updates</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-semibold" 
                  onClick={() => router.push('/auth/signup')}
                >
                  Get Started <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Elite</CardTitle>
                <CardDescription>12-Month Commitment</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$200</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Everything in Premium</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Monthly 1-on-1 video calls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Direct phone access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bi-weekly program updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Detailed progress analytics</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-semibold" 
                  onClick={() => router.push('/auth/signup')}
                >
                  Get Started <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How often will we communicate?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  The frequency of communication depends on your package, but generally we&apos;ll have regular check-ins (weekly or bi-weekly) via email or chat. You can also reach out anytime you have questions, and I&apos;ll respond within 24-48 hours (faster for Premium and Elite clients).
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What equipment do I need?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Your program will be designed around the equipment you have available. I can create effective programs for home gyms, commercial gyms, or even with minimal equipment. During our initial consultation, we&apos;ll discuss your available resources.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How are the workouts delivered?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  All workouts are delivered through our online platform, which you can access on your computer or via our mobile app. You&apos;ll receive detailed instructions, video demonstrations, and can track your progress directly in the app.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Can I cancel my coaching?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Coaching packages require a commitment (3, 6, or 12 months) because real results take time. However, if you&apos;re unsatisfied with the service, contact me within the first 14 days for a full refund. After that, we can discuss options if your circumstances change.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fitness?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take the first step toward achieving your fitness goals with personalized coaching and support every step of the way.
          </p>
          <Button 
            size="lg" 
            onClick={() => router.push('/auth/signup')}
          >
            Apply for Coaching
          </Button>
        </div>
      </div>
      </div>
    </>
  );
} 