import React, { useState } from 'react';
import { useAquasense } from '../context/AquasenseContext';
import { FirebaseConfigState, ThresholdConfig } from '../types/aquasense';
import {
  Settings,
  Database,
  Sliders,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  FlaskConical,
  ShieldAlert,
  Info,
  Server,
  Cpu,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    firebaseConfig,
    updateFirebaseConfig,
    systemStatus,
    thresholds,
    updateThresholds,
    setDataSource,
    injectSimulatedScenario,
    reconnectFirebase,
  } = useAquasense();

  // Local form states
  const [fbForm, setFbForm] = useState<FirebaseConfigState>(firebaseConfig);
  const [threshForm, setThreshForm] = useState<ThresholdConfig>(thresholds);
  const [fbSaveNotice, setFbSaveNotice] = useState<string | null>(null);
  const [threshSaveNotice, setThreshSaveNotice] = useState<string | null>(null);

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    updateFirebaseConfig(fbForm);
    setFbSaveNotice('Firebase configuration saved! Reconnecting to Realtime Database...');
    setTimeout(() => setFbSaveNotice(null), 3000);
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(threshForm);
    setThreshSaveNotice('Operational screening limits updated successfully!');
    setTimeout(() => setThreshSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <Settings className="w-5 h-5 text-cyan-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              System Settings & IoT Gateway Configuration
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure Firebase Realtime Database parameters, operational screening thresholds, and ESP32 telemetry controls
          </p>
        </div>

        {/* Data Source Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setDataSource('FIREBASE_LIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              systemStatus.dataSource === 'FIREBASE_LIVE'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Firebase Live Mode
          </button>
          <button
            onClick={() => setDataSource('DEMO_SIMULATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              systemStatus.dataSource === 'DEMO_SIMULATION'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demo Simulation Mode
          </button>
        </div>
      </div>

      {/* Connection Diagnostics Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Firebase Realtime Database & Node Telemetry Diagnostics</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">RTDB Status:</span>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemStatus.firebaseConnected
                    ? 'bg-emerald-400'
                    : systemStatus.firebaseConnecting
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-white font-bold">
                {systemStatus.firebaseConnected
                  ? 'CONNECTED (RTDB LIVE)'
                  : systemStatus.firebaseConnecting
                  ? 'CONNECTING...'
                  : 'OFFLINE / UNCONFIGURED'}
              </span>
            </div>
            {systemStatus.firebaseError && (
              <p className="text-[10px] text-rose-400 mt-1">{systemStatus.firebaseError}</p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">ESP32 Heartbeat:</span>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemStatus.esp32Online ? 'bg-cyan-400' : 'bg-rose-500'
                }`}
              />
              <span className="text-white font-bold">
                {systemStatus.esp32Online ? 'ONLINE (ACTIVE PULSE)' : 'HEARTBEAT TIMEOUT'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Last packet: {systemStatus.secondsSinceLastPacket}s ago (Timeout: {thresholds.esp32TimeoutSec}s)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Subscribed RTDB Path:</span>
            <span className="text-cyan-300 font-bold block truncate">/AQUASENSE/latest</span>
            <p className="text-[10px] text-slate-400">Project: water quality monitoring</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Firebase Credentials & Configurable Thresholds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firebase Credentials Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                Firebase Realtime Database Credentials
              </h3>
            </div>
            <button
              onClick={reconnectFirebase}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconnect</span>
            </button>
          </div>

          {fbSaveNotice && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{fbSaveNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveFirebase} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Firebase Realtime Database URL:
              </label>
              <input
                type="text"
                value={fbForm.databaseURL}
                onChange={(e) => setFbForm({ ...fbForm, databaseURL: e.target.value })}
                placeholder="https://water-quality-monitoring-default-rtdb.firebaseio.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Firebase Project ID:</label>
              <input
                type="text"
                value={fbForm.projectId}
                onChange={(e) => setFbForm({ ...fbForm, projectId: e.target.value })}
                placeholder="water-quality-monitoring"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Firebase Web API Key:</label>
              <input
                type="password"
                value={fbForm.apiKey}
                onChange={(e) => setFbForm({ ...fbForm, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Auth Domain:</label>
              <input
                type="text"
                value={fbForm.authDomain}
                onChange={(e) => setFbForm({ ...fbForm, authDomain: e.target.value })}
                placeholder="water-quality-monitoring.firebaseapp.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save & Connect Firebase</span>
              </button>
            </div>
          </form>
        </div>

        {/* Configurable Operational Screening Limits Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                Operational Screening Thresholds
              </h3>
            </div>
            <span className="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/40">
              Configurable Limits
            </span>
          </div>

          {threshSaveNotice && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{threshSaveNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveThresholds} className="space-y-3 text-xs">
            {/* pH limits */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200">pH Screening Limits:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Crit Min:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={threshForm.pH.criticalMin}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        pH: { ...threshForm.pH, criticalMin: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Min (Opt):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={threshForm.pH.min}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        pH: { ...threshForm.pH, min: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Max (Opt):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={threshForm.pH.max}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        pH: { ...threshForm.pH, max: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Crit Max:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={threshForm.pH.criticalMax}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        pH: { ...threshForm.pH, criticalMax: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Turbidity & TDS limits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-200">Turbidity (NTU):</span>
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Max Screen (NTU):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={threshForm.turbidity.maxScreening}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        turbidity: { ...threshForm.turbidity, maxScreening: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Critical (NTU):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={threshForm.turbidity.critical}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        turbidity: { ...threshForm.turbidity, critical: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-200">TDS (ppm):</span>
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Max Screen (ppm):</label>
                  <input
                    type="number"
                    value={threshForm.tds.maxScreening}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        tds: { ...threshForm.tds, maxScreening: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-mono">Critical (ppm):</label>
                  <input
                    type="number"
                    value={threshForm.tds.critical}
                    onChange={(e) =>
                      setThreshForm({
                        ...threshForm,
                        tds: { ...threshForm.tds, critical: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Heartbeat Timeout */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <label className="font-bold text-slate-200 block mb-1">
                ESP32 Offline Heartbeat Timeout (Seconds):
              </label>
              <input
                type="number"
                value={threshForm.esp32TimeoutSec}
                onChange={(e) =>
                  setThreshForm({
                    ...threshForm,
                    esp32TimeoutSec: parseInt(e.target.value) || 60,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Thresholds</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Anomaly Simulator & Verification Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <FlaskConical className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            ESP32 Anomaly & Stress-Test Simulator
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Inject specific sensor conditions directly into the telemetry pipeline to verify alert triggers, Level 1/2/3 classification gates, and predictive maintenance alarms:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          <button
            onClick={() => injectSimulatedScenario('normal')}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-left space-y-1 transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-emerald-400 block">SCENARIO 1</span>
            <span className="text-xs font-semibold text-white block">Normal Water</span>
            <span className="text-[10px] text-slate-400 block">Level 1 (Low)</span>
          </button>

          <button
            onClick={() => injectSimulatedScenario('turbidity_spike')}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-rose-500/30 text-left space-y-1 transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-rose-400 block">SCENARIO 2</span>
            <span className="text-xs font-semibold text-white block">Turbidity Surge</span>
            <span className="text-[10px] text-slate-400 block">14.8 NTU Spike</span>
          </button>

          <button
            onClick={() => injectSimulatedScenario('ph_acid')}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-rose-500/30 text-left space-y-1 transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-rose-400 block">SCENARIO 3</span>
            <span className="text-xs font-semibold text-white block">Acidic pH Shock</span>
            <span className="text-[10px] text-slate-400 block">5.4 pH Influx</span>
          </button>

          <button
            onClick={() => injectSimulatedScenario('tds_surge')}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-left space-y-1 transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-amber-400 block">SCENARIO 4</span>
            <span className="text-xs font-semibold text-white block">High TDS Surge</span>
            <span className="text-[10px] text-slate-400 block">1150 ppm Influx</span>
          </button>

          <button
            onClick={() => injectSimulatedScenario('low_do')}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-left space-y-1 transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-amber-400 block">SCENARIO 5</span>
            <span className="text-xs font-semibold text-white block">Low Oxygen</span>
            <span className="text-[10px] text-slate-400 block">2.2 mg/L Anoxia</span>
          </button>

          <button
            onClick={() => injectSimulatedScenario('disconnect_sensor')}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-purple-500/30 text-left space-y-1 transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-purple-400 block">SCENARIO 6</span>
            <span className="text-xs font-semibold text-white block">Probe Disconnect</span>
            <span className="text-[10px] text-slate-400 block">Preserves N/A</span>
          </button>

          <button
            onClick={() => injectSimulatedScenario('esp32_offline')}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-rose-500/30 text-left space-y-1 transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-rose-500 block">SCENARIO 7</span>
            <span className="text-xs font-semibold text-white block">ESP32 Offline</span>
            <span className="text-[10px] text-slate-400 block">Heartbeat Loss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
