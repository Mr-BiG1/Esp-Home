import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { inMemoryModules } from '@/lib/device_store';

export async function GET(request: Request) {
  try {
    const modules = await prisma.deviceModule.findMany({
      include: { device: { select: { deviceId: true, name: true } } },
    });

    const formatted = modules.map((m) => ({
      id: m.id,
      deviceId: m.deviceId,
      deviceName: m.device.name,
      moduleKey: m.moduleKey,
      name: m.name,
      version: m.version,
      config: JSON.parse(m.configJson || '{}'),
      status: m.status,
      updatedAt: m.updatedAt.toISOString(),
    }));

    return NextResponse.json({ modules: formatted });
  } catch (err: any) {
    const formatted = inMemoryModules.map((m) => ({
      id: m.id,
      deviceId: m.targetControllerId || 'RPI-TOUCH-NODE-01',
      deviceName: 'Raspberry Pi Touch Node',
      moduleKey: m.moduleKey,
      name: m.name,
      version: m.version,
      config: JSON.parse(m.configJson || '{}'),
      status: m.status || 'ACTIVE',
      updatedAt: m.updatedAt || new Date().toISOString(),
    }));
    return NextResponse.json({ modules: formatted });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, moduleKey, name, version, config } = body;

    const targetDevId = deviceId || 'RPI-TOUCH-NODE-01';
    const targetKey = moduleKey || `mod_${Date.now()}`;
    const targetName = name || 'Custom Hardware Module';
    const targetVersion = version || '1.0.0';
    const targetConfigJson = JSON.stringify(config || {});

    try {
      const moduleRecord = await prisma.deviceModule.upsert({
        where: { deviceId_moduleKey: { deviceId: targetDevId, moduleKey: targetKey } },
        update: {
          name: targetName,
          version: targetVersion,
          configJson: targetConfigJson,
          status: 'ACTIVE',
        },
        create: {
          deviceId: targetDevId,
          moduleKey: targetKey,
          name: targetName,
          version: targetVersion,
          configJson: targetConfigJson,
          status: 'ACTIVE',
        },
      });
      return NextResponse.json({ status: 'REGISTERED', module: moduleRecord });
    } catch (dbErr) {
      const newMod = {
        id: `mod_${Date.now()}`,
        targetControllerId: targetDevId,
        moduleKey: targetKey,
        name: targetName,
        version: targetVersion,
        configJson: targetConfigJson,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      };
      inMemoryModules.unshift(newMod);
      return NextResponse.json({ status: 'REGISTERED', module: newMod });
    }
  } catch (err: any) {
    console.error('[Developer Register Module Error]', err);
    return NextResponse.json({ error: 'Failed to register module' }, { status: 500 });
  }
}

