import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Requires Admin permission to revoke devices' }, { status: 403 });
  }

  const { deviceId } = params;

  try {
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Revoke device credentials & set registration status
    await prisma.deviceCredential.updateMany({
      where: { deviceId },
      data: { isRevoked: true },
    });

    await prisma.device.update({
      where: { deviceId },
      data: { registrationStatus: 'REVOKED' },
    });

    await logAuditEvent({
      userId: user.userId,
      deviceId,
      action: 'admin.revoke_device',
      payload: { deviceId },
      result: 'REVOKED',
    });

    return NextResponse.json({ status: 'REVOKED', device_id: deviceId });
  } catch (err: any) {
    console.error('[Revoke Device Error]', err);
    return NextResponse.json({ error: 'Failed to revoke device' }, { status: 500 });
  }
}
