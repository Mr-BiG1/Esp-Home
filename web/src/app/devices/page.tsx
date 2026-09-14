'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PairingModal } from '@/components/PairingModal';
import { CommandModal } from '@/components/CommandModal';
import { Cpu, Wifi, ShieldAlert, Plus, Power, Key, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [selectedDeviceForCommand, setSelectedDeviceForCommand] = useState<string | null>(null);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/devices');
      const data = await res.json();
      if (data.devices) setDevices(data.devices);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRevoke = async (deviceId: string) => {
    if (!confirm(`Are you sure you want to REVOKE credentials for ${deviceId}? The device will be blocked from accessing the cloud.`)) return;

    try {
      const res = await fetch(`/api/v1/admin/devices/${deviceId}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'REVOKED') {
        alert(`Device ${deviceId} revoked.`);
        fetchDevices();
      }
    } catch (e) {
      alert('Error revoking device');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header
        title="Device Management"
        subtitle="Manage ESP32 edge controllers, pair new hardware, and rotate credentials"
        onRefresh={fetchDevices}
        isRefreshing={isLoading}
      />

      <div className="p-8 space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Controller Fleet ({devices.length})</h2>
            <p className="text-xs text-slate-400">All edge nodes enrolled with the management plane</p>
          </div>

          <button
            onClick={() => setIsPairingOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-teal-950"
          >
            <Plus className="w-4 h-4" />
            <span>Pair Controller</span>
          </button>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-4">Device ID</th>
                <th className="p-4">Name / Location</th>
                <th className="p-4">Hardware Info</th>
                <th className="p-4">Status</th>
                <th className="p-4">Config Ver</th>
                <th className="p-4">Last Heartbeat</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No edge controllers found. Click &quot;Pair Controller&quot; to add your first device.
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isOnline = device.wifiStatus === 'ONLINE';
                  const isRevoked = device.registrationStatus === 'REVOKED';

                  return (
                    <tr key={device.deviceId} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 font-bold text-teal-400">
                        <Link href={`/devices/${device.deviceId}`} className="hover:underline">
                          {device.deviceId}
                        </Link>
                      </td>
                      <td className="p-4 font-sans">
                        <div className="font-semibold text-slate-200">{device.name}</div>
                        <div className="text-xs text-slate-400">{device.location || 'Unassigned'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-300">MAC: {device.macAddress}</div>
                        <div className="text-slate-500 text-[11px]">Chip: {device.chipId}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isRevoked
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : isOnline
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {isRevoked ? 'REVOKED' : isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">v{device.configVersion}</td>
                      <td className="p-4 text-slate-400">
                        {device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedDeviceForCommand(device.deviceId)}
                          disabled={isRevoked}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans transition disabled:opacity-50"
                        >
                          Command
                        </button>
                        <button
                          onClick={() => handleRevoke(device.deviceId)}
                          disabled={isRevoked}
                          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-sans transition disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PairingModal isOpen={isPairingOpen} onClose={() => setIsPairingOpen(false)} />
      {selectedDeviceForCommand && (
        <CommandModal
          isOpen={!!selectedDeviceForCommand}
          onClose={() => setSelectedDeviceForCommand(null)}
          deviceId={selectedDeviceForCommand}
          onSuccess={fetchDevices}
        />
      )}
    </div>
  );
}
