'use client';

import { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, Thermometer, Power, RefreshCw, Plus, Trash2, X } from 'lucide-react';

interface ServerData {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  os: string;
  online: boolean;
  isMeasured?: boolean;
  cpuUsage: number;
  memUsage: number;
  gpuTemp: number;
  diskUsage: number;
  uptimeSeconds: number;
  powerRelayIndex: number;
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [os, setOs] = useState('Ubuntu 24.04 LTS');
  const [relayIdx, setRelayIdx] = useState('1');

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers');
      const data = await res.json();
      if (data.success) {
        setServers(data.servers || []);
      }
    } catch (err) {
      console.error('Failed to fetch servers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePower = async (serverId: string, currentState: boolean) => {
    try {
      // Optimistic state update
      setServers((prev) =>
        prev.map((s) => (s.id === serverId ? { ...s, online: !currentState } : s))
      );
      await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_POWER', serverId, state: !currentState }),
      });
      fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    try {
      await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', serverId }),
      });
      fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          name: name || 'Custom Workstation',
          hostname: hostname || 'WORKSTATION-NEW',
          ipAddress: ipAddress || '192.168.0.120',
          os,
          powerRelayIndex: parseInt(relayIdx) || 1,
        }),
      });
      setShowModal(false);
      setName('');
      setHostname('');
      setIpAddress('');
      fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Server className="w-7 h-7 text-teal-400" />
            <span>Servers & PC Telemetry</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor workstation health and trigger hardware power relays via ESP32-S3 / Raspberry Pi.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchServers}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Workstation Node</span>
          </button>
        </div>
      </div>

      {/* Servers Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono">Loading telemetry...</div>
      ) : servers.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <Server className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No servers or workstation nodes registered.</p>
          <p className="text-xs text-slate-500">Click &quot;Add Workstation Node&quot; to assign a relay power line and monitor IP telemetry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servers.map((srv) => (
            <div
              key={srv.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 relative overflow-hidden backdrop-blur-md hover:border-slate-700 transition-all"
            >
              {/* Top Bar */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-slate-100">{srv.name}</h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                        srv.isMeasured
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {srv.isMeasured ? 'MEASURED' : 'INFERRED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {srv.hostname} ({srv.ipAddress}) • {srv.os}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      srv.online
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${srv.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{srv.online ? 'ONLINE' : 'OFFLINE'}</span>
                  </span>
                  <button
                    onClick={() => handleDeleteServer(srv.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Delete Node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Resource Gauge Bars */}
              <div className="space-y-4">
                {/* CPU */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                    <span className="flex items-center space-x-1">
                      <Cpu className="w-3.5 h-3.5 text-teal-400" />
                      <span>CPU Load</span>
                    </span>
                    <span className="font-mono text-slate-200">{(srv.cpuUsage || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (srv.cpuUsage || 0) > 80 ? 'bg-rose-500' : 'bg-teal-400'
                      }`}
                      style={{ width: `${Math.min(srv.cpuUsage || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Memory */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                    <span className="flex items-center space-x-1">
                      <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                      <span>Memory Load</span>
                    </span>
                    <span className="font-mono text-slate-200">{(srv.memUsage || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-500"
                      style={{ width: `${Math.min(srv.memUsage || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* GPU & Disk */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      <span>GPU Temp</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">{(srv.gpuTemp || 0).toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span>Disk Usage</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">{(srv.diskUsage || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Hardware Power Relay Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Relay #{srv.powerRelayIndex ?? 1} Power Line
                </span>
                <button
                  onClick={() => handleTogglePower(srv.id, srv.online)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    srv.online
                      ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{srv.online ? 'Power Off Relay' : 'Power On Relay'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Server Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <Server className="w-5 h-5 text-teal-400" />
                <span>Register Workstation Node</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Server Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Training Rig"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Hostname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WORKSTATION-02"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.0.120"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Operating System</label>
                  <select
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  >
                    <option value="Windows 11 Enterprise">Windows 11 Enterprise</option>
                    <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS</option>
                    <option value="Debian 12 Bookworm">Debian 12 Bookworm</option>
                    <option value="macOS Sequoia">macOS Sequoia</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Power Relay #</label>
                  <select
                    value={relayIdx}
                    onChange={(e) => setRelayIdx(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  >
                    <option value="1">Relay #1 (Main Power)</option>
                    <option value="2">Relay #2 (Aux Power)</option>
                    <option value="3">Relay #3 (Fan / Cooling)</option>
                    <option value="4">Relay #4 (Spare Relay)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
                >
                  Register Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

