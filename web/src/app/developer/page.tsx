'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Terminal, Code, Cpu, Plus, Layers, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DeveloperPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for registering new module
  const [deviceId, setDeviceId] = useState('RPI-TOUCH-NODE-01');
  const [moduleKey, setModuleKey] = useState('sensor.temperature.bme280');
  const [name, setName] = useState('BME280 Temp & Humidity Sensor');
  const [version, setVersion] = useState('1.0.0');
  const [configJson, setConfigJson] = useState('{\n  "i2c_address": "0x76",\n  "sampling_rate_sec": 30\n}');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);


  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/developer/modules');
      const data = await res.json();
      if (data.modules) setModules(data.modules);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleRegisterModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(configJson);
    } catch (e) {
      setStatusMessage('Error: Invalid JSON configuration format');
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/developer/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          moduleKey,
          name,
          version,
          config: parsedConfig,
        }),
      });

      const data = await res.json();
      if (data.status === 'REGISTERED') {
        setStatusMessage(`Module "${moduleKey}" registered successfully!`);
        fetchModules();
      } else {
        setStatusMessage(`Error: ${data.error || 'Failed to register module'}`);
      }
    } catch (e) {
      setStatusMessage('Network error registering module');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header
        title="Developer Mode & Module Engine"
        subtitle="Protected sandbox to register future modules, inspect device telemetry, and test commands"
        onRefresh={fetchModules}
        isRefreshing={isLoading}
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Developer Mode Banner */}
        <div className="p-5 glass-card border border-teal-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Protected Developer Sandbox</h2>
              <p className="text-xs text-slate-400">
                Authorized for Administrator role. Dynamically register new device capabilities without rebuilding firmware core.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-teal-950 text-teal-300 font-mono text-xs font-bold rounded-lg border border-teal-700">
            DEV-MODE ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Module Registration Panel */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center space-x-2 text-slate-100 font-bold text-base border-b border-slate-800 pb-3">
              <Code className="w-5 h-5 text-teal-400" />
              <span>Register Hardware Module Definition</span>
            </div>

            <form onSubmit={handleRegisterModule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Target Controller ID</label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Module Key / ID</label>
                  <input
                    type="text"
                    value={moduleKey}
                    onChange={(e) => setModuleKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-300 focus:border-teal-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-400 block mb-1">Module Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Module Configuration Schema (JSON)</label>
                <textarea
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-teal-300 focus:border-teal-500 outline-none"
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    statusMessage.startsWith('Error')
                      ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-xs transition shadow-lg shadow-teal-950 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register Module Definition</span>
              </button>
            </form>
          </div>

          {/* Registered Modules Explorer */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-slate-100 font-bold text-base border-b border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Registered Module Inventory ({modules.length})</span>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {modules.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No custom modules registered yet. Use the form on the left to add a module definition.
                </div>
              ) : (
                modules.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-teal-400 font-bold">{m.moduleKey}</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">v{m.version}</span>
                    </div>
                    <div className="text-xs text-slate-200 font-semibold">{m.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Device: {m.deviceId} ({m.deviceName})</div>
                    <pre className="p-2 bg-slate-900 rounded text-[11px] font-mono text-teal-300/80 overflow-x-auto">
                      {JSON.stringify(m.config, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
