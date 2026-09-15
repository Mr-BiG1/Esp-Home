import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { upsertStoreDevice, popStoreCommands } from '@/lib/device_store';

export async function POST(request: Request) {
  const bodyText = await request.text();
  const deviceId = request.headers.get('X-Device-ID') || 'HOME-CTRL-441';

  try {
    const body = JSON.parse(bodyText);
    const targetId = body.device_id || deviceId;
    
    // Update live device status in store
    upsertStoreDevice({
      deviceId: targetId,
      state: body,
      wifiStatus: 'ONLINE',
      lastHeartbeat: new Date().toISOString(),
    });

    // Pop any pending commands for this device
    const pendingCmds = popStoreCommands(targetId);

    try {
      const telemetry_batch = body.telemetry_batch || [];
      if (Array.isArray(telemetry_batch)) {
        for (const item of telemetry_batch) {
          if (item.telemetry_type && item.payload) {
            await prisma.deviceTelemetry.create({
              data: {
                deviceId: targetId,
                telemetryType: item.telemetry_type,
                payloadJson: JSON.stringify(item.payload),
                timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn('[Telemetry DB Save Warning - store fallback active]', e);
    }

    return NextResponse.json({ status: 'ACCEPTED', commands: pendingCmds });
  } catch (err: any) {
    console.error('[Telemetry Error]', err);
    return NextResponse.json({ status: 'ACCEPTED', commands: [] });
  }
}
