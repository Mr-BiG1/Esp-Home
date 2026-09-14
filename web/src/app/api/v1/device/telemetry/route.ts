import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { upsertStoreDevice } from '@/lib/device_store';

export async function POST(request: Request) {
  const bodyText = await request.text();
  const deviceId = request.headers.get('X-Device-ID') || 'HOME-CTRL-441';

  try {
    const body = JSON.parse(bodyText);
    
    // Update live device status in store
    upsertStoreDevice({
      deviceId: body.device_id || deviceId,
      state: body,
      wifiStatus: 'ONLINE',
      lastHeartbeat: new Date().toISOString(),
    });

    try {
      const telemetry_batch = body.telemetry_batch || [];
      if (Array.isArray(telemetry_batch)) {
        for (const item of telemetry_batch) {
          if (item.telemetry_type && item.payload) {
            await prisma.deviceTelemetry.create({
              data: {
                deviceId,
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

    return NextResponse.json({ status: 'ACCEPTED' });
  } catch (err: any) {
    console.error('[Telemetry Error]', err);
    return NextResponse.json({ status: 'ACCEPTED' });
  }
}
