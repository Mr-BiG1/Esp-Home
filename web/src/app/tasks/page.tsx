'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Plus, CheckCircle2, Circle, Flag, Trash2 } from 'lucide-react';

interface TaskItem {
  id: string;
  text: string;
  category: string;
  priority: number;
  completed: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('Maintenance');
  const [priority, setPriority] = useState('1');

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (id: string) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE', id }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', id }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          text: newText,
          category: newCategory,
          priority: parseInt(priority) || 1,
        }),
      });
      setNewText('');
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
          <CheckSquare className="w-7 h-7 text-sky-400" />
          <span>Task Board & Reminders</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Synchronized checklist mirrored directly to the ESP32-S3 TFT display Task Screen.
        </p>
      </div>

      {/* Add Task Form */}
      <form onSubmit={createTask} className="flex gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex-wrap md:flex-nowrap">
        <input
          type="text"
          placeholder="Add a new household or system maintenance task..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 min-w-[200px]"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="Maintenance">Maintenance</option>
          <option value="Hardware">Hardware</option>
          <option value="Software">Software</option>
          <option value="Network">Network</option>
          <option value="Sensors">Sensors</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="0 font-semibold">Low Priority</option>
          <option value="1">Medium Priority</option>
          <option value="2">High Priority</option>
        </select>
        <button
          type="submit"
          className="flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Task</span>
        </button>
      </form>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">All tasks completed! No pending items.</p>
          <p className="text-xs text-slate-500">Use the form above to add checklist items for your smart home mesh.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                task.completed
                  ? 'bg-slate-900/40 border-slate-800/40 text-slate-500'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                  {task.text}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg">
                  {task.category}
                </span>
                <Flag
                  className={`w-4 h-4 ${
                    task.priority === 2 ? 'text-rose-400' : task.priority === 1 ? 'text-amber-400' : 'text-sky-400'
                  }`}
                />
                <button
                  onClick={(e) => deleteTask(task.id, e)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

