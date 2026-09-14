import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { generatePairingToken } from '@/lib/security';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  const user = getCurrentUser(request);
  if (!hasPermission(user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Requires Admin role' }, { status: 403 });
  }

  try {
    const token = generatePairingToken();
    // Valid for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const record = await prisma.pairingToken.create({
      data: { token, expiresAt },
    });

    await logAuditEvent({
      userId: user.userId,
      action: 'admin.create_pairing_token',
      payload: { token: record.token, expiresAt },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      pairing_token: record.token,
      expires_at: record.expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[Pairing Token Generation Error]', err);
    return NextResponse.json({ error: 'Failed to create pairing token' }, { status: 500 });
  }
}
