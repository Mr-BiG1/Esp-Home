'use client';

import { useState } from 'react';
import { Settings, Shield, Key, Wifi, RefreshCw, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
  const [pairingToken, setPairingToken] = useState('A1B2-C3D4-E5F6');
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    const newToken = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                     Math.random().toString(36).substring(2, 6).toUpperCase();
    setPairingToken(newToken);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(pairingToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
          <Settings className="w-7 h-7 text-teal-400" />
          <span>System Settings & Security</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage hardware pairing tokens, HMAC-SHA256 secrets, and global platform parameters.
        </p>
      </div>

      {/* Device Pairing Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Key className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">ESP32-S3 Hardware Pairing Token</h2>
            <p className="text-xs text-slate-400">Scan code on TFT screen or enter generated token to pair new controllers.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
          <span className="text-2xl font-extrabold text-teal-400 tracking-wider flex-1">{pairingToken}</span>
          <button
            onClick={copyToken}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center space-x-1"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={generateToken}
            className="p-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-xs flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Generate New</span>
          </button>
        </div>
      </div>

      {/* HMAC Security Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">HMAC-SHA256 Signature Policy</h2>
            <p className="text-xs text-slate-400">All command execution payloads require strict cryptographic verification.</p>
          </div>
        </div>
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1 text-slate-400">
          <div>• Algorithm: HMAC-SHA256</div>
          <div>• Header: X-Signature, X-Timestamp, X-Nonce</div>
          <div>• Max Timestamp Drift: 300 seconds (Anti-replay window)</div>
        </div>
      </div>
    </div>
  );
}
