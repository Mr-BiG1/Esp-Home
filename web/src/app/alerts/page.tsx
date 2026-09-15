'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Check, CheckCheck, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface AlertItem {
  id: string;
  severity: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.success) setAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const acknowledge = async (alertId: string) => {
    try {
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACKNOWLEDGE', alertId }),
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_ALL' }),
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', alertId }),
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const simulateAlert = async () => {
    try {
      const msgs = [
        { severity: 'WARNING', message: 'Raspberry Pi thermal temp exceeded threshold 45°C' },
        { severity: 'INFO', message: 'ESP32-S3 node re-authenticated over HTTPS HMAC' },
        { severity: 'CRITICAL', message: 'Relay 1 hardware overload trip protective lockout' },
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', ...randomMsg }),
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter((a) => filter === 'ALL' || a.severity === filter);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Bell className="w-7 h-7 text-rose-400" />
            <span>System Alerts & Notifications</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time diagnostic stream from ESP32-S3, Raspberry Pi, and Desktop nodes.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={simulateAlert}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <span>Test Alert</span>
          </button>
          <button
            onClick={clearAll}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilter(sev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === sev
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Alerts Stream */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono">Loading alert stream...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No active alerts matching filter.</p>
          <p className="text-xs text-slate-500">Your smart home mesh network is operating nominal.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                alert.isRead ? 'bg-slate-900/40 border-slate-800/40 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {alert.severity === 'CRITICAL' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
                ) : alert.severity === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-slate-200">{alert.message}</p>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded font-mono font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!alert.isRead && (
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                )}
                <button
                  onClick={(e) => deleteAlert(alert.id, e)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Delete Alert"
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

