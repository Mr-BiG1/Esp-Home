import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const canvas = await prisma.layoutCanvas.findFirst({ where: { isDefault: true } });
    return NextResponse.json({ success: true, canvas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, widgetsJson } = body;

    const canvas = await prisma.layoutCanvas.upsert({
      where: { id: body.id || 'default-canvas' },
      update: { name, widgetsJson, updatedAt: new Date() },
      create: {
        id: 'default-canvas',
        name: name || 'Main TFT Screen 320x240',
        widgetsJson: widgetsJson || '[]',
        isDefault: true,
      },
    });

    return NextResponse.json({ success: true, canvas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
