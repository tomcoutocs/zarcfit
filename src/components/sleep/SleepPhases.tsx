import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { SleepRecord } from '@/types/sleep';

interface SleepPhasesProps {
  sleepRecords: SleepRecord[];
}

type ChartTooltipPayload = { value: number; name: string; color?: string };

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}

export const SleepPhases: React.FC<SleepPhasesProps> = ({ sleepRecords }) => {
  // Process data for the graph
  const chartData = sleepRecords
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(record => {
      const duration = record.sleep_duration_hours;
      
      // Calculate approximate sleep phases (these would normally come from real data)
      // Deep sleep: ~20% of total sleep
      // Light sleep: ~50% of total sleep
      // REM sleep: ~25% of total sleep
      // The remaining 5% is awake time
      
      const deepSleep = duration * 0.2;
      const lightSleep = duration * 0.5;
      const remSleep = duration * 0.25;
      
      return {
        date: format(parseISO(record.date), 'MMM dd'),
        deepSleep: parseFloat(deepSleep.toFixed(1)),
        lightSleep: parseFloat(lightSleep.toFixed(1)),
        remSleep: parseFloat(remSleep.toFixed(1)),
        rawDate: record.date
      };
    });

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
              {entry.name}: {entry.value} hrs
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 'dataMax + 1']} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="deepSleep" 
          name="Deep Sleep (hrs)" 
          stackId="a" 
          fill="#3b82f6" 
        />
        <Bar 
          dataKey="lightSleep" 
          name="Light Sleep (hrs)" 
          stackId="a" 
          fill="#93c5fd" 
        />
        <Bar 
          dataKey="remSleep" 
          name="REM Sleep (hrs)" 
          stackId="a" 
          fill="#60a5fa" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
}; 