'use client';

import { useState } from 'react';
import { KeyRound, Copy, Check, Clock, X } from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PairingModal({ isOpen, onClose }: PairingModalProps) {
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/devices/pair-token', { method: 'POST' });
      const data = await res.json();
      if (data.pairing_token) {
        setPairingToken(data.pairing_token);
        setExpiresAt(new Date(data.expires_at).toLocaleTimeString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pairingToken) {
      navigator.clipboard.writeText(pairingToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Register New Controller</h2>
            <p className="text-xs text-slate-400">Generate secure 15-minute pairing code for ESP32</p>
          </div>
        </div>

        {!pairingToken ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-300">
              When a new ESP32-S3 boots up in un-paired mode, enter this pairing token into its setup terminal or display interface to establish hardware credentials.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-teal-900/30 flex items-center justify-center space-x-2"
            >
              {isLoading ? 'Generating Token...' : 'Generate Pairing Token'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-slate-950 border border-teal-500/40 rounded-xl text-center space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Pairing Code</span>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl font-bold font-mono text-teal-400 tracking-widest">
                  {pairingToken}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                  title="Copy Token"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-center space-x-1 text-xs text-amber-400 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires at {expiresAt}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              The pairing token will automatically expire after 15 minutes. Once paired, unique cryptographic keys will be stored in the ESP32 NVS flash.
            </p>

            <button
              onClick={() => {
                setPairingToken(null);
                onClose();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
