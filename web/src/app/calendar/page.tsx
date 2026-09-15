'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, X } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Smart Home Network');
  const [startTime, setStartTime] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.success) setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (id: string) => {
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', id }),
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'System Maintenance Window',
          description: description || 'Routine mesh sensor audit and log cleanup.',
          startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          location,
        }),
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <CalendarIcon className="w-7 h-7 text-purple-400" />
            <span>System & Maintenance Calendar</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Scheduled maintenance windows, firmware update windows, and automation calendar.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No scheduled events or maintenance windows.</p>
          <p className="text-xs text-slate-500">Click &quot;Schedule Maintenance&quot; to plan firmware upgrades or system tasks.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all flex items-start justify-between"
            >
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-100">{ev.title}</h2>
                <p className="text-xs text-slate-400">{ev.description}</p>
                <div className="flex items-center space-x-4 text-xs font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{new Date(ev.startTime).toLocaleString()}</span>
                  </span>
                  {ev.location && (
                    <span className="flex items-center space-x-1 text-teal-300">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      <span>{ev.location}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteEvent(ev.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                title="Delete Event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
                <span>Schedule Maintenance Window</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Firmware Update v2.2.0"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details about scheduled task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Location / Target</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

