import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'USER')) {
    return NextResponse.json({ error: 'Permission denied to issue commands' }, { status: 403 });
  }

  const { deviceId } = params;

  try {
    const body = await request.json();
    const { module, action, parameters, idempotency_key, ttl_seconds } = body;

    if (!module || !action) {
      return NextResponse.json({ error: 'Module and action are required' }, { status: 400 });
    }

    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + (ttl_seconds || 3600) * 1000);

    const command = await prisma.command.create({
      data: {
        deviceId,
        module,
        action,
        parametersJson: JSON.stringify(parameters || {}),
        status: 'PENDING',
        idempotencyKey: idempotency_key || null,
        createdByUserId: user.userId,
        expiresAt,
      },
    });

    await logAuditEvent({
      userId: user.userId,
      deviceId,
      action: 'admin.dispatch_command',
      payload: { commandId: command.commandId, module, action, parameters },
      result: 'QUEUED',
    });

    return NextResponse.json({
      status: 'QUEUED',
      command_id: command.commandId,
      expires_at: command.expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[Dispatch Command Error]', err);
    return NextResponse.json({ error: 'Failed to queue command' }, { status: 500 });
  }
}
