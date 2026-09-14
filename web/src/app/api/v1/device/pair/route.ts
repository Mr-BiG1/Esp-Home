import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateDeviceSecret, verifyInMemoryToken, removeInMemoryToken } from '@/lib/security';
import { logAuditEvent } from '@/lib/audit';
import { upsertStoreDevice } from '@/lib/device_store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pairing_token, mac_address, chip_id, firmware_version, capabilities } = body;

    if (!pairing_token || !mac_address || !chip_id) {
      return NextResponse.json({ error: 'Missing pairing parameters' }, { status: 400 });
    }

    // Verify pairing token (Check DB & in-memory fallback store for Vercel)
    let isTokenValid = verifyInMemoryToken(pairing_token);
    let tokenRecord = null;

    if (!isTokenValid) {
      try {
        tokenRecord = await prisma.pairingToken.findFirst({
          where: { token: pairing_token, expiresAt: { gt: new Date() } },
        });
        if (tokenRecord) isTokenValid = true;
      } catch (e) {
        console.warn('[Pairing DB Find Warn]:', e);
      }
    }

    if (!isTokenValid) {
      await logAuditEvent({
        action: 'device.pair',
        payload: { mac_address, chip_id },
        result: 'REJECTED_INVALID_PAIRING_TOKEN',
      });
      return NextResponse.json({ error: 'Invalid or expired pairing token' }, { status: 401 });
    }

    // Assign device ID
    let count = 0;
    try {
      count = await prisma.device.count();
    } catch (e) {
      count = Math.floor(Math.random() * 800) + 1;
    }

    const deviceId = `HOME-CTRL-${String(count + 1).padStart(3, '0')}`;
    const deviceSecret = generateDeviceSecret();

    try {
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
          secretHash: deviceSecret,
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

      if (tokenRecord) {
        await prisma.pairingToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      }
    } catch (dbErr) {
      console.warn('[Pairing DB Upsert Warning - serverless fallback active]:', dbErr);
    }

    removeInMemoryToken(pairing_token);

    // Register device in in-memory store for instant Web UI visibility on Vercel
    upsertStoreDevice({
      deviceId,
      macAddress: mac_address,
      chipId: chip_id,
      firmwareVersion: firmware_version || '2.1.0-RPI',
      name: `Raspberry Pi Node (${deviceId})`,
      deviceType: 'RASPBERRY-PI-TOUCH',
      location: 'Smart Home Mesh',
      registrationStatus: 'ACTIVE',
      capabilities: capabilities || ['relay_1', 'relay_2', 'relay_3', 'relay_4', 'temp_sensor', 'touch_ui'],
    });

    await logAuditEvent({
      deviceId,
      action: 'device.pair',
      payload: { mac_address, chip_id, firmware_version },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      status: 'APPROVED',
      device_id: deviceId,
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
