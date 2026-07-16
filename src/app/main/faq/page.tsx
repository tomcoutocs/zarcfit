import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import PageHero from '@/components/layout/PageHero';

export default function FAQPage() {
  return (
    <>
      <PageHero
        badge="Help Center"
        title="Frequently Asked Questions"
        subtitle="Find answers to the most common questions about our fitness programs and services"
        size="compact"
      >
        <div className="relative mx-auto max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search for answers..." className="border-border/60 bg-card/50 pl-10 backdrop-blur-sm" />
        </div>
      </PageHero>
      <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* FAQ Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Button variant="outline" className="rounded-full">All Questions</Button>
          <Button variant="ghost" className="rounded-full">Programs</Button>
          <Button variant="ghost" className="rounded-full">Memberships</Button>
          <Button variant="ghost" className="rounded-full">Billing</Button>
          <Button variant="ghost" className="rounded-full">Coaching</Button>
          <Button variant="ghost" className="rounded-full">Technical</Button>
        </div>
        
        {/* General Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">General Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What makes ZarcFit different from other fitness programs?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  ZarcFit stands out from other fitness programs through our tailored approach that combines:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Customized workout plans based on your specific goals and fitness level</li>
                  <li>Personalized nutrition guidance that works with your lifestyle</li>
                  <li>One-on-one coaching and accountability from certified trainers</li>
                  <li>A comprehensive app that tracks all aspects of your fitness journey</li>
                  <li>A supportive community of like-minded individuals</li>
                </ul>
                <p className="mt-4">
                  Our programs are designed by fitness professionals with years of experience helping clients achieve remarkable transformations.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How long does it take to see results with your programs?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  Results vary based on individual factors including your starting point, adherence to the program, and genetic factors. Generally:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>2-4 weeks:</strong> You&apos;ll start to feel changes in energy levels and small performance improvements</li>
                  <li><strong>4-8 weeks:</strong> You may notice visual changes and significant strength or endurance improvements</li>
                  <li><strong>8-12 weeks:</strong> Most people experience substantial visible results and major performance enhancements</li>
                </ul>
                <p className="mt-4">
                  Consistency is key - clients who follow their program consistently typically see faster and more sustainable results.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Do I need special equipment for your workouts?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Equipment requirements depend on the specific program you choose:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li><strong>Home Workout Program:</strong> Minimal equipment required - typically just dumbbells, resistance bands, and a yoga mat</li>
                  <li><strong>Gym-Based Programs:</strong> Access to standard gym equipment including free weights, cables, and cardio machines</li>
                  <li><strong>Bodyweight Program:</strong> Little to no equipment needed - primarily using your own body weight for resistance</li>
                </ul>
                <p>
                  Each program clearly outlines equipment requirements before purchase, and many exercises offer equipment-free alternatives if you don&apos;t have access to certain items.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Is nutrition guidance included in your programs?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  Yes, all our programs include nutrition guidance as we believe proper nutrition is essential for optimal results. Depending on your program, you&apos;ll receive:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Customized macro calculations based on your goals</li>
                  <li>Meal planning templates and grocery lists</li>
                  <li>Recipe suggestions and meal prep guidelines</li>
                  <li>Educational resources on nutritional principles</li>
                </ul>
                <p className="mt-4">
                  Our premium programs include personalized nutrition coaching with a certified nutrition expert who can help you navigate specific dietary requirements or preferences.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Membership & Billing */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Membership & Billing</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Online billing and self-serve subscription management are coming soon. Trainer accounts are free to create and explore today.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="billing-1">
              <AccordionTrigger>How does trainer pricing work?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  ZarcFit offers trainer plans based on how many clients you manage and the features you need. You can review tiers on our{' '}
                  <a href="/main/plans" className="text-primary underline">Plans page</a>.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Creating a trainer account is free — no credit card required to get started</li>
                  <li>Paid subscriptions will be available when online billing launches</li>
                  <li>Until then, all trainer platform features remain available while we&apos;re in early access</li>
                </ul>
                <p className="mt-4">
                  Questions about pricing? <a href="/main/contact" className="text-primary underline">Contact our team</a>.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="billing-2">
              <AccordionTrigger>Can I pause or cancel my membership?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  Self-serve pause and cancel options will be available in your trainer account settings once online billing is live.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Today:</strong> There is no active subscription to pause or cancel while billing is in early access</li>
                  <li><strong>Coming soon:</strong> Pause, cancel, and billing history from your account dashboard</li>
                </ul>
                <p className="mt-4">
                  Need help in the meantime? Reach out through our{' '}
                  <a href="/main/contact" className="text-primary underline">contact form</a>.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="billing-3">
              <AccordionTrigger>Do you offer refunds if I&apos;m not satisfied?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Refund policies for paid plans will be published when online billing launches. During early access, trainer accounts are free to explore.
                </p>
                <p className="mt-4">
                  If something isn&apos;t working for you, please{' '}
                  <a href="/main/contact" className="text-primary underline">contact support</a> — we&apos;re happy to help.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Coaching & Support */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Coaching & Support</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="support-1">
              <AccordionTrigger>How can I contact customer support?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  We offer multiple ways to contact our support team:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Email:</strong> support@zarcfit.com (24-48 hour response time)</li>
                  <li><strong>Live Chat:</strong> Available on our website Monday-Friday, 9AM-6PM EST</li>
                  <li><strong>Phone:</strong> (555) 123-4567 during business hours</li>
                  <li><strong>Help Center:</strong> Browse our knowledge base for immediate answers</li>
                </ul>
                <p className="mt-4">
                  Premium members receive priority support with faster response times and dedicated support specialists.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="support-2">
              <AccordionTrigger>What qualifications do your coaches have?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  All ZarcFit coaches meet our rigorous standards for expertise and qualifications:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Certified Personal Trainers with credentials from respected organizations (NASM, ACE, ISSA, etc.)</li>
                  <li>Minimum of 3 years of professional coaching experience</li>
                  <li>Specialized certifications in their areas of expertise (strength training, nutrition, etc.)</li>
                  <li>Continuous education requirement of 20+ hours annually</li>
                </ul>
                <p className="mt-4">
                  You can view each coach&apos;s full credentials and specializations on their profile page.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Technical Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Technical Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tech-1">
              <AccordionTrigger>Which devices is your app compatible with?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  The ZarcFit app is available on multiple platforms:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>iOS:</strong> Compatible with iPhone and iPad running iOS 12 or newer</li>
                  <li><strong>Android:</strong> Compatible with devices running Android 7.0 or newer</li>
                  <li><strong>Web:</strong> Access all features through our web application on any modern browser</li>
                </ul>
                <p className="mt-4">
                  Your account syncs across all devices, allowing you to switch seamlessly between phone, tablet, and desktop.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="tech-2">
              <AccordionTrigger>Can I download workouts for offline use?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Yes, you can download workouts, videos, and nutrition guides for offline use through our mobile app. This is particularly useful for:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>Gym sessions in locations with poor internet connectivity</li>
                  <li>Travel when you may not have consistent internet access</li>
                  <li>Outdoor workouts where cellular data may be limited</li>
                </ul>
                <p>
                  To download content, look for the download icon in the corner of any workout or guide. Downloaded content will be stored for 30 days before requiring a refresh to ensure you have the most updated versions.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* CTA section */}
        <div className="bg-primary/10 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="mb-6 max-w-md mx-auto">
            If you couldn&apos;t find the answer you were looking for, our support team is ready to help you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/main/contact">Contact Us</Link>
            </Button>
            <Button variant="outline">
              Browse Help Center
            </Button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
} 