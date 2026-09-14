import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(request: Request) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'VIEWER')) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const devices = await prisma.device.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        states: true,
        modules: true,
      },
    });

    const now = Date.now();
    const formatted = devices.map((d) => {
      const lastSeen = d.lastHeartbeat ? new Date(d.lastHeartbeat).getTime() : 0;
      // Mark ONLINE if heartbeat within last 120 seconds
      const isOnline = lastSeen > 0 && now - lastSeen < 120 * 1000;

      return {
        id: d.id,
        deviceId: d.deviceId,
        macAddress: d.macAddress,
        chipId: d.chipId,
        firmwareVersion: d.firmwareVersion,
        name: d.name,
        deviceType: d.deviceType,
        location: d.location,
        registrationStatus: d.registrationStatus,
        lastHeartbeat: d.lastHeartbeat?.toISOString() || null,
        wifiStatus: isOnline ? 'ONLINE' : 'OFFLINE',
        ipAddress: d.ipAddress,
        wifiSignalRssi: d.wifiSignalRssi,
        uptimeSeconds: Number(d.uptimeSeconds),
        capabilities: JSON.parse(d.capabilitiesJson || '[]'),
        configVersion: d.configVersion,
        state: d.states[0] ? JSON.parse(d.states[0].stateJson) : {},
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ devices: formatted });
  } catch (err: any) {
    console.error('[Admin Devices List Error]', err);
    return NextResponse.json({ error: 'Failed to retrieve devices' }, { status: 500 });
  }
}
