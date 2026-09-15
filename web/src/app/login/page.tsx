'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ShieldCheck, Lock, KeyRound, ArrowRight, Server, Cpu } from 'lucide-react';

export default function LoginPage() {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passphrase.trim()) {
      setError('Please enter your admin security passphrase.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Access Denied: Invalid Security Passphrase');
      }
    } catch (err) {
      setError('Connection failed. Please verify network access.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between p-6 relative overflow-hidden font-sans">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      {/* Top Header Logo */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-wide">Smart Home Mesh</h1>
            <p className="text-xs text-slate-400 font-mono">Cloud Admin & Controller Core</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Server className="w-3.5 h-3.5 text-teal-400" />
          <span>https://esp-home-inky.vercel.app</span>
        </div>
      </div>

      {/* Login Card Container */}
      <div className="max-w-md w-full mx-auto z-10 my-auto">
        <div className="glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 bg-slate-900/40 backdrop-blur-xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto text-teal-400">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 pt-2">Admin Security Portal</h2>
            <p className="text-xs text-slate-400">
              Enter your master administrative security passphrase to unlock system controls
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-2xl text-xs flex items-center space-x-3 animate-shake">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Master Security Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter admin passphrase..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-teal-950/50 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Unlock Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Session encrypted with SHA-256 HMAC & HTTP-Only cookie</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 z-10">
        Smart Home Controller Platform &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}
