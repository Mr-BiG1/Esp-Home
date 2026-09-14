'use client';

import { useState, useEffect } from 'react';
import { Zap, Play, Power, Plus, ShieldCheck } from 'lucide-react';

interface RuleItem {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  actionType: string;
  lastTriggeredAt: string | null;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<RuleItem[]>([]);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.success) setRules(data.rules);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleRule = async (id: string, enabled: boolean) => {
    try {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE', id, enabled: !enabled }),
      });
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
          <Zap className="w-7 h-7 text-amber-400" />
          <span>Automation Rule Engine</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Define event-driven mesh rules (IF trigger condition THEN executing node action).
        </p>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-base font-bold text-slate-100">{rule.name}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                    rule.enabled
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                IF <span className="text-amber-300">{rule.triggerType}</span> THEN <span className="text-teal-300">{rule.actionType}</span>
              </p>
            </div>

            <button
              onClick={() => toggleRule(rule.id, rule.enabled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                rule.enabled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {rule.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
