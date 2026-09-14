import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, servers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, serverId, relayIndex, state } = body;

    if (action === 'TOGGLE_POWER' && serverId) {
      const server = await prisma.server.findUnique({ where: { id: serverId } });
      if (!server) return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });

      // Create command for device relay toggle
      const mainDevice = await prisma.device.findFirst();
      if (mainDevice) {
        await prisma.command.create({
          data: {
            deviceId: mainDevice.deviceId,
            module: 'relay',
            action: 'TOGGLE',
            parametersJson: JSON.stringify({ channel: server.powerRelayIndex ?? 0, state }),
            expiresAt: new Date(Date.now() + 60000),
          },
        });
      }

      await prisma.server.update({
        where: { id: serverId },
        data: { online: state },
      });

      return NextResponse.json({ success: true, message: `Server power toggle command queued` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
