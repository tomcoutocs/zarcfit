'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MacroTargets, MacroTotals, macroPercent } from '@/lib/nutrition/food-types';
import { Beef, Droplet, Flame } from 'lucide-react';

type MacroProgressBarsProps = {
  title?: string;
  subtitle?: string;
  totals: MacroTotals;
  targets: MacroTargets;
};

function MacroBar({
  label,
  value,
  target,
  unit,
  color,
  icon,
}: {
  label: string;
  value: number;
  target?: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = macroPercent(value, target);
  const displayTarget = target ? `${target}${unit}` : '—';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{Math.round(value)}</span>
          <span className="text-muted-foreground text-sm">/ {displayTarget}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {target ? `${pct}% of goal` : 'No target set'}
        </p>
      </CardContent>
    </Card>
  );
}

export function MacroProgressBars({
  title = 'Macro Progress',
  subtitle,
  totals,
  targets,
}: MacroProgressBarsProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroBar
          label="Calories"
          value={totals.calories}
          target={targets.calories}
          unit=" kcal"
          color="bg-primary"
          icon={<Flame className="h-4 w-4" />}
        />
        <MacroBar
          label="Protein"
          value={totals.protein}
          target={targets.protein}
          unit="g"
          color="bg-blue-500"
          icon={<Beef className="h-4 w-4" />}
        />
        <MacroBar
          label="Carbs"
          value={totals.carbs}
          target={targets.carbs}
          unit="g"
          color="bg-amber-500"
          icon={<Flame className="h-4 w-4 text-amber-600" />}
        />
        <MacroBar
          label="Fat"
          value={totals.fat}
          target={targets.fat}
          unit="g"
          color="bg-violet-500"
          icon={<Droplet className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
