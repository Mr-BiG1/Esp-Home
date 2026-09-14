import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyDeviceSignature } from '@/lib/security';
import { logAuditEvent } from '@/lib/audit';

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
    const { command_id, status, error_code, error_message, execution_time_ms } = body;

    if (!command_id || !status) {
      return NextResponse.json({ error: 'Missing command ACK parameters' }, { status: 400 });
    }

    const command = await prisma.command.findUnique({ where: { commandId: command_id } });
    if (!command) {
      return NextResponse.json({ error: 'Command ID not found' }, { status: 404 });
    }

    // Update command status
    await prisma.command.update({
      where: { commandId: command_id },
      data: { status },
    });

    // Record command result
    await prisma.commandResult.upsert({
      where: { commandId: command_id },
      update: {
        status,
        errorCode: error_code || null,
        errorMessage: error_message || null,
        executionTimeMs: execution_time_ms || null,
        executedAt: new Date(),
      },
      create: {
        commandId: command_id,
        deviceId,
        status,
        errorCode: error_code || null,
        errorMessage: error_message || null,
        executionTimeMs: execution_time_ms || null,
      },
    });

    await logAuditEvent({
      deviceId,
      action: 'command.ack',
      payload: { command_id, status, execution_time_ms },
      result: status,
    });

    return NextResponse.json({ status: 'ACKNOWLEDGED' });
  } catch (err: any) {
    console.error('[Command ACK Error]', err);
    return NextResponse.json({ error: 'Failed to process command ACK' }, { status: 500 });
  }
}
