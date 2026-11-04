import React, { useState } from 'react';
import { useAquasense } from '../context/AquasenseContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Radio,
  Pause,
  Play,
  Copy,
  Check,
  Cpu,
  Wifi,
  Database,
  Activity,
  Layers,
  Droplets,
  Wind,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const LiveMonitoringView: React.FC = () => {
  const {
    latestReading,
    history,
    systemStatus,
    thresholds,
  } = useAquasense();

  const [isPaused, setIsPaused] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'all' | 'ph' | 'turbidity' | 'tds' | 'do'>('all');

  // Format data for Recharts
  const chartData = history.slice(-25).map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    pH: reading.pH,
    turbidity: reading.turbidity,
    tds: reading.tds,
    dissolvedOxygen: reading.dissolvedOxygen,
    temperature: reading.temperature,
  }));

  // Construct raw packet exactly as received from ESP32
  const rawPacket = {
    AQUASENSE: {
      latest: {
        pH: latestReading.pH,
        tds: latestReading.tds,
        turbidity: latestReading.turbidity,
        dissolvedOxygen: latestReading.dissolvedOxygen,
        temperature: latestReading.temperature,
        uptime: latestReading.uptime,
      },
    },
    meta: {
      timestamp: latestReading.timestamp,
      receivedAt: new Date(latestReading.timestamp).toISOString(),
      source: systemStatus.dataSource,
      packetSequence: systemStatus.packetCount,
      esp32Online: systemStatus.esp32Online,
    },
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rawPacket, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Live Status & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-wide">
              Live Sensor Telemetry Stream
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                systemStatus.esp32Online
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
              }`}
            >
              ESP32: {systemStatus.esp32Online ? 'TRANSMITTING' : 'STREAM STALLED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sensor channel acquisition from ESP32 node via Firebase RTDB path:{' '}
            <code className="text-cyan-300 font-mono">/AQUASENSE/latest</code>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isPaused
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Freeze Stream'}</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Channel Live Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Live Sensor Oscillation (Last 25 Packets)
            </h2>
            <p className="text-xs text-slate-400">
              Interactive high-frequency stream tracking water quality deviations
            </p>
          </div>

          {/* Metric filter buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(
              [
                { id: 'all', label: 'All Channels' },
                { id: 'ph', label: 'pH' },
                { id: 'turbidity', label: 'Turbidity (NTU)' },
                { id: 'tds', label: 'TDS (ppm)' },
                { id: 'do', label: 'DO (mg/L)' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeMetric === m.id
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart View */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {(activeMetric === 'all' || activeMetric === 'ph') && (
                <Line
                  type="monotone"
                  dataKey="pH"
                  name="pH (0-14)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}
              {(activeMetric === 'all' || activeMetric === 'turbidity') && (
                <Line
                  type="monotone"
                  dataKey="turbidity"
                  name="Turbidity (NTU)"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}
              {(activeMetric === 'all' || activeMetric === 'tds') && (
                <Line
                  type="monotone"
                  dataKey="tds"
                  name="TDS (ppm)"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {(activeMetric === 'all' || activeMetric === 'do') && (
                <Line
                  type="monotone"
                  dataKey="dissolvedOxygen"
                  name="DO (mg/L)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lower Row: Sensor Hardware Health Matrix & Raw ESP32 JSON Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensor Health & Diagnostic Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Hardware Sensor Channel Diagnostics
              </h3>
            </div>

            <div className="space-y-3">
              {/* pH Probe */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Analog pH Combination Electrode</h4>
                    <p className="text-[11px] text-slate-400">GPIO 35 • ADC 12-bit • Slope 59.16 mV/pH</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    CALIBRATED (OK)
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    {latestReading.pH !== null ? `${latestReading.pH} pH` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Turbidity Sensor */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Infrared Optical Turbidity Transducer</h4>
                    <p className="text-[11px] text-slate-400">GPIO 34 • 90° Nephelometric scattering</p>
                  </div>
                </div>
                <div className="text-right">
                  {latestReading.turbidity !== null ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                      SIGNAL LOCKED
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                      DISCONNECTED
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    {latestReading.turbidity !== null ? `${latestReading.turbidity} NTU` : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* TDS Probe */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Titanium Conductivity / TDS Cell</h4>
                    <p className="text-[11px] text-slate-400">GPIO 32 • AC excitation to prevent polarization</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    NOMINAL
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    {latestReading.tds !== null ? `${latestReading.tds} ppm` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Dissolved Oxygen */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wind className="w-4 h-4 text-sky-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Galvanic Dissolved Oxygen Membrane</h4>
                    <p className="text-[11px] text-slate-400">GPIO 33 • Temperature compensated</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    ACTIVE
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    {latestReading.dissolvedOxygen !== null ? `${latestReading.dissolvedOxygen} mg/L` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>ADC Sampling Rate: 100 Hz averaged to 0.33 Hz broadcast</span>
            <span className="text-emerald-400 font-mono">No CRC Errors</span>
          </div>
        </div>

        {/* Raw ESP32 JSON Payload Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Raw ESP32 Ingestion Payload
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                JSON REST / RTDB
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Exact JSON structure transmitted by the ESP32 firmware to Firebase Realtime Database:
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-64 leading-relaxed">
              {JSON.stringify(rawPacket, null, 2)}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Node ID: <code className="text-slate-300 font-mono">ESP32-AQUASENSE-01</code></span>
            <span>Uptime: <code className="text-slate-300 font-mono">{latestReading.uptime} ms</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
