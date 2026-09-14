'use client';

import { useState } from 'react';
import { Send, X, Terminal, CheckCircle2 } from 'lucide-react';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  onSuccess?: () => void;
}

export function CommandModal({ isOpen, onClose, deviceId, onSuccess }: CommandModalProps) {
  const [module, setModule] = useState('relay');
  const [action, setAction] = useState('set');
  const [channel, setChannel] = useState(1);
  const [state, setState] = useState(true);
  const [customParams, setCustomParams] = useState('{\n  "channel": 1,\n  "state": true\n}');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultMessage(null);

    let parsedParams = {};
    if (isCustomMode) {
      try {
        parsedParams = JSON.parse(customParams);
      } catch (err) {
        setResultMessage('Error: Invalid JSON parameters');
        setIsSubmitting(false);
        return;
      }
    } else {
      parsedParams = { channel: Number(channel), state: Boolean(state) };
    }

    try {
      const res = await fetch(`/api/v1/admin/devices/${deviceId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module,
          action,
          parameters: parsedParams,
          idempotency_key: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        }),
      });

      const data = await res.json();
      if (data.status === 'QUEUED') {
        setResultMessage(`Command ${data.command_id} queued successfully!`);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setResultMessage(null);
          onClose();
        }, 1500);
      } else {
        setResultMessage(`Error: ${data.error || 'Failed to queue command'}`);
      }
    } catch (err: any) {
      setResultMessage('Network error submitting command');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Dispatch Device Command</h2>
            <p className="text-xs text-slate-400 font-mono">Target: {deviceId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Module</label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Action</label>
              <input
                type="text"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-slate-400">Parameters Mode</span>
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-teal-400 hover:underline font-mono"
            >
              {isCustomMode ? 'Switch to Quick Builder' : 'Switch to Raw JSON'}
            </button>
          </div>

          {!isCustomMode ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Channel / Pin</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1"
                >
                  <option value={1}>Channel 1 (Relay 1)</option>
                  <option value={2}>Channel 2 (Relay 2)</option>
                  <option value={3}>Channel 3 (Relay 3)</option>
                  <option value={4}>Channel 4 (Relay 4)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Target State</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setState(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      state ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ON (TRUE)
                  </button>
                  <button
                    type="button"
                    onClick={() => setState(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      !state ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    OFF (FALSE)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={customParams}
                onChange={(e) => setCustomParams(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-teal-300 focus:border-teal-500 outline-none"
              />
            </div>
          )}

          {resultMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                resultMessage.startsWith('Error')
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{resultMessage}</span>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-teal-900/30 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Queueing...' : 'Dispatch Command'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
