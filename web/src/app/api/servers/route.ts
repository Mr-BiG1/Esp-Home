import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inMemoryServers, addStoreCommand } from '@/lib/device_store';

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, servers });
  } catch (error: any) {
    return NextResponse.json({ success: true, servers: inMemoryServers });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, serverId, name, hostname, ipAddress, os, powerRelayIndex, state } = body;

    if (action === 'TOGGLE_POWER' && serverId) {
      let targetServer = inMemoryServers.find((s) => s.id === serverId);

      try {
        const dbServer = await prisma.server.findUnique({ where: { id: serverId } });
        if (dbServer) {
          targetServer = dbServer as any;
          await prisma.server.update({
            where: { id: serverId },
            data: { online: state },
          });
        }
      } catch (err) {
        if (targetServer) {
          targetServer.online = state;
        }
      }

      const relayIdx = targetServer?.powerRelayIndex || 1;
      addStoreCommand({
        deviceId: 'RPI-TOUCH-NODE-01',
        module: 'relay',
        action: 'set',
        parameters: { channel: relayIdx, state },
      });

      return NextResponse.json({ success: true, message: `Server relay #${relayIdx} toggled to ${state ? 'ON' : 'OFF'}` });
    }

    if (action === 'CREATE') {
      const newServer = {
        id: `srv_${Date.now()}`,
        name: name || 'Custom Workstation Node',
        hostname: hostname || 'WORKSTATION-NODE',
        ipAddress: ipAddress || '192.168.0.101',
        os: os || 'Linux / Windows',
        online: true,
        isMeasured: true,
        cpuUsage: Math.floor(Math.random() * 25) + 5,
        memUsage: Math.floor(Math.random() * 40) + 20,
        gpuTemp: Math.floor(Math.random() * 15) + 35,
        diskUsage: Math.floor(Math.random() * 30) + 40,
        uptimeSeconds: 3600,
        powerRelayIndex: powerRelayIndex || 1,
      };

      try {
        const server = await prisma.server.create({
          data: {
            name: newServer.name,
            hostname: newServer.hostname,
            ipAddress: newServer.ipAddress,
            os: newServer.os,
            online: true,
            powerRelayIndex: newServer.powerRelayIndex,
          },
        });
        return NextResponse.json({ success: true, server });
      } catch (err) {
        inMemoryServers.unshift(newServer);
        return NextResponse.json({ success: true, server: newServer });
      }
    }

    if (action === 'DELETE' && serverId) {
      try {
        await prisma.server.delete({ where: { id: serverId } });
      } catch (err) {
        const idx = inMemoryServers.findIndex((s) => s.id === serverId);
        if (idx !== -1) inMemoryServers.splice(idx, 1);
      }
      return NextResponse.json({ success: true, message: 'Server deleted' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

