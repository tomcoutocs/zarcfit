'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  User,
  Dumbbell,
  Utensils,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { EventDialog } from '@/components/calendar/event-dialog';
import { useCalendar } from '@/hooks/use-calendar';
import { CalendarEvent } from '@/lib/supabase';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { SessionRequestPanel } from '@/components/calendar/session-request-panel';

// Helper function to format date
function formatMonthYear(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });
}

export default function CalendarPage() {
  const [state, actions] = useCalendar();
  
  // Local state for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Function to manually trigger a refresh of calendar events
  const handleRefreshEvents = () => {
    // Access the internal fetchEvents function by creating a custom event
    actions.setMonth(state.currentMonth, state.currentYear);
  };
  
  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setDialogOpen(true);
  };
  
  // Handle date click (for creating new events)
  const handleDateClick = (date: Date) => {
    setSelectedEvent(undefined);
    setSelectedDate(date);
    setDialogOpen(true);
  };
  
  // Handle save event
  const handleSaveEvent = async (event: Omit<CalendarEvent, 'user_id' | 'created_at'>) => {
    if (event.id) {
      // Edit existing event
      await actions.updateEvent(event as CalendarEvent);
    } else {
      // Create new event
      await actions.createEvent(event);
    }
  };
  
  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    await actions.deleteEvent(eventId);
  };
  
  return (
    <div className="space-y-8">
      <DashboardPageHeader title="Calendar" description="Schedule workouts, meals, and events">
        <div className="flex items-center gap-2">
          <Button className="gap-2 glow-primary" onClick={() => {
            setSelectedEvent(undefined);
            setSelectedDate(new Date());
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </Button>
        </div>
      </DashboardPageHeader>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={actions.goToPreviousMonth}
              disabled={state.loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">
              {formatMonthYear(state.currentYear, state.currentMonth)}
            </h2>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={actions.goToNextMonth}
              disabled={state.loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={actions.goToToday}
            disabled={state.loading}
          >
            Today
          </Button>
        </CardHeader>
        
        <CardContent>
          {state.loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <span className="text-muted-foreground">Loading calendar events...</span>
            </div>
          ) : state.error ? (
            <div className="h-[600px] flex items-center justify-center flex-col gap-4">
              <span className="text-destructive font-medium">Error loading calendar events</span>
              <p className="text-muted-foreground text-sm">{state.error}</p>
              <Button 
                variant="outline" 
                onClick={handleRefreshEvents}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <CalendarHeader />
              <CalendarGrid 
                year={state.currentYear}
                month={state.currentMonth}
                events={state.events}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
              />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Week and day views are coming soon.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SessionRequestPanel />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              <div className="py-4 text-center text-muted-foreground">
                Loading events...
              </div>
            ) : state.events.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                No upcoming events
              </div>
            ) : (
              <div className="space-y-4">
                {state.events.slice(0, 4).map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-4 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className={`${getEventIconStyles(event.event_type)} rounded-full p-2`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatEventDate(event)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <div className="flex-1">Workouts</div>
                <Button variant="outline" size="sm">Hide</Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <div className="flex-1">Coaching Sessions</div>
                <Button variant="outline" size="sm">Hide</Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                <div className="flex-1">Nutrition</div>
                <Button variant="outline" size="sm">Hide</Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <div className="flex-1">Rest & Recovery</div>
                <Button variant="outline" size="sm">Hide</Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                <div className="flex-1">Goals & Milestones</div>
                <Button variant="outline" size="sm">Hide</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Quick Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => {
                    setSelectedEvent(undefined);
                    setSelectedDate(new Date());
                    setDialogOpen(true);
                    // Preset the event type
                  }}
                >
                  <Dumbbell className="h-4 w-4 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Workout</div>
                    <div className="text-xs text-muted-foreground">Add a new workout session</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => {
                    setSelectedEvent(undefined);
                    setSelectedDate(new Date());
                    setDialogOpen(true);
                    // Preset the event type
                  }}
                >
                  <User className="h-4 w-4 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Coaching</div>
                    <div className="text-xs text-muted-foreground">Schedule a coaching call</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => {
                    setSelectedEvent(undefined);
                    setSelectedDate(new Date());
                    setDialogOpen(true);
                    // Preset the event type
                  }}
                >
                  <Utensils className="h-4 w-4 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Nutrition</div>
                    <div className="text-xs text-muted-foreground">Add a meal plan review</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => {
                    setSelectedEvent(undefined);
                    setSelectedDate(new Date());
                    setDialogOpen(true);
                    // Preset the event type
                  }}
                >
                  <MessageSquare className="h-4 w-4 text-pink-600" />
                  <div className="text-left">
                    <div className="font-medium">Reminder</div>
                    <div className="text-xs text-muted-foreground">Set a reminder</div>
                  </div>
                </Button>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => {
                  setSelectedEvent(undefined);
                  setSelectedDate(new Date());
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <EventDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedEvent={selectedEvent}
        selectedDate={selectedDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}

// Helper functions
function getEventIconStyles(type: string) {
  switch (type) {
    case 'workout':
      return 'bg-blue-100';
    case 'coaching':
      return 'bg-green-100';
    case 'nutrition':
      return 'bg-purple-100';
    case 'recovery':
      return 'bg-orange-100';
    case 'milestone':
      return 'bg-pink-100';
    default:
      return 'bg-gray-100';
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case 'workout':
      return <Dumbbell className="h-4 w-4 text-blue-600" />;
    case 'coaching':
      return <User className="h-4 w-4 text-green-600" />;
    case 'nutrition':
      return <Utensils className="h-4 w-4 text-purple-600" />;
    case 'recovery':
      return <Calendar className="h-4 w-4 text-orange-600" />;
    case 'milestone':
      return <Calendar className="h-4 w-4 text-pink-600" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-600" />;
  }
}

function formatEventDate(event: CalendarEvent) {
  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  if (event.is_all_day) {
    return `${formattedDate}, All day`;
  }
  
  if (event.start_time) {
    const startTime = new Date(event.start_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (event.end_time) {
      const endTime = new Date(event.end_time).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${formattedDate}, ${startTime} - ${endTime}`;
    }
    
    return `${formattedDate}, ${startTime}`;
  }
  
  return formattedDate;
} 