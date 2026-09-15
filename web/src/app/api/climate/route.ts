import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inMemoryClimate, addStoreCommand } from '@/lib/device_store';

export async function GET() {
  try {
    const zones = await prisma.climateZone.findMany();
    if (zones && zones.length > 0) return NextResponse.json({ success: true, zones });
  } catch (error: any) {
    // Fallback
  }
  return NextResponse.json({ success: true, zones: inMemoryClimate });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { zoneId, targetTemp, mode } = body;

    if (!zoneId) return NextResponse.json({ success: false, error: 'Zone ID required' }, { status: 400 });

    let updatedZone: any = null;

    try {
      const updateData: any = {};
      if (targetTemp !== undefined) updateData.targetTemp = targetTemp;
      if (mode !== undefined) updateData.mode = mode;

      updatedZone = await prisma.climateZone.update({
        where: { id: zoneId },
        data: updateData,
      });
    } catch (err) {
      const zone = inMemoryClimate.find((z) => z.id === zoneId);
      if (zone) {
        if (targetTemp !== undefined) zone.targetTemp = targetTemp;
        if (mode !== undefined) zone.mode = mode;
        updatedZone = zone;
      }
    }

    if (updatedZone) {
      addStoreCommand({
        deviceId: 'RPI-TOUCH-NODE-01',
        module: 'climate',
        action: 'SET_SETPOINT',
        parameters: { targetTemp: updatedZone.targetTemp, mode: updatedZone.mode },
      });
    }

    return NextResponse.json({ success: true, zone: updatedZone });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

