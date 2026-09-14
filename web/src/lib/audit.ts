import { prisma } from './db';

export async function logAuditEvent(params: {
  userId?: string | null;
  deviceId?: string | null;
  action: string;
  payload?: any;
  result: string;
  sourceIp?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        deviceId: params.deviceId ?? null,
        action: params.action,
        payloadJson: params.payload ? JSON.stringify(params.payload) : null,
        result: params.result,
        sourceIp: params.sourceIp ?? null,
      },
    });
  } catch (err) {
    console.error('[AuditLog Error]', err);
  }
}
