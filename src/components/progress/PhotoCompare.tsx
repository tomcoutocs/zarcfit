'use client';

import React, { useMemo, useState } from 'react';
import { ProgressRecord } from '@/lib/supabase/dashboard-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';

type PhotoCompareProps = {
  records: ProgressRecord[];
};

function formatRecordLabel(record: ProgressRecord): string {
  const date = new Date(record.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const weight = record.weight_kg != null ? ` · ${record.weight_kg} kg` : '';
  return `${date}${weight}`;
}

export function PhotoCompare({ records }: PhotoCompareProps) {
  const photoRecords = useMemo(
    () => records.filter((r) => r.photo_url && r.id),
    [records]
  );

  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');

  const sorted = useMemo(
    () => [...photoRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [photoRecords]
  );

  const leftRecord = sorted.find((r) => r.id === leftId) || sorted[0];
  const rightRecord =
    sorted.find((r) => r.id === rightId) || sorted[sorted.length - 1] || sorted[0];

  if (photoRecords.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Compare
          </CardTitle>
          <CardDescription>Compare progress photos side by side</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Add at least two progress photos to compare them.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photo Compare
        </CardTitle>
        <CardDescription>Select two dates to compare side by side</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Before</Label>
            <Select
              value={leftRecord?.id || ''}
              onValueChange={setLeftId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select photo" />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((record) => (
                  <SelectItem key={record.id} value={record.id!}>
                    {formatRecordLabel(record)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>After</Label>
            <Select
              value={rightRecord?.id || ''}
              onValueChange={setRightId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select photo" />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((record) => (
                  <SelectItem key={record.id} value={record.id!}>
                    {formatRecordLabel(record)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[leftRecord, rightRecord].map((record, index) => (
            <div key={record?.id || index} className="space-y-2">
              {record?.photo_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={record.photo_url}
                    alt={`Progress ${record.date}`}
                    className="aspect-[3/4] w-full rounded-lg object-cover border"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {formatRecordLabel(record)}
                  </p>
                </>
              ) : (
                <div className="aspect-[3/4] w-full rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                  No photo
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
