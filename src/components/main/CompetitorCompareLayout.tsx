import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Info, X } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import {
  COMPARISON_DISCLAIMER,
  ZARCFIT_SNAPSHOT,
  type Competitor,
} from '@/lib/competitor-comparison';

export default function CompetitorCompareLayout({ competitor }: { readonly competitor: Competitor }) {
  return (
    <>
      <PageHero
        badge="Real Cost Comparison"
        title={`ZarcFit vs ${competitor.name}`}
        subtitle={`Best for: ${competitor.bestFor}`}
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Alert className="mb-10">
            <Info className="h-4 w-4" />
            <AlertTitle>Estimates, not quotes</AlertTitle>
            <AlertDescription>{COMPARISON_DISCLAIMER}</AlertDescription>
          </Alert>

          <div className="mb-12 rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-6 text-xl font-semibold tracking-tight">Pricing side by side</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">&nbsp;</th>
                    <th className="pb-3 pr-4 font-medium text-primary">ZarcFit</th>
                    <th className="pb-3 pr-4 font-medium">{competitor.name}</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <td className="py-3 pr-4 text-foreground">Starting price</td>
                    <td className="py-3 pr-4 font-medium text-foreground">{ZARCFIT_SNAPSHOT.basePriceLabel}</td>
                    <td className="py-3 pr-4">{competitor.basePriceLabel}</td>
                  </tr>
                  {competitor.addOns.map((addOn) => (
                    <tr key={addOn.label} className="border-b border-border/60">
                      <td className="py-3 pr-4 text-foreground">{addOn.label}</td>
                      <td className="py-3 pr-4 font-medium text-foreground">Included, no add-on</td>
                      <td className="py-3 pr-4">{addOn.typicalCost}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 pr-4 text-foreground">Realistic monthly cost*</td>
                    <td className="py-3 pr-4 font-medium text-foreground">{ZARCFIT_SNAPSHOT.basePriceLabel}</td>
                    <td className="py-3 pr-4">{competitor.realisticMonthlyLabel}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              *{competitor.realisticMonthlyNote}.
            </p>
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
                  {competitor.zarcfitStrengths.map((item) => (
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
                  <X className="h-5 w-5 text-muted-foreground" /> Where {competitor.name} wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {competitor.competitorStrengths.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="mb-3 text-2xl font-semibold tracking-tight">
              See if ZarcFit fits your roster better than {competitor.name}
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
              Start free, invite a client, and judge the workflow yourself — no commitment required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/auth/signup">Start free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/main/compare">Back to comparison hub</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
