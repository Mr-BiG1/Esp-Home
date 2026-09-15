import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { popStoreCommands } from '@/lib/device_store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = request.headers.get('X-Device-ID') || searchParams.get('device_id') || 'HOME-CTRL-441';

  const commandsDto: any[] = [];

  // Pop from in-memory queue for Vercel deployment
  const memoryCmds = popStoreCommands(deviceId);
  memoryCmds.forEach((cmd) => {
    commandsDto.push({
      command_id: cmd.commandId,
      module: cmd.module,
      action: cmd.action,
      parameters: cmd.parameters,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  });

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

    if (pendingCommands.length > 0) {
      await prisma.command.updateMany({
        where: {
          commandId: { in: pendingCommands.map((c) => c.commandId) },
        },
        data: { status: 'DELIVERED' },
      }).catch(() => {});

      pendingCommands.forEach((cmd) => {
        commandsDto.push({
          command_id: cmd.commandId,
          module: cmd.module,
          action: cmd.action,
          parameters: JSON.parse(cmd.parametersJson || '{}'),
          expires_at: cmd.expiresAt.toISOString(),
        });
      });
    }
  } catch (err: any) {
    console.warn('[Get Commands DB Warning - fallback active]', err);
  }

  return NextResponse.json({ commands: commandsDto });
}
