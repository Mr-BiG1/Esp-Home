import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inMemoryCalendar } from '@/lib/device_store';

export async function GET() {
  try {
    const events = await prisma.calendarEvent.findMany({ orderBy: { startTime: 'asc' } });
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: true, events: inMemoryCalendar });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, title, description, startTime, endTime, location } = body;

    if (action === 'DELETE' && id) {
      try {
        await prisma.calendarEvent.delete({ where: { id } });
      } catch (err) {
        const idx = inMemoryCalendar.findIndex((c) => c.id === id);
        if (idx !== -1) inMemoryCalendar.splice(idx, 1);
      }
      return NextResponse.json({ success: true, message: 'Event deleted' });
    }

    const newEvent = {
      id: `cal_${Date.now()}`,
      title: title || 'Scheduled Event',
      description: description || 'System maintenance / task',
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date(Date.now() + 3600000).toISOString(),
      location: location || 'Smart Home Network',
      isAllDay: false,
    };

    try {
      const event = await prisma.calendarEvent.create({
        data: {
          title: newEvent.title,
          description: newEvent.description,
          startTime: new Date(newEvent.startTime),
          endTime: new Date(newEvent.endTime),
          location: newEvent.location,
        },
      });
      return NextResponse.json({ success: true, event });
    } catch (err) {
      inMemoryCalendar.unshift(newEvent);
      return NextResponse.json({ success: true, event: newEvent });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

