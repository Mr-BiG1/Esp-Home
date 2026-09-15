import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inMemoryCanvas, addStoreCommand } from '@/lib/device_store';

export async function GET() {
  try {
    const canvas = await prisma.layoutCanvas.findFirst({ where: { isDefault: true } });
    if (canvas && canvas.widgetsJson) {
      return NextResponse.json({ success: true, canvas: { widgets: JSON.parse(canvas.widgetsJson) } });
    }
  } catch (error: any) {
    // Fallback to in-memory store
  }
  return NextResponse.json({ success: true, canvas: { widgets: inMemoryCanvas } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, widgetsJson, widgets } = body;
    const finalJson = widgetsJson || JSON.stringify(widgets || inMemoryCanvas);

    try {
      const canvas = await prisma.layoutCanvas.upsert({
        where: { id: body.id || 'default-canvas' },
        update: { name, widgetsJson: finalJson, updatedAt: new Date() },
        create: {
          id: 'default-canvas',
          name: name || 'Main TFT Screen 320x240',
          widgetsJson: finalJson,
          isDefault: true,
        },
      });

      // Dispatch layout push command to Pi node
      addStoreCommand({
        deviceId: 'RPI-TOUCH-NODE-01',
        module: 'display',
        action: 'UPDATE_LAYOUT',
        parameters: { widgets: JSON.parse(finalJson) },
      });

      return NextResponse.json({ success: true, canvas });
    } catch (err) {
      if (widgets && Array.isArray(widgets)) {
        inMemoryCanvas.length = 0;
        inMemoryCanvas.push(...widgets);
      } else if (widgetsJson) {
        const parsed = JSON.parse(widgetsJson);
        inMemoryCanvas.length = 0;
        inMemoryCanvas.push(...parsed);
      }

      addStoreCommand({
        deviceId: 'RPI-TOUCH-NODE-01',
        module: 'display',
        action: 'UPDATE_LAYOUT',
        parameters: { widgets: inMemoryCanvas },
      });

      return NextResponse.json({ success: true, canvas: { widgets: inMemoryCanvas } });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

