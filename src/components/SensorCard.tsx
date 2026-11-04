import React, { useState } from 'react';
import { CircularGauge } from './CircularGauge';
import {
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  Droplets,
  Wind,
} from 'lucide-react';

interface SensorCardProps {
  id: 'ph' | 'turbidity' | 'tds' | 'do';
  title: string;
  value: number | null | undefined;
  previousValue?: number | null | undefined;
  unit: string;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  trendData?: number[];
  screeningStandardNote: string;
  operationalDescription: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  id,
  title,
  value,
  previousValue,
  unit,
  min,
  max,
  optimalMin,
  optimalMax,
  criticalLow,
  criticalHigh,
  trendData = [],
  screeningStandardNote,
  operationalDescription,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const isValid = value !== null && value !== undefined && !isNaN(value);

  // Classification logic per sensor
  let classification = 'Optimal';
  let badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let statusIcon = <CheckCircle className="w-3.5 h-3.5" />;
  let warningMessage: string | null = null;

  if (!isValid) {
    classification = 'Sensor Offline';
    badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
    warningMessage = 'Telemetry missing. Reading preserved as N/A (no zero-substitution).';
  } else if (id === 'ph') {
    if (value! < 6.5) {
      classification = value! < 6.0 ? 'Highly Acidic' : 'Mildly Acidic';
      badgeColor = value! < 6.0 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'Acidic water risks metal leaching & pipe corrosion.';
    } else if (value! > 8.5) {
      classification = value! > 9.0 ? 'Highly Alkaline' : 'Mildly Alkaline';
      badgeColor = value! > 9.0 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'Alkaline condition promotes mineral scaling.';
    } else {
      classification = 'Neutral / Balanced';
    }
  } else if (id === 'turbidity') {
    if (value! >= 10.0) {
      classification = 'Highly Turbid (Severe)';
      badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'Suspended solids hazard! Pre-filter blockage imminent.';
    } else if (value! > 5.0) {
      classification = 'Slightly Turbid (Elevated)';
      badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'Particulates elevated. Pre-sedimentation required.';
    } else if (value! <= 1.0) {
      classification = 'Crystal Clear (< 1.0 NTU)';
    } else {
      classification = 'Normal Clarity';
    }
  } else if (id === 'tds') {
    if (value! >= 1000) {
      classification = 'Elevated Dissolved Solids';
      badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'High mineral load. RO treatment required.';
    } else if (value! > 500) {
      classification = 'Moderate Dissolved Solids';
      badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'Above typical freshwater screening range.';
    } else if (value! < 100) {
      classification = 'Low Dissolved Solids';
    } else {
      classification = 'Desirable Balance (100-500 ppm)';
    }
  } else if (id === 'do') {
    if (value! <= 3.0) {
      classification = 'Critical Low Oxygen';
      badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'Anaerobic / stagnant condition detected.';
    } else if (value! < 5.0) {
      classification = 'Low Dissolved Oxygen';
      badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      warningMessage = 'Oxygen depletion; aeration recommended.';
    } else {
      classification = 'Adequately Oxygenated';
    }
  }

  // Trend calculation
  let trendIcon = <Minus className="w-3 h-3 text-slate-400" />;
  let trendText = 'Stable';
  let trendColor = 'text-slate-400';

  if (isValid && previousValue !== null && previousValue !== undefined) {
    const diff = value! - previousValue!;
    const threshold = id === 'tds' ? 5 : 0.1;
    if (diff > threshold) {
      trendIcon = <TrendingUp className="w-3 h-3 text-cyan-400" />;
      trendText = `+${diff.toFixed(id === 'tds' ? 0 : 2)} ${unit}`;
      trendColor = 'text-cyan-400';
    } else if (diff < -threshold) {
      trendIcon = <TrendingDown className="w-3 h-3 text-emerald-400" />;
      trendText = `${diff.toFixed(id === 'tds' ? 0 : 2)} ${unit}`;
      trendColor = 'text-emerald-400';
    }
  }

  // Sensor icon
  const getIcon = () => {
    switch (id) {
      case 'ph':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'turbidity':
        return <Layers className="w-4 h-4 text-teal-400" />;
      case 'tds':
        return <Activity className="w-4 h-4 text-indigo-400" />;
      case 'do':
        return <Wind className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-cyan-500/30 transition-all flex flex-col justify-between group">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 shadow-inner">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide">{title}</h3>
            <p className="text-[11px] text-slate-400 font-mono">ESP32 In-line Sensor</p>
          </div>
        </div>

        {/* Info Tooltip toggle */}
        <div className="relative">
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={`About ${title}`}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {showTooltip && (
            <div className="absolute right-0 top-7 z-30 w-64 p-3 bg-slate-950/95 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 space-y-2 backdrop-blur-md">
              <p className="font-semibold text-cyan-300">{title} Screening Standard</p>
              <p className="text-[11px] leading-relaxed text-slate-300">{operationalDescription}</p>
              <div className="pt-1.5 border-t border-slate-800 text-[10px] text-amber-300/90">
                <strong>Standard note:</strong> {screeningStandardNote}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Gauge & Reading Display */}
      <div className="flex items-center justify-around my-2">
        <CircularGauge
          value={isValid ? value! : null}
          min={min}
          max={max}
          unit={unit}
          optimalMin={optimalMin}
          optimalMax={optimalMax}
          criticalLow={criticalLow}
          criticalHigh={criticalHigh}
          size={130}
          strokeWidth={9}
          label={id}
        />

        <div className="flex flex-col space-y-2 max-w-[140px]">
          {/* Classification Pill */}
          <div
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor}`}
          >
            {statusIcon}
            <span className="truncate">{classification}</span>
          </div>

          {/* Suitable Range */}
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Range:</span>
            <div className="font-mono text-slate-300 font-medium">
              {optimalMin} - {optimalMax} {unit}
            </div>
          </div>

          {/* Trend vs Previous */}
          <div className="text-[11px] flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-400">Trend:</span>
            <div className={`flex items-center space-x-1 font-mono text-xs font-semibold ${trendColor}`}>
              {trendIcon}
              <span>{trendText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning note if applicable */}
      {warningMessage && (
        <div className="mt-2.5 px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 flex items-start space-x-1.5 text-[11px] text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span className="leading-tight">{warningMessage}</span>
        </div>
      )}

      {/* Mini sparkline or recent points */}
      {trendData.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-[10px] font-mono uppercase text-slate-400">Past Trend</span>
          <div className="flex items-end space-x-1 h-5">
            {trendData.slice(-12).map((pt, i) => {
              const heightPct = Math.min(100, Math.max(15, ((pt - min) / (max - min)) * 100));
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-t bg-cyan-500/40 hover:bg-cyan-400 transition-all"
                  style={{ height: `${heightPct}%` }}
                  title={`${pt} ${unit}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
