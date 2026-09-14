import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Developer mode requires Admin access' }, { status: 403 });
  }

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
    console.error('[Developer Modules Error]', err);
    return NextResponse.json({ error: 'Failed to fetch developer modules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Developer mode requires Admin access' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { deviceId, moduleKey, name, version, config } = body;

    if (!deviceId || !moduleKey || !name) {
      return NextResponse.json({ error: 'Missing module parameters' }, { status: 400 });
    }

    const moduleRecord = await prisma.deviceModule.upsert({
      where: { deviceId_moduleKey: { deviceId, moduleKey } },
      update: {
        name,
        version: version || '1.0.0',
        configJson: JSON.stringify(config || {}),
        status: 'ACTIVE',
      },
      create: {
        deviceId,
        moduleKey,
        name,
        version: version || '1.0.0',
        configJson: JSON.stringify(config || {}),
        status: 'ACTIVE',
      },
    });

    await logAuditEvent({
      userId: user.userId,
      deviceId,
      action: 'developer.register_module',
      payload: { moduleKey, name, version },
      result: 'SUCCESS',
    });

    return NextResponse.json({ status: 'REGISTERED', module: moduleRecord });
  } catch (err: any) {
    console.error('[Developer Register Module Error]', err);
    return NextResponse.json({ error: 'Failed to register module' }, { status: 500 });
  }
}
