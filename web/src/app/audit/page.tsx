'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ShieldAlert, RefreshCw, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/audit-logs');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header
        title="Security Audit Logs"
        subtitle="Immutable security trail of per-device requests, authentication events, and administrative commands"
        onRefresh={fetchLogs}
        isRefreshing={isLoading}
      />

      <div className="p-8 space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Audit History ({logs.length})</h2>
            <p className="text-xs text-slate-400">Cryptographically tracked operations and authentication checks</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Actor (Device / User)</th>
                <th className="p-4">Result Status</th>
                <th className="p-4">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No security audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess =
                    log.result === 'SUCCESS' || log.result === 'QUEUED' || log.result === 'EXECUTED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-teal-400">{log.action}</td>
                      <td className="p-4 text-slate-200">
                        {log.deviceId ? (
                          <span className="text-teal-300 font-bold">{log.deviceId}</span>
                        ) : (
                          <span>{log.userName || 'System'}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{log.result}</span>
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        <pre className="text-[11px] bg-slate-950 p-2 rounded border border-slate-800/80 text-teal-300/90 max-w-md overflow-x-auto">
                          {log.payload ? JSON.stringify(log.payload, null, 2) : '{}'}
                        </pre>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
