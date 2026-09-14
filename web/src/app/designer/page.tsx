'use client';

import { useState } from 'react';
import { Palette, Save, Layout, Eye, Cpu } from 'lucide-react';

interface Widget {
  id: string;
  type: string; // 'header', 'temp_card', 'relay_card', 'status_badge'
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export default function DesignerPage() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'w1', type: 'header', x: 0, y: 0, w: 320, h: 26, label: 'SMART HOME MESH' },
    { id: 'w2', type: 'temp_card', x: 10, y: 34, w: 145, h: 90, label: '22.5°C CLIMATE' },
    { id: 'w3', type: 'relay_card', x: 165, y: 34, w: 145, h: 90, label: 'RELAY 1 (MAIN)' },
    { id: 'w4', type: 'relay_card', x: 10, y: 132, w: 145, h: 80, label: 'RELAY 2 (AUX)' },
  ]);

  const [saving, setSaving] = useState(false);

  const saveLayout = async () => {
    setSaving(true);
    try {
      await fetch('/api/designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '320x240 Custom Screen', widgetsJson: JSON.stringify(widgets) }),
      });
      alert('TFT Screen Layout saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Palette className="w-7 h-7 text-teal-400" />
            <span>320×240 TFT Visual Display Designer</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pixel-accurate canvas editor matching physical 3.2" SPI ILI9341 display constraints.
          </p>
        </div>
        <button
          onClick={saveLayout}
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Canvas to ESP32'}</span>
        </button>
      </div>

      {/* Screen Canvas Container */}
      <div className="flex justify-center p-8 bg-slate-950 rounded-2xl border border-slate-800">
        <div className="relative border-2 border-teal-500/50 shadow-2xl rounded-lg bg-[#0841] overflow-hidden" style={{ width: 320 * 2, height: 240 * 2 }}>
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Rendered Widgets */}
          {widgets.map((w) => (
            <div
              key={w.id}
              style={{
                left: w.x * 2,
                top: w.y * 2,
                width: w.w * 2,
                height: w.h * 2,
              }}
              className="absolute bg-[#10A3]/90 border border-teal-400/40 rounded p-2 flex flex-col justify-between text-teal-300 font-mono text-xs shadow-md select-none"
            >
              <div className="flex items-center justify-between border-b border-teal-500/20 pb-1">
                <span className="font-bold truncate">{w.label}</span>
                <span className="text-[10px] text-slate-400">({w.w}x{w.h})</span>
              </div>
              <div className="text-[10px] text-slate-500">x:{w.x}, y:{w.y}</div>
            </div>
          ))}

          {/* Resolution Badge */}
          <div className="absolute bottom-2 right-2 bg-slate-900/90 text-teal-400 font-mono text-xs px-2 py-1 rounded border border-teal-500/30">
            320 x 240 (Scaled 2x)
          </div>
        </div>
      </div>
    </div>
  );
}
