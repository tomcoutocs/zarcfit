import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, BookOpen, Dumbbell, Medal } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About Me</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="aspect-square rounded-lg overflow-hidden">
              {/* Coach image */}
              <Image 
                src="/images/marco1.png" 
                alt="Coach Marco"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-bold mb-4">Marco</h2>
            <p className="text-muted-foreground mb-6">
              Certified Personal Trainer &amp; Nutrition Specialist
            </p>
            
            <p className="mb-4">
              I&apos;m a Certified Strength and Conditioning Specialist (CSCS) from the NSCA. I have a bachelor&apos;s in Clinical Health Sciences from the University of Central Florida.
            </p>
            
            <p className="mb-4">
              I have been in the gym for well over 8+ years and a competitive jiu-jitsu athlete for the past 2.
            </p>
            
            <p>
              I aim to help bridge the gaps in your fitness and mindset journey with guided workouts, nutrition, and mentorship.
            </p>
          </div>
        </div>
        
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">My Philosophy</h2>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-lg mb-4">
                I believe that fitness should enhance your life, not consume it. My coaching philosophy centers on these core principles:
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Individualization</strong>
                    <p className="text-muted-foreground">Every program is tailored to your unique body, goals, preferences, and lifestyle.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <Dumbbell className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Progressive Training</strong>
                    <p className="text-muted-foreground">Workouts are designed to gradually increase in challenge as your fitness improves.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <Medal className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Sustainable Habits</strong>
                    <p className="text-muted-foreground">Building long-term habits that support your goals without requiring extreme sacrifices.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <BookOpen className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium">Education</strong>
                    <p className="text-muted-foreground">Teaching you the why behind your training and nutrition so you can become self-sufficient.</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Credentials &amp; Education</h2>
          
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
                  <li>Continuing Education: 40+ hours annually</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold mb-6">My Approach</h2>
          
          <p className="mb-4">
            When you work with me, you&apos;re not just getting a template or a one-size-fits-all program. You&apos;re getting a dedicated coach who understands the science of training and nutrition, but also the art of making it work for real people with busy lives.
          </p>
          
          <p className="mb-4">
            I pride myself on being accessible, responsive, and genuinely interested in your success. My clients aren&apos;t just numbers on a spreadsheet—they&apos;re real people with unique challenges, preferences, and needs.
          </p>
          
          <p>
            If you&apos;re ready to stop spinning your wheels and start making real progress toward your fitness goals, I&apos;d be honored to be your guide on this journey.
          </p>
        </div>
      </div>
    </div>
  );
} 