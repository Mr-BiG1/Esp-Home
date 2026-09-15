import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inMemoryAlerts } from '@/lib/device_store';

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, alerts });
  } catch (error: any) {
    return NextResponse.json({ success: true, alerts: inMemoryAlerts });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, alertId, severity, message } = body;

    if (action === 'ACKNOWLEDGE' && alertId) {
      try {
        const updated = await prisma.alert.update({
          where: { id: alertId },
          data: { isRead: true },
        });
        return NextResponse.json({ success: true, alert: updated });
      } catch (err) {
        const alt = inMemoryAlerts.find((a) => a.id === alertId);
        if (alt) alt.isRead = true;
        return NextResponse.json({ success: true, alert: alt });
      }
    }

    if (action === 'CLEAR_ALL') {
      try {
        await prisma.alert.updateMany({
          where: { isRead: false },
          data: { isRead: true },
        });
      } catch (err) {
        inMemoryAlerts.forEach((a) => (a.isRead = true));
      }
      return NextResponse.json({ success: true, message: 'All alerts marked as read' });
    }

    if (action === 'CREATE') {
      const newAlt = {
        id: `alt_${Date.now()}`,
        severity: severity || 'INFO',
        message: message || 'System event recorded',
        isRead: false,
        timestamp: new Date().toISOString(),
      };

      try {
        const alert = await prisma.alert.create({
          data: {
            severity: newAlt.severity,
            message: newAlt.message,
            isRead: false,
          },
        });
        return NextResponse.json({ success: true, alert });
      } catch (err) {
        inMemoryAlerts.unshift(newAlt);
        return NextResponse.json({ success: true, alert: newAlt });
      }
    }

    if (action === 'DELETE' && alertId) {
      try {
        await prisma.alert.delete({ where: { id: alertId } });
      } catch (err) {
        const idx = inMemoryAlerts.findIndex((a) => a.id === alertId);
        if (idx !== -1) inMemoryAlerts.splice(idx, 1);
      }
      return NextResponse.json({ success: true, message: 'Alert deleted' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

