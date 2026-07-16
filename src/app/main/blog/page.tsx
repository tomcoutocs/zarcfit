import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';

const BLOG_IMAGES = {
  featured: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?w=1200&h=800&fit=crop',
  protein: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
  squat: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
  recovery: 'https://images.unsplash.com/photo-1540497077202-7a8ac384a558?w=800&h=600&fit=crop',
  timing: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
  mealPrep: 'https://images.unsplash.com/photo-1498837167922-ddd27525cd3e?w=800&h=600&fit=crop',
  plateaus: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c6?w=800&h=600&fit=crop',
  hiit: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',
} as const;

// Badge component
const Badge = ({ children, className, variant = "default" }: 
{ children: React.ReactNode; className?: string; variant?: "default" | "secondary" | "outline" }) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground"
  };
  
  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className || ""}`}>
      {children}
    </span>
  );
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        badge="Fitness Insights"
        title="Fitness Blog"
        subtitle="Expert advice on fitness, nutrition, and wellness"
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex justify-end">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search articles..." className="border-border/60 bg-card/50 pl-9 w-full md:w-[250px]" />
          </div>
        </div>
        
        {/* Featured Article */}
        <div className="mb-16">
          <div className="group rounded-lg overflow-hidden border shadow-sm">
            <div className="relative h-[300px] md:h-[400px]">
              <Image
                src={BLOG_IMAGES.featured}
                alt="How to Stay Consistent with Your Fitness Routine"
                fill
                className="object-cover transition-transform group-hover:scale-105 duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <Badge className="mb-3 bg-primary hover:bg-primary">Featured</Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">How to Stay Consistent with Your Fitness Routine</h2>
                <p className="line-clamp-2 text-white/90 mb-4">
                  Discover proven strategies to maintain your workout consistency and finally achieve the results you&apos;ve been working toward.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">JZ</div>
                    <span>John Zarco</span>
                  </div>
                  <span className="text-sm text-white/80">June 15, 2023 • 8 min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Categories */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-4 py-2">All</Badge>
            <Badge variant="outline" className="px-4 py-2">Strength Training</Badge>
            <Badge variant="outline" className="px-4 py-2">Weight Loss</Badge>
            <Badge variant="outline" className="px-4 py-2">Nutrition</Badge>
            <Badge variant="outline" className="px-4 py-2">Mindset</Badge>
            <Badge variant="outline" className="px-4 py-2">Recovery</Badge>
            <Badge variant="outline" className="px-4 py-2">Fitness Tips</Badge>
          </div>
        </div>
        
        {/* Latest Articles */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Article 1 */}
            <Card className="group">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <Image
                  src={BLOG_IMAGES.protein}
                  alt="The Ultimate Guide to Protein Intake"
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                />
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="outline">Nutrition</Badge>
                  <span className="text-xs text-muted-foreground">May 28, 2023</span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  The Ultimate Guide to Protein Intake
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="line-clamp-3 text-muted-foreground">
                  Learn exactly how much protein you need based on your fitness goals, with practical food examples and meal timing strategies.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" className="px-0" asChild>
                  <Link href="/main/blog/protein-guide">Read More</Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Article 2 */}
            <Card className="group">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <Image
                  src={BLOG_IMAGES.squat}
                  alt="5 Common Squat Mistakes to Avoid"
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                />
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="outline">Strength Training</Badge>
                  <span className="text-xs text-muted-foreground">June 5, 2023</span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  5 Common Squat Mistakes to Avoid
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="line-clamp-3 text-muted-foreground">
                  Perfect your squat form and avoid potential injuries by learning these common mistakes and how to fix them with expert coaching cues.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" className="px-0" asChild>
                  <Link href="/main/blog/squat-mistakes">Read More</Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Article 3 */}
            <Card className="group">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <Image
                  src={BLOG_IMAGES.recovery}
                  alt="Why Recovery Is Just as Important as Training"
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                />
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="outline">Recovery</Badge>
                  <span className="text-xs text-muted-foreground">June 12, 2023</span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Why Recovery Is Just as Important as Training
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="line-clamp-3 text-muted-foreground">
                  Discover the science behind optimizing recovery and how proper rest periods, sleep quality, and recovery techniques can boost your performance.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" className="px-0" asChild>
                  <Link href="/main/blog/recovery-importance">Read More</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* More Articles (2 columns) */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">More From Our Blog</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Article 4 */}
            <Card>
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-1/3 h-48 md:h-auto overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                  <Image
                    src={BLOG_IMAGES.timing}
                    alt="The Best Time to Work Out: Morning vs. Evening"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="outline">Fitness Tips</Badge>
                      <span className="text-xs text-muted-foreground">May 20, 2023</span>
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      The Best Time to Work Out: Morning vs. Evening
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-2 text-muted-foreground">
                      Is there really an optimal time to exercise? This article dives into the science behind workout timing.
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="ghost" size="sm" className="px-0" asChild>
                      <Link href="/main/blog/workout-timing">Read More</Link>
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
            
            {/* Article 5 */}
            <Card>
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-1/3 h-48 md:h-auto overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                  <Image
                    src={BLOG_IMAGES.mealPrep}
                    alt="Simple Meal Prep for Busy Professionals"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="outline">Nutrition</Badge>
                      <span className="text-xs text-muted-foreground">May 15, 2023</span>
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      Simple Meal Prep for Busy Professionals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-2 text-muted-foreground">
                      Learn how to prepare a week&apos;s worth of healthy meals in under 2 hours with these simple recipes and strategies.
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="ghost" size="sm" className="px-0" asChild>
                      <Link href="/main/blog/meal-prep">Read More</Link>
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
            
            {/* Article 6 */}
            <Card>
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-1/3 h-48 md:h-auto overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                  <Image
                    src={BLOG_IMAGES.plateaus}
                    alt="Overcoming Fitness Plateaus"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="outline">Mindset</Badge>
                      <span className="text-xs text-muted-foreground">May 5, 2023</span>
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      Overcoming Fitness Plateaus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-2 text-muted-foreground">
                      Hit a wall in your progress? Discover practical strategies to break through plateaus and continue making gains.
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="ghost" size="sm" className="px-0" asChild>
                      <Link href="/main/blog/overcoming-plateaus">Read More</Link>
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
            
            {/* Article 7 */}
            <Card>
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-1/3 h-48 md:h-auto overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                  <Image
                    src={BLOG_IMAGES.hiit}
                    alt="The Science of HIIT: Benefits & Protocols"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="outline">Weight Loss</Badge>
                      <span className="text-xs text-muted-foreground">April 28, 2023</span>
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      The Science of HIIT: Benefits & Protocols
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-2 text-muted-foreground">
                      Learn why high-intensity interval training is so effective and how to design the perfect HIIT workout for your goals.
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="ghost" size="sm" className="px-0" asChild>
                      <Link href="/main/blog/hiit-science">Read More</Link>
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="bg-primary/10 p-8 rounded-lg">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Subscribe to Our Newsletter</h2>
            <p className="mb-6">
              Get the latest fitness tips, workout ideas, and nutrition advice delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Your email address"
                className="sm:flex-grow"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
} 