'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChecklistItem = {
  label: string;
  done: boolean;
  href: string;
};

type ClientOnboardingChecklistProps = {
  hasTrainer: boolean;
  hasProgram: boolean;
  hasMealPlan: boolean;
  hasWorkoutLog: boolean;
};

export function ClientOnboardingChecklist({
  hasTrainer,
  hasProgram,
  hasMealPlan,
  hasWorkoutLog,
}: ClientOnboardingChecklistProps) {
  const items: ChecklistItem[] = [
    { label: 'Connect with your trainer', done: hasTrainer, href: '/client/profile' },
    { label: 'Review your assigned program', done: hasProgram, href: '/client/workout' },
    { label: 'Review your meal plan', done: hasMealPlan, href: '/client/meal-plan' },
    { label: 'Log your first workout', done: hasWorkoutLog, href: '/client/workout' },
  ];

  const completed = items.filter((i) => i.done).length;
  if (completed === items.length) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
        <CardDescription>
          {completed} of {items.length} complete — follow these steps to get the most from ZarcFit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
              item.done && 'opacity-60'
            )}
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={item.done ? 'line-through' : ''}>{item.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
