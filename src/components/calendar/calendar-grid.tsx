import React from 'react';
import { CalendarEvent } from '@/lib/supabase';

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export function CalendarGrid({ year, month, events = [], onEventClick, onDateClick }: CalendarGridProps) {
  // Generate days for the selected month
  const safeEvents = events || []; // Ensure events is never undefined or null
  const days = generateCalendarDays(year, month, safeEvents);

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => (
        <div
          key={index}
          className={`min-h-[100px] p-1 border rounded-md ${
            !day.isCurrentMonth ? 'bg-muted text-muted-foreground' : ''
          } ${day.isToday ? 'border-primary' : ''} hover:bg-accent/50 cursor-pointer transition-colors`}
          onClick={() => onDateClick?.(day.date)}
        >
          <div className="text-right mb-1">
            <span
              className={`text-sm inline-block rounded-full w-7 h-7 leading-7 text-center ${
                day.isToday ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              {day.date.getDate()}
            </span>
          </div>
          
          <div className="space-y-1">
            {day.events.map((event, eventIndex) => (
              <div
                key={eventIndex}
                className={`text-xs p-1 rounded truncate ${getEventStyles(event.event_type)} hover:opacity-80`}
                title={event.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
              >
                {event.is_all_day ? (
                  <span>{event.title}</span>
                ) : (
                  <span>
                    {formatTime(event.start_time)} • {event.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function generateCalendarDays(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const today = new Date();
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Day of the week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Calculate how many days from the previous month to show
  const daysFromPrevMonth = firstDayOfWeek;
  
  // Calculate how many days from the next month to show to complete the grid
  const totalDaysToShow = 42; // 6 rows of 7 days
  const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth;
  
  const days: CalendarDay[] = [];
  
  // Add days from previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonthLastDay = new Date(prevMonthYear, prevMonth, 0).getDate();
  
  for (let i = 0; i < daysFromPrevMonth; i++) {
    const date = new Date(prevMonthYear, prevMonth - 1, prevMonthLastDay - daysFromPrevMonth + i + 1);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: getEventsForDate(events, date)
    });
  }
  
  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      events: getEventsForDate(events, date)
    });
  }
  
  // Add days from next month
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  
  for (let i = 1; i <= daysFromNextMonth; i++) {
    const date = new Date(nextMonthYear, nextMonth - 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: getEventsForDate(events, date)
    });
  }
  
  return days;
}

function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateString = date.toISOString().split('T')[0];
  return events.filter(event => event.date === dateString);
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function getEventStyles(type: string) {
  switch (type) {
    case 'workout':
      return 'bg-blue-100 text-blue-800 border-l-2 border-blue-500';
    case 'coaching':
      return 'bg-green-100 text-green-800 border-l-2 border-green-500';
    case 'nutrition':
      return 'bg-purple-100 text-purple-800 border-l-2 border-purple-500';
    case 'recovery':
      return 'bg-orange-100 text-orange-800 border-l-2 border-orange-500';
    case 'milestone':
      return 'bg-pink-100 text-pink-800 border-l-2 border-pink-500';
    default:
      return 'bg-gray-100 text-gray-800 border-l-2 border-gray-500';
  }
}

function formatTime(timeString?: string) {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
} 