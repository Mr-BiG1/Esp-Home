import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [deviceCount, serverCount, unreadAlerts, pendingCommands] = await Promise.all([
      prisma.device.count(),
      prisma.server.count(),
      prisma.alert.count({ where: { isRead: false } }),
      prisma.command.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      success: true,
      health: {
        status: unreadAlerts > 0 ? 'WARNING' : 'HEALTHY',
        deviceCount,
        serverCount,
        unreadAlerts,
        pendingCommands,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
