import React from 'react';
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { SleepRecord } from '@/types/sleep';
import { format, parseISO } from 'date-fns';

interface SleepDurationProps {
  sleepRecords: SleepRecord[];
}

type ChartTooltipPayload = { value: number; name: string; color?: string };

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}

export const SleepDuration: React.FC<SleepDurationProps> = ({ sleepRecords }) => {
  // Process data for the graph
  const chartData = sleepRecords
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(record => ({
      date: format(parseISO(record.date), 'MMM dd'),
      duration: record.sleep_duration_hours,
      quality: record.sleep_quality ?? 0,
      rawDate: record.date
    }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">
            Duration: {payload[0].value.toFixed(1)} hrs
          </p>
          <p className="text-rose-600 dark:text-rose-400">
            Quality: {payload[1].value.toFixed(1)} / 5
          </p>
        </div>
      );
    }
    return null;
  };

  return (
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
          name="Duration (hrs)" 
          fill="#4f46e5" 
          radius={[4, 4, 0, 0]} 
          barSize={20}
        />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="quality" 
          name="Quality (0-5)" 
          stroke="#f43f5e" 
          strokeWidth={2} 
          dot={{ r: 4 }} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}; 