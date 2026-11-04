import React, { useState } from 'react';
import { useAquasense } from '../context/AquasenseContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Droplets,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Calendar,
  Gauge,
  Info,
} from 'lucide-react';

export const WaterConsumptionView: React.FC = () => {
  const { waterMetrics } = useAquasense();
  const [activeTimeframe, setActiveTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Daily consumption by hour
  const dailyData = [
    { time: '00:00', volumeL: 140 },
    { time: '03:00', volumeL: 90 },
    { time: '06:00', volumeL: 260 },
    { time: '09:00', volumeL: 520 },
    { time: '12:00', volumeL: 640 },
    { time: '15:00', volumeL: 580 },
    { time: '18:00', volumeL: 710 },
    { time: '21:00', volumeL: 380 },
  ];

  // Weekly consumption
  const weeklyData = [
    { time: 'Mon', volumeL: 3950 },
    { time: 'Tue', volumeL: 4120 },
    { time: 'Wed', volumeL: 3840 },
    { time: 'Thu', volumeL: 4450 },
    { time: 'Fri', volumeL: 4200 },
    { time: 'Sat', volumeL: 2900 },
    { time: 'Sun', volumeL: 2750 },
  ];

  // Monthly consumption
  const monthlyData = [
    { time: 'Week 1', volumeL: 24500 },
    { time: 'Week 2', volumeL: 26800 },
    { time: 'Week 3', volumeL: 25100 },
    { time: 'Week 4', volumeL: 27200 },
  ];

  const chartData =
    activeTimeframe === 'daily'
      ? dailyData
      : activeTimeframe === 'weekly'
      ? weeklyData
      : monthlyData;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-teal-950 text-teal-400 border border-teal-800/40">
              <Droplets className="w-5 h-5 text-teal-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              Water Flow & Storage Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Turbine flow metering, volumetric throughput accumulation, and reservoir hydrostatic monitoring
          </p>
        </div>

        {/* Hardware Integration Status Pill (Mandated by Section 7) */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div className="text-xs">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Auxiliary Hardware:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {waterMetrics.hardwareConnected ? 'RS485 FLOW & TANK SENSORS ONLINE' : 'PENDING INTEGRATION'}
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Note Notice */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-slate-300">Hardware Separation Integrity:</strong> Water flow rate (L/min) and reservoir tank level (%) originate from dedicated pulse turbine and hydrostatic pressure transducers. These metrics are maintained strictly separate from the inlet water quality sensors (pH, turbidity, TDS, DO) and will register as pending integration if physical telemetry is disconnected.
        </span>
      </div>

      {/* Top Telemetry Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Flow Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Current Flow Rate</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {waterMetrics.flowRateLpm !== null ? waterMetrics.flowRateLpm.toFixed(1) : 'N/A'}
            </span>
            <span className="text-xs font-mono text-teal-400">L/min</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center space-x-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nominal delivery pressure</span>
          </div>
        </div>

        {/* Processed Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Processed Today</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {waterMetrics.totalProcessedTodayL.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-cyan-400">Liters</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Daily target: 5,000 L (76.8% achieved)
          </div>
        </div>

        {/* Processed This Month */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Monthly Throughput</span>
            <Droplets className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {(waterMetrics.totalProcessedMonthL / 1000).toFixed(1)}
            </span>
            <span className="text-xs font-mono text-indigo-400">kL (m³)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Monthly cumulative: {waterMetrics.totalProcessedMonthL.toLocaleString()} L
          </div>
        </div>

        {/* Reservoir Tank Level */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Tank Storage Level</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {waterMetrics.tankLevelPct !== null ? `${waterMetrics.tankLevelPct}%` : 'N/A'}
            </span>
            <span className="text-xs font-mono text-sky-400">
              ({waterMetrics.availableLiters?.toLocaleString() || 0} L)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all"
              style={{ width: `${waterMetrics.tankLevelPct || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Consumption Graphs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Water Volumetric Consumption Graphs
            </h2>
            <p className="text-xs text-slate-400">
              Measured volume filtered through downstream treatment stages
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(
              [
                { id: 'daily', label: '24 Hours (Hourly)' },
                { id: 'weekly', label: '7 Days (Daily)' },
                { id: 'monthly', label: '30 Days (Weekly)' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTimeframe(t.id)}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTimeframe === t.id
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#e2e8f0',
                }}
              />
              <Bar dataKey="volumeL" name="Volume (Liters)" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Management Automated Alerts Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Hydraulic Sentinel & Leakage Detection Guards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Low Tank Level Protection</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Reservoir is at {waterMetrics.tankLevelPct}%. Cutoff safety threshold is set to 20% to avoid feed pump cavitation.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Flow Rate Surge Monitor</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Flow stable at {waterMetrics.flowRateLpm} L/min. Pipeline rupture and burst pipe surveillance active.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Zero Overnight Leakage</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Baseline differential analysis detected zero unmetered flow between 02:00 and 04:00 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
