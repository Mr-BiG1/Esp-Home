import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyDeviceSignature } from '@/lib/security';

export async function GET(request: Request) {
  const deviceId = request.headers.get('X-Device-ID') || '';
  const timestamp = request.headers.get('X-Timestamp') || '';
  const nonce = request.headers.get('X-Nonce') || '';
  const signature = request.headers.get('X-Signature') || '';

  const auth = await verifyDeviceSignature(deviceId, timestamp, nonce, signature, '');
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const pendingCommands = await prisma.command.findMany({
      where: {
        deviceId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });

    // Mark retrieved commands as DELIVERED
    if (pendingCommands.length > 0) {
      await prisma.command.updateMany({
        where: {
          commandId: { in: pendingCommands.map((c) => c.commandId) },
        },
        data: { status: 'DELIVERED' },
      });
    }

    const commandsDto = pendingCommands.map((cmd) => ({
      command_id: cmd.commandId,
      module: cmd.module,
      action: cmd.action,
      parameters: JSON.parse(cmd.parametersJson || '{}'),
      expires_at: cmd.expiresAt.toISOString(),
    }));

    return NextResponse.json({ commands: commandsDto });
  } catch (err: any) {
    console.error('[Get Commands Error]', err);
    return NextResponse.json({ error: 'Failed to fetch pending commands' }, { status: 500 });
  }
}
