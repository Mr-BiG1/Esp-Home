import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inMemoryRules } from '@/lib/device_store';

export async function GET() {
  try {
    const rules = await prisma.automationRule.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    return NextResponse.json({ success: true, rules: inMemoryRules });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, enabled, name, triggerType, triggerConditionJson, actionType, actionPayloadJson } = body;

    if (action === 'TOGGLE' && id) {
      try {
        const updated = await prisma.automationRule.update({
          where: { id },
          data: { enabled },
        });
        return NextResponse.json({ success: true, rule: updated });
      } catch (err) {
        const r = inMemoryRules.find((x) => x.id === id);
        if (r) r.enabled = enabled;
        return NextResponse.json({ success: true, rule: r });
      }
    }

    if (action === 'CREATE') {
      const newRule = {
        id: `rule_${Date.now()}`,
        name: name || 'New Automation Rule',
        enabled: true,
        triggerType: triggerType || 'TEMP_ABOVE',
        triggerConditionJson: triggerConditionJson || JSON.stringify({ temp: 25.0 }),
        actionType: actionType || 'RELAY_TOGGLE',
        actionPayloadJson: actionPayloadJson || JSON.stringify({ channel: 1, state: true }),
        createdAt: new Date().toISOString(),
      };

      try {
        const rule = await prisma.automationRule.create({
          data: {
            name: newRule.name,
            enabled: true,
            triggerType: newRule.triggerType,
            triggerConditionJson: newRule.triggerConditionJson,
            actionType: newRule.actionType,
            actionPayloadJson: newRule.actionPayloadJson,
          },
        });
        return NextResponse.json({ success: true, rule });
      } catch (err) {
        inMemoryRules.unshift(newRule);
        return NextResponse.json({ success: true, rule: newRule });
      }
    }

    if (action === 'DELETE' && id) {
      try {
        await prisma.automationRule.delete({ where: { id } });
      } catch (err) {
        const idx = inMemoryRules.findIndex((x) => x.id === id);
        if (idx !== -1) inMemoryRules.splice(idx, 1);
      }
      return NextResponse.json({ success: true, message: 'Rule deleted' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

