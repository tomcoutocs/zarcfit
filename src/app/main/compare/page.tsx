import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, ChevronRight, Info, X } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import { COMPARISON_DISCLAIMER, COMPETITORS, ZARCFIT_SNAPSHOT } from '@/lib/competitor-comparison';

export const metadata: Metadata = {
  title: 'Real Cost Comparison — ZarcFit vs Everfit & Trainerize',
  description:
    'What coaching software actually costs once nutrition, automation, and client caps are added in — a transparent, honest comparison of ZarcFit, Everfit, and Trainerize.',
};

const everfit = COMPETITORS.everfit;
const trainerize = COMPETITORS.trainerize;

const ROWS: { label: string; zarcfit: string; everfit: string; trainerize: string }[] = [
  { label: 'Starting price', zarcfit: '$29/mo (5 clients)', everfit: everfit.basePriceLabel, trainerize: trainerize.basePriceLabel },
  { label: 'Nutrition / meal planning', zarcfit: 'Included (full + flexible dieting)', everfit: 'Add-on at higher tiers', trainerize: 'Add-on or separate MFP subscription' },
  { label: 'AI program assist', zarcfit: 'Included', everfit: 'Included', trainerize: 'Limited' },
  { label: 'Habit / check-in automation', zarcfit: 'Not yet available', everfit: 'Autoflow (paid)', trainerize: 'Zapier / habits (add-on)' },
  { label: 'Native iOS/Android app', zarcfit: 'Not yet — responsive web', everfit: 'Yes', trainerize: 'Yes' },
  { label: 'Branded / white-label app', zarcfit: 'Not offered', everfit: 'Logo & colors', trainerize: 'Premium tier' },
  { label: 'Exercise library', zarcfit: '~72 + form videos', everfit: '1,500+ / custom', trainerize: '1,000+' },
  { label: 'Realistic monthly cost*', zarcfit: '$29–$149 flat', everfit: everfit.realisticMonthlyLabel, trainerize: trainerize.realisticMonthlyLabel },
];

export default function ComparePage() {
  return (
    <>
      <PageHero
        badge="Real Cost Comparison"
        title="What coaching software actually costs"
        subtitle="Sticker prices don't tell the whole story once nutrition tools and automation get added back in as paid extras."
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <Alert className="mb-10">
            <Info className="h-4 w-4" />
            <AlertTitle>Estimates, not quotes</AlertTitle>
            <AlertDescription>{COMPARISON_DISCLAIMER}</AlertDescription>
          </Alert>

          <div className="mb-12 rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-2 text-xl font-semibold tracking-tight">ZarcFit vs Everfit vs Trainerize</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Based on a coach running roughly 20–30 active clients who wants nutrition tools included, not sold separately.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Feature</th>
                    <th className="pb-3 pr-4 font-medium text-primary">ZarcFit</th>
                    <th className="pb-3 pr-4 font-medium">Everfit</th>
                    <th className="pb-3 pr-4 font-medium">Trainerize</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-border/60">
                      <td className="py-3 pr-4 text-foreground">{row.label}</td>
                      <td className="py-3 pr-4 font-medium text-foreground">{row.zarcfit}</td>
                      <td className="py-3 pr-4">{row.everfit}</td>
                      <td className="py-3 pr-4">{row.trainerize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">*See disclaimer above — realistic monthly cost assumes nutrition and automation are added to match ZarcFit&apos;s included feature set.</p>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Check className="h-5 w-5 text-primary" /> Where ZarcFit wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {ZARCFIT_SNAPSHOT.includedByDefault.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <X className="h-5 w-5 text-muted-foreground" /> Where ZarcFit doesn&apos;t (yet)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {ZARCFIT_SNAPSHOT.honestGaps.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="mb-6 text-xl font-semibold tracking-tight">Deep-dive comparisons</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>ZarcFit vs TrueCoach</CardTitle>
                  <CardDescription>The closest comparison — both are built for solo and small-team coaches.</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/main/compare/truecoach">
                      Compare in detail <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>ZarcFit vs Everfit</CardTitle>
                  <CardDescription>See the full feature-by-feature breakdown, including where Everfit still leads.</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/main/compare/everfit">
                      Compare in detail <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="mb-3 text-2xl font-semibold tracking-tight">See the real numbers for your roster</h2>
            <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
              Create a free trainer account and check the plan that fits — no add-on surprises later.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/main/plans">View ZarcFit pricing</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/main/contact">Ask a question</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
