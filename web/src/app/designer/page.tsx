'use client';

import { useState, useEffect } from 'react';
import { Palette, Save, Layout, Plus, Trash2, Sliders, CheckCircle2 } from 'lucide-react';

interface Widget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
}

export default function DesignerPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchCanvas = async () => {
    try {
      const res = await fetch('/api/designer');
      const data = await res.json();
      if (data.success && data.canvas?.widgets) {
        setWidgets(data.canvas.widgets);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCanvas();
  }, []);

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

  const addWidget = (type: string) => {
    const id = `w_${Date.now()}`;
    let newW: Widget;
    if (type === 'header') {
      newW = { id, type: 'header', title: 'SMART HOME MESH', x: 0, y: 0, w: 320, h: 26, color: '#00d2ff' };
    } else if (type === 'temp_card') {
      newW = { id, type: 'temp_card', title: 'CLIMATE SENSOR', x: 10, y: 34, w: 145, h: 90, color: '#ffab00' };
    } else if (type === 'relay_card') {
      newW = { id, type: 'relay_card', title: 'RELAY SWITCH', x: 165, y: 34, w: 145, h: 42, color: '#2ed573' };
    } else {
      newW = { id, type: 'status', title: 'SYSTEM OK', x: 10, y: 132, w: 145, h: 42, color: '#00d2ff' };
    }
    setWidgets((prev) => [...prev, newW]);
    setSelectedWidgetId(id);
  };

  const updateSelectedWidget = (key: keyof Widget, val: any) => {
    if (!selectedWidgetId) return;
    setWidgets((prev) =>
      prev.map((w) => (w.id === selectedWidgetId ? { ...w, [key]: val } : w))
    );
  };

  const deleteSelectedWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const saveLayout = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      await fetch('/api/designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '320x240 Custom Screen', widgets }),
      });
      setStatusMsg('Layout pushed to Raspberry Pi Display Node!');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to save layout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Palette className="w-7 h-7 text-teal-400" />
            <span>320×240 TFT Visual Display Designer</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pixel-accurate canvas editor matching physical 3.2&quot; SPI ILI9341 & Raspberry Pi Touch constraints.
          </p>
        </div>
        <button
          onClick={saveLayout}
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20"
        >
          <Save className="w-4 h-4 stroke-[2.5]" />
          <span>{saving ? 'Pushing to Screen...' : 'Save & Push to Pi Screen'}</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400 text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Screen Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-mono text-slate-400">Add Element to Canvas:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => addWidget('header')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-lg border border-slate-700"
              >
                + Header
              </button>
              <button
                onClick={() => addWidget('temp_card')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg border border-slate-700"
              >
                + Climate
              </button>
              <button
                onClick={() => addWidget('relay_card')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold rounded-lg border border-slate-700"
              >
                + Relay Switch
              </button>
            </div>
          </div>

          <div className="flex justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 overflow-auto">
            <div
              className="relative border-2 border-teal-500/50 shadow-2xl rounded-lg bg-[#0c1220] overflow-hidden select-none"
              style={{ width: 320 * 1.8, height: 240 * 1.8 }}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:18px_18px]" />

              {/* Rendered Widgets */}
              {widgets.map((w) => {
                const isSel = w.id === selectedWidgetId;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWidgetId(w.id)}
                    style={{
                      left: w.x * 1.8,
                      top: w.y * 1.8,
                      width: w.w * 1.8,
                      height: w.h * 1.8,
                      borderColor: isSel ? '#00d2ff' : w.color || '#40585a',
                    }}
                    className={`absolute bg-slate-900/90 border-2 rounded p-2 flex flex-col justify-between text-xs font-mono shadow-md cursor-pointer transition-all ${
                      isSel ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 z-20' : 'hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
                      <span className="font-bold truncate text-slate-100" style={{ color: w.color }}>
                        {w.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({w.w}x{w.h})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Pos: x:{w.x}, y:{w.y}
                    </div>
                  </div>
                );
              })}

              {/* Resolution Badge */}
              <div className="absolute bottom-2 right-2 bg-slate-900/90 text-teal-400 font-mono text-[10px] px-2 py-1 rounded border border-teal-500/30">
                320 x 240 Canvas (Scale 1.8x)
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Widget Inspector Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Widget Properties</span>
            </h3>
            {selectedWidget && (
              <button
                onClick={() => deleteSelectedWidget(selectedWidget.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Remove Element"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedWidget ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Widget Title</label>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => updateSelectedWidget('title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">X Position</label>
                  <input
                    type="number"
                    value={selectedWidget.x}
                    onChange={(e) => updateSelectedWidget('x', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Y Position</label>
                  <input
                    type="number"
                    value={selectedWidget.y}
                    onChange={(e) => updateSelectedWidget('y', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={selectedWidget.w}
                    onChange={(e) => updateSelectedWidget('w', parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={selectedWidget.h}
                    onChange={(e) => updateSelectedWidget('h', parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Accent Theme Color</label>
                <div className="flex space-x-2">
                  {['#00d2ff', '#2ed573', '#ffab00', '#ff4757', '#a55eea'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSelectedWidget('color', c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        selectedWidget.color === c ? 'scale-110 ring-2 ring-white' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 font-mono text-xs">
              Click any element on the canvas to inspect & edit position metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

