'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import { checkInsApi, ClientCheckIn, daysSinceCheckIn, needsCheckIn } from '@/lib/supabase/check-ins-api';

const THRESHOLD_DAYS = 7;

type CheckInBannerProps = {
  userId: string;
};

export function CheckInBanner({ userId }: CheckInBannerProps) {
  const [latest, setLatest] = useState<ClientCheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    checkInsApi.getLatestCheckIn(userId).then((record) => {
      if (!cancelled) {
        setLatest(record);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return null;

  const due = needsCheckIn(latest, THRESHOLD_DAYS);
  const days = daysSinceCheckIn(latest?.check_in_date);

  if (!due) {
    let lastCheckInLabel = 'Checked in today';
    if (days && days > 0) {
      lastCheckInLabel = `Last check-in ${days} day${days === 1 ? '' : 's'} ago`;
    }

    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">You&apos;re up to date</p>
              <p className="text-sm text-muted-foreground">{lastCheckInLabel}</p>
            </div>
          </div>
          <Link href="/client/check-in">
            <Button variant="outline" size="sm">Log another check-in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-amber-600" />
          Weekly check-in due
        </CardTitle>
        <CardDescription>
          {latest
            ? `It's been ${days} days since your last check-in — let your trainer know how you're doing.`
            : "You haven't logged a check-in yet — let your trainer know how you're doing."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/client/check-in">
          <Button className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Log check-in
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
