import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateDeviceSecret } from '@/lib/security';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pairing_token, mac_address, chip_id, firmware_version, capabilities } = body;

    if (!pairing_token || !mac_address || !chip_id) {
      return NextResponse.json({ error: 'Missing pairing parameters' }, { status: 400 });
    }

    // Verify pairing token
    const tokenRecord = await prisma.pairingToken.findFirst({
      where: { token: pairing_token, expiresAt: { gt: new Date() } },
    });

    if (!tokenRecord) {
      await logAuditEvent({
        action: 'device.pair',
        payload: { mac_address, chip_id },
        result: 'REJECTED_INVALID_PAIRING_TOKEN',
      });
      return NextResponse.json({ error: 'Invalid or expired pairing token' }, { status: 401 });
    }

    // Assign device ID
    const count = await prisma.device.count();
    const deviceId = `HOME-CTRL-${String(count + 1).padStart(3, '0')}`;
    const deviceSecret = generateDeviceSecret();

    // Upsert Device Record
    const device = await prisma.device.upsert({
      where: { macAddress: mac_address },
      update: {
        deviceId,
        chipId: chip_id,
        firmwareVersion: firmware_version || '1.0.0',
        registrationStatus: 'ACTIVE',
        capabilitiesJson: JSON.stringify(capabilities || []),
        lastHeartbeat: new Date(),
      },
      create: {
        deviceId,
        macAddress: mac_address,
        chipId: chip_id,
        firmwareVersion: firmware_version || '1.0.0',
        name: `Controller ${deviceId}`,
        registrationStatus: 'ACTIVE',
        capabilitiesJson: JSON.stringify(capabilities || []),
        lastHeartbeat: new Date(),
      },
    });

    // Save Device Credentials
    await prisma.deviceCredential.create({
      data: {
        deviceId: device.deviceId,
        secretHash: deviceSecret, // Secret key stored for HMAC SHA256 validation
      },
    });

    // Create Initial Device Configuration
    await prisma.configuration.create({
      data: {
        deviceId: device.deviceId,
        version: 1,
        configJson: JSON.stringify({
          reporting_interval: 30,
          display: { brightness: 100, timeout_sec: 300 },
          modules: { relay_1: { enabled: true, pin: 18 } },
        }),
      },
    });

    // Delete used pairing token
    await prisma.pairingToken.delete({ where: { id: tokenRecord.id } });

    await logAuditEvent({
      deviceId: device.deviceId,
      action: 'device.pair',
      payload: { mac_address, chip_id, firmware_version },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      status: 'APPROVED',
      device_id: device.deviceId,
      device_secret: deviceSecret,
      config: {
        reporting_interval: 30,
        config_version: 1,
      },
    });
  } catch (error: any) {
    console.error('[Pairing API Error]', error);
    return NextResponse.json({ error: 'Internal server error during pairing' }, { status: 500 });
  }
}
