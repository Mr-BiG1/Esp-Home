'use client';

import { useState, useEffect } from 'react';
import { Zap, Play, Power, Plus, Trash2, X, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface RuleItem {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerConditionJson: string;
  actionType: string;
  actionPayloadJson: string;
  lastTriggeredAt?: string | null;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('TEMP_ABOVE');
  const [triggerVal, setTriggerVal] = useState('25.0');
  const [actionType, setActionType] = useState('RELAY_TOGGLE');
  const [relayChannel, setRelayChannel] = useState('1');

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.success) setRules(data.rules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const deleteRule = async (id: string) => {
    try {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', id }),
      });
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          name: name || 'Custom Temperature Rule',
          triggerType,
          triggerConditionJson: JSON.stringify({ val: parseFloat(triggerVal) || 25.0 }),
          actionType,
          actionPayloadJson: JSON.stringify({ channel: parseInt(relayChannel) || 1, state: true }),
        }),
      });
      setShowModal(false);
      setName('');
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Zap className="w-7 h-7 text-amber-400" />
            <span>Automation Rule Engine</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Define event-driven mesh rules (IF trigger condition THEN executing node action).
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Automation Rule</span>
        </button>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono">Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <Zap className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No automation rules configured yet.</p>
          <p className="text-xs text-slate-500">Click &quot;Add Automation Rule&quot; to create your first automated condition.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:border-slate-700 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-base font-bold text-slate-100">{rule.name}</h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                      rule.enabled
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  IF <span className="text-amber-300 font-bold">{rule.triggerType}</span> THEN{' '}
                  <span className="text-teal-300 font-bold">{rule.actionType}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleRule(rule.id, rule.enabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    rule.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Create Automation Rule</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turn On Cooling when > 28°C"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Trigger Condition</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="TEMP_ABOVE">Temp Above (°C)</option>
                    <option value="TEMP_BELOW">Temp Below (°C)</option>
                    <option value="SCHEDULE">Time Schedule</option>
                    <option value="MOTION">Motion Sensor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Trigger Value</label>
                  <input
                    type="text"
                    value={triggerVal}
                    onChange={(e) => setTriggerVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="RELAY_TOGGLE">Toggle Hardware Relay</option>
                    <option value="ALERT_ADMIN">Send Cloud Alert</option>
                    <option value="THERMOSTAT_BOOST">Boost Thermostat</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Relay Channel</label>
                  <select
                    value={relayChannel}
                    onChange={(e) => setRelayChannel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="1">Relay #1 (Main)</option>
                    <option value="2">Relay #2 (Aux)</option>
                    <option value="3">Relay #3 (Fan)</option>
                    <option value="4">Relay #4 (Spare)</option>
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

