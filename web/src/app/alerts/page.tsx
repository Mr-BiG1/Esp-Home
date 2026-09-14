'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Check, CheckCheck } from 'lucide-react';

interface AlertItem {
  id: string;
  severity: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.success) setAlerts(data.alerts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const acknowledge = async (alertId: string) => {
    try {
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

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
          <Bell className="w-7 h-7 text-rose-400" />
          <span>System Alerts & Notifications</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time diagnostic stream from ESP32-S3, Raspberry Pi, and Desktop nodes.
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              alert.isRead ? 'bg-slate-900/40 border-slate-800/40 opacity-60' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              {alert.severity === 'WARNING' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <Info className="w-5 h-5 text-sky-400" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-200">{alert.message}</p>
                <span className="text-xs font-mono text-slate-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            {!alert.isRead && (
              <button
                onClick={() => acknowledge(alert.id)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
