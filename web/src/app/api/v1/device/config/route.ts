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
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const latestConfig = await prisma.configuration.findFirst({
      where: { deviceId, version: device.configVersion },
    });

    return NextResponse.json({
      version: device.configVersion,
      config: latestConfig ? JSON.parse(latestConfig.configJson) : {},
    });
  } catch (err: any) {
    console.error('[Get Config Error]', err);
    return NextResponse.json({ error: 'Failed to fetch device config' }, { status: 500 });
  }
}
