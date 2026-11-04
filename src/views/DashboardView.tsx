import React from 'react';
import { useAquasense } from '../context/AquasenseContext';
import { SensorCard } from '../components/SensorCard';
import { OverallAssessmentBanner } from '../components/OverallAssessmentBanner';
import {
  Activity,
  Layers,
  Sparkles,
  Droplets,
  Clock,
  Thermometer,
  Cpu,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    latestReading,
    previousReading,
    history,
    systemStatus,
    qualityAssessment,
    filterStages,
    waterMetrics,
    thresholds,
  } = useAquasense();

  // Extract recent sparklines for the four sensors
  const phTrend = history.map((h) => h.pH).filter((v): v is number => v !== null && v !== undefined);
  const turbTrend = history.map((h) => h.turbidity).filter((v): v is number => v !== null && v !== undefined);
  const tdsTrend = history.map((h) => h.tds).filter((v): v is number => v !== null && v !== undefined);
  const doTrend = history.map((h) => h.dissolvedOxygen).filter((v): v is number => v !== null && v !== undefined);

  // Format uptime into human-readable string
  const formatUptime = (ms?: number | null) => {
    if (!ms && ms !== 0) return 'N/A';
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formattedUpdateDate = latestReading.timestamp
    ? new Date(latestReading.timestamp).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString();

  const formattedUpdateTime = latestReading.timestamp
    ? new Date(latestReading.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Waiting for stream';

  return (
    <div className="space-y-6">
      {/* Welcome & Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/40 uppercase">
                IoT In-line Monitoring Node #ESP-01
              </span>
              {systemStatus.dataSource === 'DEMO_SIMULATION' ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Info className="w-3 h-3" />
                  <span>SIMULATED DATA (DEMO MODE) - Firebase Offline/Unconfigured</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>LIVE ESP32 VIA FIREBASE RTDB</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Welcome to AQUASENSE
            </h1>
            <p className="text-sm text-cyan-300/80 font-medium">
              Intelligent Water Monitoring & Predictive Maintenance
            </p>
          </div>

          {/* Quick telemetry indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">System Date:</span>
              <span className="font-mono text-slate-200 font-medium">{formattedUpdateDate}</span>
            </div>

            <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Last Packet:</span>
              <span className="font-mono text-cyan-300 font-semibold">{formattedUpdateTime}</span>
            </div>

            <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Operating Status:</span>
              <span
                className={`font-mono font-bold ${
                  systemStatus.esp32Online ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {systemStatus.esp32Online ? 'ONLINE (ACTIVE)' : 'OFFLINE (ALERT)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Overall Water Quality Assessment (Prominently featured) */}
      <OverallAssessmentBanner assessment={qualityAssessment} />

      {/* SECTION 3: The 4 Main Sensor Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Inlet Quality Screening Sensors</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            4 Calibrated Channels • Update interval ~3s
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1 - pH Level */}
          <SensorCard
            id="ph"
            title="pH LEVEL"
            value={latestReading.pH}
            previousValue={previousReading?.pH}
            unit="pH"
            min={0}
            max={14}
            optimalMin={thresholds.pH.min}
            optimalMax={thresholds.pH.max}
            criticalLow={thresholds.pH.criticalMin}
            criticalHigh={thresholds.pH.criticalMax}
            trendData={phTrend}
            screeningStandardNote="Screening limits: 6.5 - 8.5 pH. Values < 6.0 risk acidic corrosion; > 9.0 risk mineral incrustation."
            operationalDescription="Measures hydrogen-ion activity. Vital for protecting downstream RO membranes and piping infrastructure from chemical attack."
          />

          {/* CARD 2 - Turbidity */}
          <SensorCard
            id="turbidity"
            title="TURBIDITY"
            value={latestReading.turbidity}
            previousValue={previousReading?.turbidity}
            unit="NTU"
            min={0}
            max={20}
            optimalMin={0}
            optimalMax={thresholds.turbidity.maxScreening}
            criticalHigh={thresholds.turbidity.critical}
            trendData={turbTrend}
            screeningStandardNote="Target < 1.0 NTU for clear water; < 5.0 NTU for standard filtration. > 10.0 NTU indicates heavy sediment."
            operationalDescription="Measures light scattering by suspended silt, clay, and organic matter. Direct predictor of pre-filter cartridge clogging."
          />

          {/* CARD 3 - TDS */}
          <SensorCard
            id="tds"
            title="TOTAL DISSOLVED SOLIDS"
            value={latestReading.tds}
            previousValue={previousReading?.tds}
            unit="ppm"
            min={0}
            max={1500}
            optimalMin={50}
            optimalMax={thresholds.tds.maxScreening}
            criticalHigh={thresholds.tds.critical}
            trendData={tdsTrend}
            screeningStandardNote="Desirable: < 300 ppm; acceptable screening baseline: < 500 ppm; critical: > 1000 ppm."
            operationalDescription="Measures conductive dissolved minerals (salts, calcium, magnesium). High TDS increases osmotic pressure required across RO membranes."
          />

          {/* CARD 4 - Dissolved Oxygen */}
          <SensorCard
            id="do"
            title="DISSOLVED OXYGEN"
            value={latestReading.dissolvedOxygen}
            previousValue={previousReading?.dissolvedOxygen}
            unit="mg/L"
            min={0}
            max={14}
            optimalMin={thresholds.dissolvedOxygen.minScreening}
            optimalMax={12}
            criticalLow={thresholds.dissolvedOxygen.critical}
            trendData={doTrend}
            screeningStandardNote="Desirable: > 6.0 mg/L; minimum screening: 5.0 mg/L; critical low: <= 3.0 mg/L."
            operationalDescription="Measures free non-compound oxygen dissolved in water. Indicates biological stability, aeration freshness, and stagnation resistance."
          />
        </div>
      </div>

      {/* Secondary Sensor Row: Temperature, ESP32 Telemetry, and Auxiliary Hardware */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Temperature Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-orange-950/60 border border-orange-800/40 text-orange-400">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-mono">Inlet Temperature</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl font-bold font-mono text-white">
                  {latestReading.temperature !== null && latestReading.temperature !== undefined
                    ? `${latestReading.temperature.toFixed(1)}`
                    : 'N/A'}
                </span>
                <span className="text-xs text-orange-400 font-mono">°C</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Nominal Range (15-30°C)
          </span>
        </div>

        {/* ESP32 Microcontroller Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-mono">ESP32 Uptime</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-lg font-bold font-mono text-white">
                  {formatUptime(latestReading.uptime)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">Packets</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {systemStatus.packetCount} msgs
            </span>
          </div>
        </div>

        {/* Real-time Water Flow Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-teal-950/60 border border-teal-800/40 text-teal-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-mono">Current Flow Rate</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl font-bold font-mono text-white">
                  {waterMetrics.flowRateLpm !== null ? waterMetrics.flowRateLpm.toFixed(1) : 'N/A'}
                </span>
                <span className="text-xs text-teal-400 font-mono">L/min</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/40">
            Tank: {waterMetrics.tankLevelPct}%
          </span>
        </div>
      </div>

      {/* Bottom Split: Predictive Filter Overview & AI Quick Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filter Health Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Filtration System Health
                </h3>
              </div>
              <button
                onClick={() => onNavigate('filter-management')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium"
              >
                <span>Manage 4 Stages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {filterStages.map((filter) => {
                let badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                let statusLabel = 'NORMAL';
                if (filter.status === 'CLEANING_REQUIRED') {
                  badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                  statusLabel = 'CLEANING DUE';
                } else if (filter.status === 'REPLACEMENT_APPROACHING') {
                  badgeClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                  statusLabel = 'REPLACEMENT NEAR';
                } else if (filter.status === 'REPLACEMENT_REQUIRED') {
                  badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                  statusLabel = 'REPLACE NOW';
                }

                return (
                  <div
                    key={filter.id}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {filter.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {filter.operatingHours} hrs runtime • {filter.maintenanceAction}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-300">
                        {filter.estimatedRemainingLifePct !== null
                          ? `${filter.estimatedRemainingLifePct}% Life`
                          : 'Pending data'}
                      </span>
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${
                            filter.estimatedRemainingLifePct && filter.estimatedRemainingLifePct < 25
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{
                            width: `${filter.estimatedRemainingLifePct || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Predictive maintenance model calibrated against inlet turbidity & delta-P</span>
            <span className="text-cyan-400 font-mono">1 cleaning due</span>
          </div>
        </div>

        {/* AI Quick Assistant Insight Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    AQUASENSE AI – Water Intelligence
                  </h3>
                  <p className="text-[10px] text-cyan-300/80 font-mono">
                    Model: Gemini 3.8 Flash • Real-time Ingestion
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('ai-maintenance')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium"
              >
                <span>Open Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-300 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Automated Screening & Predictive Insight:</span>
              </div>
              <p>
                Inlet water turbidity currently stands at{' '}
                <strong className="text-white font-mono">
                  {latestReading.turbidity !== null ? `${latestReading.turbidity} NTU` : 'N/A'}
                </strong>{' '}
                with a balanced pH of{' '}
                <strong className="text-white font-mono">
                  {latestReading.pH !== null ? `${latestReading.pH}` : 'N/A'}
                </strong>
                . Sensor delta indicates nominal suspended particle load for Stage 1 sediment filtration.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/20 text-[11px] text-cyan-200/90">
                <strong>Actionable Recommendation:</strong> Maintain normal inlet routing. Activated carbon stage 2 has accumulated 2,950 operating hours; initiate scheduled 15-minute backwash cycle before reaching 3,000 hours.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Ask questions directly to the AI Assistant
            </span>
            <button
              onClick={() => onNavigate('ai-maintenance')}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
