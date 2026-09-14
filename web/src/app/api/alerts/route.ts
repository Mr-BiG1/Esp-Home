import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, alerts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, alertId } = body;

    if (action === 'ACKNOWLEDGE' && alertId) {
      const updated = await prisma.alert.update({
        where: { id: alertId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, alert: updated });
    }

    if (action === 'CLEAR_ALL') {
      await prisma.alert.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All alerts marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
