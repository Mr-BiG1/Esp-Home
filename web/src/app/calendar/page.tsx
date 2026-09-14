'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch('/api/calendar')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEvents(data.events);
      });
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
          <CalendarIcon className="w-7 h-7 text-purple-400" />
          <span>System & Maintenance Calendar</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Scheduled maintenance windows, firmware update windows, and automation calendar.
        </p>
      </div>

      <div className="space-y-4">
        {events.map((ev) => (
          <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <h2 className="text-base font-bold text-slate-100">{ev.title}</h2>
            <p className="text-xs text-slate-400">{ev.description}</p>
            <div className="flex items-center space-x-4 text-xs font-mono text-slate-500 pt-2 border-t border-slate-800">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{new Date(ev.startTime).toLocaleString()}</span>
              </span>
              {ev.location && (
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{ev.location}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
