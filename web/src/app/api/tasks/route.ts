import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const tasks = await prisma.taskItem.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, text, category, priority } = body;

    if (action === 'TOGGLE' && id) {
      const existing = await prisma.taskItem.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

      const updated = await prisma.taskItem.update({
        where: { id },
        data: {
          completed: !existing.completed,
          completedAt: !existing.completed ? new Date() : null,
        },
      });
      return NextResponse.json({ success: true, task: updated });
    }

    if (action === 'CREATE' && text) {
      const task = await prisma.taskItem.create({
        data: {
          text,
          category: category || 'General',
          priority: priority ?? 1,
        },
      });
      return NextResponse.json({ success: true, task });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
