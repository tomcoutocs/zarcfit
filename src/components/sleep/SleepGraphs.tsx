import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SleepDuration } from './SleepDuration';
import { SleepPhases } from './SleepPhases';
import { SleepWeekly } from './SleepWeekly';
import { SleepRecord } from '@/types/sleep';

interface SleepGraphsProps {
  sleepRecords: SleepRecord[];
}

export const SleepGraphs: React.FC<SleepGraphsProps> = ({ sleepRecords }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep Analytics</CardTitle>
        <CardDescription>
          View your sleep patterns and quality over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="duration" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="duration">Duration & Quality</TabsTrigger>
            <TabsTrigger value="phases">Sleep Phases</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          </TabsList>
          <TabsContent value="duration" className="mt-4">
            <div className="w-full h-[400px]">
              <SleepDuration sleepRecords={sleepRecords} />
            </div>
          </TabsContent>
          <TabsContent value="phases" className="mt-4">
            <div className="w-full h-[400px]">
              <SleepPhases sleepRecords={sleepRecords} />
            </div>
          </TabsContent>
          <TabsContent value="weekly" className="mt-4">
            <div className="w-full h-[400px]">
              <SleepWeekly sleepRecords={sleepRecords} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 