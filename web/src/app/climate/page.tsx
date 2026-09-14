'use client';

import { useState, useEffect } from 'react';
import { Thermometer, Droplets, ShieldCheck, Flame, Power, Plus, Minus, RefreshCw } from 'lucide-react';

interface ClimateZoneData {
  id: string;
  name: string;
  targetTemp: number;
  currentTemp: number;
  currentHumidity: number;
  mode: string;
  hysteresis: number;
  safetyStatus: string;
  isMeasured: boolean;
}

export default function ClimatePage() {
  const [zones, setZones] = useState<ClimateZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/climate');
      const data = await res.json();
      if (data.success) {
        setZones(data.zones);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateZone = async (zoneId: string, updates: Partial<ClimateZoneData>) => {
    try {
      await fetch('/api/climate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, ...updates }),
      });
      fetchZones();
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
            <Thermometer className="w-7 h-7 text-amber-400" />
            <span>Climate & Thermostat Control</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Safety-first environmental control loop with hysteresis and min/max cycle trip protection.
          </p>
        </div>
        <button
          onClick={fetchZones}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Climate Zones Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono">Loading climate zones...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 relative overflow-hidden backdrop-blur-md"
            >
              {/* Zone Title & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">{zone.name}</h2>
                  <span className="text-xs text-slate-500 font-mono">
                    Hysteresis: ±{zone.hysteresis}°C • Hardware Relay #2
                  </span>
                </div>
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    zone.safetyStatus === 'OK'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{zone.safetyStatus}</span>
                </span>
              </div>

              {/* Temperature & Humidity Gauges */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Ambient */}
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    <span>Current Temp</span>
                  </span>
                  <div className="text-3xl font-extrabold text-slate-100 font-mono my-2">
                    {zone.currentTemp.toFixed(1)}°C
                  </div>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    <span>Humidity: {zone.currentHumidity.toFixed(0)}%</span>
                  </span>
                </div>

                {/* Target Setpoint Controls */}
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-xs font-medium text-slate-400">Target Setpoint</span>
                  <div className="text-3xl font-extrabold text-teal-400 font-mono my-2">
                    {zone.targetTemp.toFixed(1)}°C
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateZone(zone.id, { targetTemp: zone.targetTemp - 0.5 })}
                      className="flex-1 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 flex justify-center items-center font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateZone(zone.id, { targetTemp: zone.targetTemp + 0.5 })}
                      className="flex-1 p-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg flex justify-center items-center font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thermostat Mode Selector */}
              <div>
                <span className="text-xs font-medium text-slate-400 mb-2 block">Thermostat Mode</span>
                <div className="grid grid-cols-4 gap-2">
                  {['AUTO', 'BOOST', 'MANUAL', 'OFF'].map((m) => (
                    <button
                      key={m}
                      onClick={() => updateZone(zone.id, { mode: m })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        zone.mode === m
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
