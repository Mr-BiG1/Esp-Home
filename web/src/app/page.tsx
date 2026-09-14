'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PairingModal } from '@/components/PairingModal';
import { CommandModal } from '@/components/CommandModal';
import { Cpu, Wifi, Activity, ShieldCheck, Plus, Power, Signal, Clock, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [selectedDeviceForCommand, setSelectedDeviceForCommand] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [devRes, auditRes] = await Promise.all([
        fetch('/api/v1/admin/devices'),
        fetch('/api/v1/admin/audit-logs'),
      ]);
      const devData = await devRes.json();
      const auditData = await auditRes.json();

      if (devData.devices) setDevices(devData.devices);
      if (auditData.logs) setAuditLogs(auditData.logs.slice(0, 6));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = devices.filter((d) => d.wifiStatus === 'ONLINE').length;
  const totalCount = devices.length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header
        title="Smart Home Platform"
        subtitle="Edge Controller Platform & Vercel Management Plane"
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="p-5 glass-card rounded-2xl flex items-center space-x-4 border-l-4 border-l-teal-500">
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Controllers</p>
              <p className="text-2xl font-bold text-slate-100">{totalCount}</p>
            </div>
          </div>

          <div className="p-5 glass-card rounded-2xl flex items-center space-x-4 border-l-4 border-l-emerald-500">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Online Edge Devices</p>
              <p className="text-2xl font-bold text-emerald-400">{onlineCount} <span className="text-xs text-slate-400 font-normal">/ {totalCount}</span></p>
            </div>
          </div>

          <div className="p-5 glass-card rounded-2xl flex items-center space-x-4 border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cloud Sync Transport</p>
              <p className="text-base font-semibold text-slate-200">HTTPS Polling</p>
              <p className="text-xs text-slate-400">30s backoff window</p>
            </div>
          </div>

          <div className="p-5 glass-card rounded-2xl flex items-center space-x-4 border-l-4 border-l-indigo-500">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Security State</p>
              <p className="text-base font-semibold text-emerald-400">HMAC-SHA256 Active</p>
              <p className="text-xs text-slate-400">Per-device Secrets</p>
            </div>
          </div>
        </div>

        {/* Controllers Grid Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-xl font-bold text-slate-100">ESP32-S3 Controllers</h2>
            <p className="text-xs text-slate-400">Hardware controllers actively registered with cloud management plane</p>
          </div>

          <button
            onClick={() => setIsPairingOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-teal-950"
          >
            <Plus className="w-4 h-4" />
            <span>Pair New Controller</span>
          </button>
        </div>

        {/* Controller Grid */}
        {devices.length === 0 ? (
          <div className="p-12 glass-card rounded-2xl text-center space-y-4 max-w-lg mx-auto my-8">
            <Cpu className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
            <h3 className="text-base font-semibold text-slate-200">No Controllers Paired Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a pairing code using the button above and input it into your ESP32-S3 boot setup to register your physical controller.
            </p>
            <button
              onClick={() => setIsPairingOpen(true)}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-xl transition"
            >
              Generate Pairing Token
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => {
              const isOnline = device.wifiStatus === 'ONLINE';
              const relays = device.state?.relay || { relay_1: false, relay_2: false };

              return (
                <div
                  key={device.deviceId}
                  className="glass-card rounded-2xl p-6 space-y-5 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-teal-400 font-semibold">{device.deviceId}</span>
                      <h3 className="text-base font-bold text-slate-100">{device.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">MAC: {device.macAddress}</p>
                    </div>

                    <div
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        isOnline
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-rose-950/80 text-rose-400 border-rose-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                        }`}
                      ></span>
                      <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                  </div>

                  {/* Device Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <Signal className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">RSSI:</span>
                      <span className="font-mono text-slate-200">{device.wifiSignalRssi ?? -65} dBm</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">Firmware:</span>
                      <span className="font-mono text-slate-200">v{device.firmwareVersion}</span>
                    </div>
                  </div>

                  {/* Quick Hardware Controls */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-slate-400">Hardware Relays (Local State)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedDeviceForCommand(device.deviceId)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                          relays.relay_1
                            ? 'bg-teal-950/70 border-teal-600/50 text-teal-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center space-x-1.5">
                          <Power className={`w-3.5 h-3.5 ${relays.relay_1 ? 'text-teal-400' : 'text-slate-500'}`} />
                          <span>Relay 1</span>
                        </span>
                        <span className="font-mono text-xs">{relays.relay_1 ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedDeviceForCommand(device.deviceId)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                          relays.relay_2
                            ? 'bg-teal-950/70 border-teal-600/50 text-teal-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center space-x-1.5">
                          <Power className={`w-3.5 h-3.5 ${relays.relay_2 ? 'text-teal-400' : 'text-slate-500'}`} />
                          <span>Relay 2</span>
                        </span>
                        <span className="font-mono text-xs">{relays.relay_2 ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setSelectedDeviceForCommand(device.deviceId)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
                    >
                      Dispatch Command
                    </button>

                    <Link
                      href={`/devices/${device.deviceId}`}
                      className="flex items-center space-x-1 text-teal-400 hover:text-teal-300 text-xs font-medium"
                    >
                      <span>Device Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Security Audit Feed */}
        <div className="glass-card rounded-2xl p-6 space-y-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Security Audit Trail</h2>
              <p className="text-xs text-slate-400">Real-time immutable log of device actions and cloud requests</p>
            </div>
            <Link href="/audit" className="text-xs text-teal-400 hover:underline">
              View All Audit Logs →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase font-mono">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Device / User</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      No security audit events logged yet
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3 text-teal-400 font-semibold">{log.action}</td>
                      <td className="p-3 text-slate-200">{log.deviceId || log.userName || 'System'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.result.includes('SUCCESS') || log.result === 'QUEUED' || log.result === 'EXECUTED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {log.result}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PairingModal isOpen={isPairingOpen} onClose={() => setIsPairingOpen(false)} />
      {selectedDeviceForCommand && (
        <CommandModal
          isOpen={!!selectedDeviceForCommand}
          onClose={() => setSelectedDeviceForCommand(null)}
          deviceId={selectedDeviceForCommand}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
