import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { generatePairingToken, registerInMemoryToken } from '@/lib/security';
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

    // Register token in memory fallback store for serverless environments (Vercel)
    registerInMemoryToken(token, expiresAt);

    try {
      await prisma.pairingToken.create({
        data: { token, expiresAt },
      });
    } catch (dbErr) {
      console.warn('[PairingToken DB Creation Warning - memory fallback active]:', dbErr);
    }

    await logAuditEvent({
      userId: user.userId,
      action: 'admin.create_pairing_token',
      payload: { token, expiresAt },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      pairing_token: token,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[Pairing Token Generation Error]', err);
    return NextResponse.json({ error: 'Failed to create pairing token' }, { status: 500 });
  }
}
