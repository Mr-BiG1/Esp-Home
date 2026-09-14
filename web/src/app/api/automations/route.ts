import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const rules = await prisma.automationRule.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, enabled, name, triggerType, triggerConditionJson, actionType, actionPayloadJson } = body;

    if (action === 'TOGGLE' && id) {
      const updated = await prisma.automationRule.update({
        where: { id },
        data: { enabled },
      });
      return NextResponse.json({ success: true, rule: updated });
    }

    if (action === 'CREATE') {
      const rule = await prisma.automationRule.create({
        data: {
          name,
          enabled: true,
          triggerType,
          triggerConditionJson,
          actionType,
          actionPayloadJson,
        },
      });
      return NextResponse.json({ success: true, rule });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
