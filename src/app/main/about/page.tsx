import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, DollarSign, Salad } from 'lucide-react';
import Image from 'next/image';
import PageHero from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'About ZarcFit',
  description:
    'ZarcFit is the all-in-one coaching platform built by a coach for solo fitness trainers. Meet founder Marco and the story behind the product.',
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        badge="Our Story"
        title="About ZarcFit"
        subtitle="The all-in-one platform built by a coach, for solo coaches"
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="aspect-square rounded-lg overflow-hidden">
              {/* Founder photo */}
              <Image 
                src="/images/marco1.png" 
                alt="Marco, founder of ZarcFit"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-bold mb-4">Marco</h2>
            <p className="text-muted-foreground mb-6">
              Founder of ZarcFit &middot; Certified Strength and Conditioning Specialist
            </p>
            
            <p className="mb-4">
              I&apos;m a Certified Strength and Conditioning Specialist (CSCS) from the NSCA, with a background in Clinical Health Sciences. Before ZarcFit existed, I coached my own online clients — and ran the business the way most solo trainers still do: a spreadsheet for programming, a PDF for nutrition, a group chat for check-ins, and a separate app for logging workouts.
            </p>
            
            <p className="mb-4">
              None of those tools talked to each other, and every new client meant more manual work instead of better coaching. So I built the platform I actually needed: one place to build programs, plan nutrition, message clients, and see who needs a check-in.
            </p>
            
            <p>
              That tool became ZarcFit. Today it&apos;s the software other independent coaches use to run their own rosters — I&apos;m no longer coaching individual clients myself, I&apos;m building the platform full-time.
            </p>
          </div>
        </div>
        
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Why ZarcFit exists</h2>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-lg mb-4">
                ZarcFit is built for coaches who run their own business, not gym chains with admin staff. A few principles shape every decision we make:
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Coach-workbench, not gym OS</strong>
                    <p className="text-muted-foreground">ZarcFit is built for the solo and small-roster coach — not multi-location studios. We&apos;d rather do fewer things well than chase every enterprise feature.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <Salad className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Flexible dieting, not a nutrition tax</strong>
                    <p className="text-muted-foreground">Full meal plans or macros-only tracking — both are included on every paid tier, not sold back to you as a $30–45/mo add-on like on some other platforms.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <BookOpen className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Programming that adapts</strong>
                    <p className="text-muted-foreground">Clients rate the difficulty of every workout, and that feedback shapes what gets assigned next — so programming responds to real performance, not just a fixed template.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <DollarSign className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Transparent, solo-coach pricing</strong>
                    <p className="text-muted-foreground">One monthly price per plan, scaled by client count. No per-feature upsells hidden behind a sales call.</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">The coaching background behind the product</h2>
          <p className="mb-6 text-muted-foreground">
            ZarcFit&apos;s features come from real coaching experience, not a features checklist. Marco&apos;s certifications and training shaped what the platform prioritizes — adaptive programming, legitimate nutrition guidance, and a workflow that fits how solo coaches actually work.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Certifications</h3>
                <ul className="space-y-2">
                  <li>National Strength and Conditioning Association (NSCA) Certified Strength and Conditioning Specialist</li>
                  <li>Precision Nutrition Level 2 Coach</li>
                  <li>USA Weightlifting Sports Performance Coach</li>
                  <li>Functional Movement Screen (FMS) Level 2</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Education</h3>
                <ul className="space-y-2">
                  <li>Bachelor of Science in Kinesiology, University of State</li>
                  <li>Master&apos;s in Exercise Science and Sports Nutrition</li>
                  <li>Continuing education in program design and sports nutrition</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">How we build</h2>
          
          <p className="mb-4">
            ZarcFit isn&apos;t trying to out-feature the big studio platforms. We&apos;d rather stay focused on what a solo coach actually needs day to day: a program builder that&apos;s fast to use, nutrition tools that don&apos;t cost extra, and client tracking that surfaces who needs attention without digging through spreadsheets.
          </p>
          
          <p className="mb-4">
            We&apos;re upfront about where we&apos;re still growing — no native mobile apps yet, and a smaller exercise library than platforms that have been around for a decade. What you get in exchange is a product shaped by someone who has actually run a coaching business on it, and a pricing model with no surprise add-ons.
          </p>
          
          <p>
            If that sounds like the platform you&apos;ve been trying to piece together yourself, we&apos;d like to help you run your business on it.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">Ready to run your coaching business on ZarcFit?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Create your free trainer account and invite your first client — upgrade only when your roster grows.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Become a trainer</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/main/plans">View plans</Link>
            </Button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
} 
