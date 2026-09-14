import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const zones = await prisma.climateZone.findMany();
    return NextResponse.json({ success: true, zones });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { zoneId, targetTemp, mode } = body;

    if (!zoneId) return NextResponse.json({ success: false, error: 'Zone ID required' }, { status: 400 });

    const updateData: any = {};
    if (targetTemp !== undefined) updateData.targetTemp = targetTemp;
    if (mode !== undefined) updateData.mode = mode;

    const updated = await prisma.climateZone.update({
      where: { id: zoneId },
      data: updateData,
    });

    return NextResponse.json({ success: true, zone: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
