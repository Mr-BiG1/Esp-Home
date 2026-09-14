import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyDeviceSignature } from '@/lib/security';

export async function POST(request: Request) {
  const bodyText = await request.text();
  const deviceId = request.headers.get('X-Device-ID') || '';
  const timestamp = request.headers.get('X-Timestamp') || '';
  const nonce = request.headers.get('X-Nonce') || '';
  const signature = request.headers.get('X-Signature') || '';

  const auth = await verifyDeviceSignature(deviceId, timestamp, nonce, signature, bodyText);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = JSON.parse(bodyText);
    const { telemetry_batch } = body;

    if (!Array.isArray(telemetry_batch)) {
      return NextResponse.json({ error: 'telemetry_batch must be an array' }, { status: 400 });
    }

    let count = 0;
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
        count++;
      }
    }

    return NextResponse.json({ status: 'ACCEPTED', items_processed: count });
  } catch (err: any) {
    console.error('[Telemetry Error]', err);
    return NextResponse.json({ error: 'Failed to record telemetry batch' }, { status: 500 });
  }
}
