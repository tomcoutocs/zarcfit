import React from 'react';

export function CalendarHeader() {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="grid grid-cols-7 gap-1 mb-1">
      {weekdays.map((day, index) => (
        <div key={index} className="py-2 text-center font-medium text-sm">
          {day}
        </div>
      ))}
    </div>
  );
} 