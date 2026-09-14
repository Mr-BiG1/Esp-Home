import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyDeviceSignature } from '@/lib/security';

export async function POST(request: Request) {
  const requestBodyText = await request.text();
  const deviceId = request.headers.get('X-Device-ID') || '';
  const timestamp = request.headers.get('X-Timestamp') || '';
  const nonce = request.headers.get('X-Nonce') || '';
  const signature = request.headers.get('X-Signature') || '';

  // Cryptographic Signature & Auth Verification
  const auth = await verifyDeviceSignature(deviceId, timestamp, nonce, signature, requestBodyText);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = JSON.parse(requestBodyText);
    const { wifi_rssi, ip_address, uptime_seconds, config_version, module_states } = body;

    // Update Device Status in DB
    const device = await prisma.device.update({
      where: { deviceId },
      data: {
        wifiSignalRssi: wifi_rssi ?? null,
        ipAddress: ip_address ?? null,
        uptimeSeconds: uptime_seconds ? BigInt(uptime_seconds) : BigInt(0),
        wifiStatus: wifi_rssi ? 'ONLINE' : 'DISCONNECTED',
        lastHeartbeat: new Date(),
      },
    });

    // Save/Update Module States if provided
    if (module_states) {
      await prisma.deviceState.upsert({
        where: { deviceId },
        update: { stateJson: JSON.stringify(module_states) },
        create: { deviceId, stateJson: JSON.stringify(module_states) },
      });
    }

    // Check pending commands
    const pendingCount = await prisma.command.count({
      where: { deviceId, status: 'PENDING', expiresAt: { gt: new Date() } },
    });

    const isOutdated = device.configVersion > (config_version || 0);

    return NextResponse.json({
      server_time: new Date().toISOString(),
      pending_command_count: pendingCount,
      config_outdated: isOutdated,
      latest_config_version: device.configVersion,
    });
  } catch (err: any) {
    console.error('[Heartbeat Error]', err);
    return NextResponse.json({ error: 'Failed to process heartbeat' }, { status: 500 });
  }
}
