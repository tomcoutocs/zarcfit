'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Dumbbell, Flame, Zap } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/layout/CTABanner';

export default function ProgramsPage() {
  const router = useRouter();

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  const navigateToContact = () => {
    router.push('/main/contact');
  };

  return (
    <>
      <PageHero
        badge="Training Programs"
        title="Fitness Programs"
        subtitle="Expert-designed programs tailored to meet your specific goals"
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Featured Programs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Featured Programs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Strength Builder</CardTitle>
                <CardDescription>8-week program</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$99</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="mb-6">
                  A comprehensive program designed to increase your overall strength and build lean muscle mass through progressive resistance training.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>4 workouts per week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Focus on compound movements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Progressive overload principles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>High-protein meal suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Video exercise demonstrations</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-semibold" 
                  onClick={navigateToSignup}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="flex flex-col relative overflow-hidden border-primary">
              <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                Most Popular
              </div>
              <CardHeader className="pt-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fat Loss Accelerator</CardTitle>
                <CardDescription>12-week program</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$149</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="mb-6">
                  A science-backed program combining HIIT workouts, strength training, and nutrition strategies to maximize fat loss while preserving muscle mass.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>5 workouts per week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>HIIT and strength hybrid training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Calorie-controlled meal plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Weekly progress check-ins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Access to private community</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-semibold" 
                  onClick={navigateToSignup}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="flex flex-col">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Total Body Transformation</CardTitle>
                <CardDescription>16-week program</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$199</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="mb-6">
                  Our most comprehensive program designed to completely transform your physique, covering all aspects of fitness and nutrition for maximum results.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>5-6 workouts per week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Periodized training phases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Custom macronutrient calculation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bi-weekly coaching calls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Lifetime access to materials</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-semibold" 
                  onClick={navigateToSignup}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Specialty Programs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Specialty Programs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Home Workout Warrior</CardTitle>
                <CardDescription>6-week program • $79</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  A minimal-equipment program designed specifically for home workouts. Get fit without a gym membership using bodyweight exercises and simple equipment.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Requires only dumbbells and resistance bands</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>4 workouts per week (30-45 minutes each)</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={navigateToSignup}
                >
                  Learn More
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Athletic Performance</CardTitle>
                <CardDescription>8-week program • $129</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Designed for athletes looking to improve sport-specific performance. Focus on power, agility, speed, and recovery optimization.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Sport-specific training modules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Includes mobility and recovery protocols</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={navigateToSignup}
                >
                  Learn More
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Postpartum Fitness</CardTitle>
                <CardDescription>10-week program • $119</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  A specialized program for new mothers looking to safely return to fitness after childbirth. Focus on core strength, pelvic floor health, and graduated intensity.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Designed by women&apos;s health specialists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Includes baby-friendly workout options</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={navigateToSignup}
                >
                  Learn More
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Senior Strength & Mobility</CardTitle>
                <CardDescription>Ongoing program • $89/month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Specially designed for adults 60+ focused on maintaining muscle mass, improving balance, and enhancing quality of life through appropriate exercise.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Joint-friendly exercise selection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Includes balance and coordination training</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={navigateToSignup}
                >
                  Learn More
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Program Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Compare Programs</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-4 text-left">Feature</th>
                  <th className="py-4 px-4 text-center">Strength Builder</th>
                  <th className="py-4 px-4 text-center">Fat Loss Accelerator</th>
                  <th className="py-4 px-4 text-center">Total Body Transformation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4">Duration</td>
                  <td className="py-3 px-4 text-center">8 weeks</td>
                  <td className="py-3 px-4 text-center">12 weeks</td>
                  <td className="py-3 px-4 text-center">16 weeks</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Workouts Per Week</td>
                  <td className="py-3 px-4 text-center">4</td>
                  <td className="py-3 px-4 text-center">5</td>
                  <td className="py-3 px-4 text-center">5-6</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Nutrition Plan</td>
                  <td className="py-3 px-4 text-center">Basic</td>
                  <td className="py-3 px-4 text-center">Detailed</td>
                  <td className="py-3 px-4 text-center">Customized</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Coach Support</td>
                  <td className="py-3 px-4 text-center">Email</td>
                  <td className="py-3 px-4 text-center">Email & Chat</td>
                  <td className="py-3 px-4 text-center">Email, Chat & Calls</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Ideal For</td>
                  <td className="py-3 px-4 text-center">Building muscle</td>
                  <td className="py-3 px-4 text-center">Losing fat</td>
                  <td className="py-3 px-4 text-center">Complete transformation</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Price</td>
                  <td className="py-3 px-4 text-center">$99</td>
                  <td className="py-3 px-4 text-center">$149</td>
                  <td className="py-3 px-4 text-center">$199</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mb-16">
          <CTABanner
            title="Not sure which program is right for you?"
            description="Schedule a free consultation call with one of our coaches to discuss your fitness goals and find the perfect program to match your needs."
          >
            <Button size="lg" className="glow-primary font-semibold" onClick={navigateToContact}>
              Schedule Consultation
            </Button>
          </CTABanner>
        </div>
      </div>
      </div>
    </>
  );
} 