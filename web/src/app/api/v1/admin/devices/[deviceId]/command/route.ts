import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { addStoreCommand } from '@/lib/device_store';

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
    const { module, action, parameters } = body;

    if (!module || !action) {
      return NextResponse.json({ error: 'Module and action are required' }, { status: 400 });
    }

    // Add command to in-memory queue & update state instantly for Vercel
    const storeCmd = addStoreCommand({
      deviceId,
      module,
      action,
      parameters: parameters || {},
    });

    try {
      const expiresAt = new Date(Date.now() + 3600 * 1000);
      await prisma.command.create({
        data: {
          deviceId,
          module,
          action,
          parametersJson: JSON.stringify(parameters || {}),
          status: 'PENDING',
          createdByUserId: user.userId,
          expiresAt,
        },
      });
    } catch (e) {
      console.warn('[Dispatch Command DB Warning - store fallback active]', e);
    }

    await logAuditEvent({
      userId: user.userId,
      deviceId,
      action: 'admin.dispatch_command',
      payload: { commandId: storeCmd.commandId, module, action, parameters },
      result: 'QUEUED',
    });

    return NextResponse.json({
      status: 'QUEUED',
      command_id: storeCmd.commandId,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error('[Dispatch Command Error]', err);
    return NextResponse.json({ error: 'Failed to queue command' }, { status: 500 });
  }
}
