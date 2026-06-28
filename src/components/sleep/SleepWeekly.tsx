import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { SleepRecord } from '@/types/sleep';

interface SleepWeeklyProps {
  sleepRecords: SleepRecord[];
}

type ChartTooltipPayload = { value: number; name: string; color?: string };

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}

export const SleepWeekly: React.FC<SleepWeeklyProps> = ({ sleepRecords }) => {
  // Process data for the weekly view
  const today = new Date();
  const oneWeekAgo = subDays(today, 7);
  
  // Get data from the last week
  const lastWeekData = sleepRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= oneWeekAgo && recordDate <= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(record => ({
      date: format(parseISO(record.date), 'EEE dd'),
      duration: record.sleep_duration_hours,
      disruptions: record.sleep_disruptions ?? 0,
      rawDate: record.date
    }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p 
              key={`item-${index}`}
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
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
  );
}; 