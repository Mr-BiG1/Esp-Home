import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(request: Request) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'VIEWER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        device: { select: { deviceId: true, name: true } },
      },
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userName: l.user?.name || 'System / Device',
      deviceId: l.deviceId,
      action: l.action,
      payload: l.payloadJson ? JSON.parse(l.payloadJson) : null,
      result: l.result,
      sourceIp: l.sourceIp,
      timestamp: l.timestamp.toISOString(),
    }));

    return NextResponse.json({ logs: formatted });
  } catch (err: any) {
    console.error('[Audit Log API Error]', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
