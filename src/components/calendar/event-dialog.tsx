import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarEvent } from '@/lib/supabase';

type EventFormData = Omit<CalendarEvent, 'user_id' | 'created_at'>;

const defaultEvent: EventFormData = {
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  start_time: undefined,
  end_time: undefined,
  is_all_day: false,
  event_type: 'workout',
  has_reminder: false,
  is_recurring: false,
};

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent?: CalendarEvent;
  selectedDate?: Date;
  onSave: (event: EventFormData) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

export function EventDialog({ 
  open, 
  onOpenChange, 
  selectedEvent, 
  selectedDate,
  onSave,
  onDelete 
}: EventDialogProps) {
  const [formData, setFormData] = useState<EventFormData>(defaultEvent);
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens with a different event or date
  useEffect(() => {
    if (open) {
      if (selectedEvent) {
        // Edit mode - populate form with selected event data
        setFormData({
          id: selectedEvent.id,
          title: selectedEvent.title,
          description: selectedEvent.description || '',
          date: selectedEvent.date,
          start_time: selectedEvent.start_time,
          end_time: selectedEvent.end_time,
          is_all_day: selectedEvent.is_all_day,
          event_type: selectedEvent.event_type,
          has_reminder: selectedEvent.has_reminder,
          is_recurring: selectedEvent.is_recurring,
        });
      } else if (selectedDate) {
        // New event mode with preselected date
        setFormData({
          ...defaultEvent,
          date: selectedDate.toISOString().split('T')[0],
        });
      } else {
        // New event mode with default date (today)
        setFormData(defaultEvent);
      }
    }
  }, [open, selectedEvent, selectedDate]);

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
      // Here you would handle errors, perhaps showing a toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id || !onDelete) return;
    
    setLoading(true);
    
    try {
      await onDelete(formData.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      // Handle errors
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!selectedEvent;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Edit the details of your event below.' 
                : 'Create a new event on your calendar. Fill in the details below.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input 
                id="title" 
                placeholder="Enter event title" 
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="event_type">Category</Label>
                <Select 
                  value={formData.event_type}
                  onValueChange={(value) => handleChange('event_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="coaching">Coaching Session</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="recovery">Rest & Recovery</SelectItem>
                    <SelectItem value="milestone">Goal & Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_all_day" 
                checked={formData.is_all_day}
                onCheckedChange={(checked) => handleChange('is_all_day', !!checked)}
              />
              <Label htmlFor="is_all_day">All Day Event</Label>
            </div>
            
            {!formData.is_all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input 
                    id="start_time" 
                    type="time" 
                    value={formData.start_time?.split('T')[1]?.substring(0, 5) || ''}
                    onChange={(e) => {
                      // Combine date with time
                      const dateStr = formData.date;
                      const timeStr = e.target.value;
                      const startDateTime = `${dateStr}T${timeStr}:00`;
                      handleChange('start_time', startDateTime);
                    }}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input 
                    id="end_time" 
                    type="time" 
                    value={formData.end_time?.split('T')[1]?.substring(0, 5) || ''}
                    onChange={(e) => {
                      // Combine date with time
                      const dateStr = formData.date;
                      const timeStr = e.target.value;
                      const endDateTime = `${dateStr}T${timeStr}:00`;
                      handleChange('end_time', endDateTime);
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter event details"
                className="min-h-[100px]"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has_reminder" 
                checked={formData.has_reminder}
                onCheckedChange={(checked) => handleChange('has_reminder', !!checked)}
              />
              <Label htmlFor="has_reminder">Set Reminder</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_recurring" 
                checked={formData.is_recurring}
                onCheckedChange={(checked) => handleChange('is_recurring', !!checked)}
              />
              <Label htmlFor="is_recurring">Recurring Event</Label>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            {isEditMode && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={loading}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 