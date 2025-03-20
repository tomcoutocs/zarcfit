import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SleepRecord } from '@/lib/supabase/dashboard-api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SleepGraphsProps {
  sleepRecords: SleepRecord[];
}

// Define tooltip props type
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const SleepGraphs: React.FC<SleepGraphsProps> = ({ sleepRecords }) => {
  const [mounted, setMounted] = useState(false);
  
  // Wait for component to be mounted to avoid SSR issues with Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort records by date (oldest to newest)
  const sortedRecords = [...sleepRecords].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format data for charts
  const chartData = sortedRecords.map(record => ({
    date: formatDate(record.date),
    rawDate: record.date,
    duration: record.sleep_duration_hours,
    quality: record.sleep_quality || 0,
    deepSleep: record.deep_sleep_hours || 0,
    lightSleep: record.light_sleep_hours || 0,
    remSleep: record.rem_sleep_hours || 0,
    disruptions: record.sleep_disruptions || 0
  }));

  // Helper function to format dates
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  }

  // Get last week data for weekly view
  const lastWeekData = chartData.slice(-7);

  // Custom tooltip formatter for LineChart
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'Quality' ? '/5' : entry.name === 'Duration' ? 'hrs' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Return early if no records or not mounted
  if (!mounted || sleepRecords.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sleep Trends</CardTitle>
          <CardDescription>
            {!mounted ? 'Loading charts...' : 'No sleep records found to display'}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
          {!mounted ? 'Loading...' : 'Add sleep records to see your trends here'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sleep Trends</CardTitle>
        <CardDescription>Visualize your sleep patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="duration">
          <TabsList className="mb-4">
            <TabsTrigger value="duration">Duration & Quality</TabsTrigger>
            <TabsTrigger value="phases">Sleep Phases</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          </TabsList>
          
          {/* Duration & Quality Chart */}
          <TabsContent value="duration" className="h-[400px] min-h-[300px]">
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" domain={[0, 12]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="duration" 
                    name="Duration" 
                    fill="#4f46e5" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="quality" 
                    name="Quality" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* Sleep Phases Chart */}
          <TabsContent value="phases" className="h-[400px] min-h-[300px]">
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 'dataMax + 1']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="deepSleep" 
                    name="Deep Sleep" 
                    stackId="a" 
                    fill="#3b82f6" 
                  />
                  <Bar 
                    dataKey="lightSleep" 
                    name="Light Sleep" 
                    stackId="a" 
                    fill="#93c5fd" 
                  />
                  <Bar 
                    dataKey="remSleep" 
                    name="REM Sleep" 
                    stackId="a" 
                    fill="#60a5fa" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* Weekly View Chart */}
          <TabsContent value="weekly" className="h-[400px] min-h-[300px]">
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lastWeekData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 'dataMax + 2']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    name="Duration (hrs)" 
                    stroke="#4f46e5" 
                    strokeWidth={2} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="disruptions" 
                    name="Disruptions" 
                    stroke="#f97316" 
                    strokeWidth={2} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SleepGraphs; 