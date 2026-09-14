'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { CommandModal } from '@/components/CommandModal';
import { Cpu, Wifi, ShieldAlert, Terminal, Power, Activity, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import Link from 'next/link';

export default function DeviceDetailPage({ params }: { params: { deviceId: string } }) {
  const { deviceId } = params;
  const [device, setDevice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/devices');
      const data = await res.json();
      if (data.devices) {
        const found = data.devices.find((d: any) => d.deviceId === deviceId);
        setDevice(found || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [deviceId]);

  if (!device && !isLoading) {
    return (
      <div className="flex-1 bg-slate-950 p-8 space-y-4">
        <Link href="/devices" className="text-teal-400 text-xs flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" /> <span>Back to Devices</span>
        </Link>
        <div className="p-8 glass-card rounded-2xl text-center text-slate-400">
          Device {deviceId} not found.
        </div>
      </div>
    );
  }

  const isOnline = device?.wifiStatus === 'ONLINE';
  const relays = device?.state?.relay || { relay_1: false, relay_2: false };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header
        title={`Device Inspector: ${deviceId}`}
        subtitle="Hardware state telemetry, active modules, and raw configuration"
        onRefresh={fetchDetails}
        isRefreshing={isLoading}
      />

      <div className="p-8 space-y-8 flex-1">
        <Link href="/devices" className="text-teal-400 text-xs flex items-center space-x-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> <span>Back to Device Manager</span>
        </Link>

        {/* Top Header Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-100">{device?.name}</h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono border ${
                    isOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono pt-1">
                ID: {device?.deviceId} | MAC: {device?.macAddress} | Firmware: v{device?.firmwareVersion}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-teal-950 flex items-center space-x-2"
            >
              <Terminal className="w-4 h-4" />
              <span>Dispatch Command</span>
            </button>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hardware Relays & State */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm border-b border-slate-800 pb-3">
              <Power className="w-4 h-4 text-teal-400" />
              <span>Hardware Relay State</span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-300">Relay Channel 1</span>
                  <p className="text-[11px] text-slate-500 font-mono">GPIO 18</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                    relays.relay_1 ? 'bg-teal-950 text-teal-300 border border-teal-700' : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {relays.relay_1 ? 'ACTIVE (ON)' : 'OFF'}
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-300">Relay Channel 2</span>
                  <p className="text-[11px] text-slate-500 font-mono">GPIO 19</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                    relays.relay_2 ? 'bg-teal-950 text-teal-300 border border-teal-700' : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {relays.relay_2 ? 'ACTIVE (ON)' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm border-b border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Live Telemetry Metrics</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Wi-Fi Signal (RSSI):</span>
                <span className="text-slate-200">{device?.wifiSignalRssi ?? -65} dBm</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">IP Address:</span>
                <span className="text-slate-200">{device?.ipAddress || '192.168.1.150'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Uptime:</span>
                <span className="text-slate-200">{device?.uptimeSeconds} seconds</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Config Version:</span>
                <span className="text-slate-200">v{device?.configVersion}</span>
              </div>
            </div>
          </div>

          {/* Enabled Modules */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Active Hardware Modules</span>
            </div>

            <div className="space-y-2">
              {(device?.capabilities || ['relay', 'sensor_temp', 'tft_display']).map((cap: string) => (
                <div key={cap} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300">{cap}</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-bold">READY</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCommandOpen && (
        <CommandModal
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          deviceId={deviceId}
          onSuccess={fetchDetails}
        />
      )}
    </div>
  );
}
