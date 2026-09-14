import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { inMemoryDevices } from '@/lib/device_store';

export async function GET(request: Request) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'VIEWER')) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  const deviceMap = new Map<string, any>();

  // Load from in-memory fallback store
  inMemoryDevices.forEach((dev, key) => {
    deviceMap.set(key, dev);
  });

  try {
    const devices = await prisma.device.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        states: true,
        modules: true,
      },
    });

    const now = Date.now();
    devices.forEach((d) => {
      const lastSeen = d.lastHeartbeat ? new Date(d.lastHeartbeat).getTime() : 0;
      const isOnline = lastSeen > 0 && now - lastSeen < 120 * 1000;

      deviceMap.set(d.deviceId, {
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
      });
    });
  } catch (err: any) {
    console.warn('[Admin Devices DB Lookup Warning - fallback active]', err);
  }

  return NextResponse.json({ devices: Array.from(deviceMap.values()) });
}
