import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inMemoryTasks } from '@/lib/device_store';

export async function GET() {
  try {
    const tasks = await prisma.taskItem.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: true, tasks: inMemoryTasks });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, text, category, priority } = body;

    if (action === 'TOGGLE' && id) {
      try {
        const existing = await prisma.taskItem.findUnique({ where: { id } });
        if (existing) {
          const updated = await prisma.taskItem.update({
            where: { id },
            data: { completed: !existing.completed },
          });
          return NextResponse.json({ success: true, task: updated });
        }
      } catch (err) {
        // Fallback
      }

      const t = inMemoryTasks.find((x) => x.id === id);
      if (t) t.completed = !t.completed;
      return NextResponse.json({ success: true, task: t });
    }

    if (action === 'DELETE' && id) {
      try {
        await prisma.taskItem.delete({ where: { id } });
      } catch (err) {
        const idx = inMemoryTasks.findIndex((x) => x.id === id);
        if (idx !== -1) inMemoryTasks.splice(idx, 1);
      }
      return NextResponse.json({ success: true, message: 'Task deleted' });
    }

    if ((action === 'CREATE' || !action) && text) {
      const newTask = {
        id: `task_${Date.now()}`,
        text,
        category: category || 'General',
        priority: priority ?? 1,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      try {
        const task = await prisma.taskItem.create({
          data: {
            text: newTask.text,
            category: newTask.category,
            priority: newTask.priority,
          },
        });
        return NextResponse.json({ success: true, task });
      } catch (err) {
        inMemoryTasks.unshift(newTask);
        return NextResponse.json({ success: true, task: newTask });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

