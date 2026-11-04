import React from 'react';
import { useAquasense } from '../context/AquasenseContext';
import { OverallAssessmentBanner } from '../components/OverallAssessmentBanner';
import { WATER_SAFETY_DISCLAIMER } from '../utils/waterQualityCalculator';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  Layers,
  Activity,
  Wind,
  Info,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const WaterQualityAnalysisView: React.FC = () => {
  const { qualityAssessment, thresholds, latestReading, history } = useAquasense();

  // Calculate historical distribution of levels from the past recordings
  const levelCounts = { LEVEL_1: 0, LEVEL_2: 0, LEVEL_3: 0 };
  history.forEach((h) => {
    // Quick approximation
    const isCrit =
      (h.turbidity !== null && h.turbidity !== undefined && h.turbidity >= thresholds.turbidity.critical) ||
      (h.pH !== null && h.pH !== undefined && (h.pH < thresholds.pH.criticalMin || h.pH > thresholds.pH.criticalMax));
    const isMod =
      (h.turbidity !== null && h.turbidity !== undefined && h.turbidity > thresholds.turbidity.maxScreening) ||
      (h.pH !== null && h.pH !== undefined && (h.pH < thresholds.pH.min || h.pH > thresholds.pH.max));

    if (isCrit) levelCounts.LEVEL_3++;
    else if (isMod) levelCounts.LEVEL_2++;
    else levelCounts.LEVEL_1++;
  });

  const totalHistoryCount = history.length || 1;
  const level1Pct = Math.round((levelCounts.LEVEL_1 / totalHistoryCount) * 100);
  const level2Pct = Math.round((levelCounts.LEVEL_2 / totalHistoryCount) * 100);
  const level3Pct = Math.round((levelCounts.LEVEL_3 / totalHistoryCount) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              Water Quality Assessment & Filtration Suitability
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Multi-parameter screening algorithm and automated filtration stage gate recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Main Overall Assessment Banner Component */}
      <OverallAssessmentBanner assessment={qualityAssessment} />

      {/* 3 Contamination Level Reference Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level 1 Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            qualityAssessment.level === 'LEVEL_1'
              ? 'bg-emerald-950/40 border-emerald-500/50 ring-2 ring-emerald-500/30'
              : 'bg-slate-900 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              LEVEL 1 (Green)
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">LOW CONTAMINATION</h3>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            Water parameters are within the configured screening limits.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-emerald-300">
            <strong>System Recommendation:</strong> Water can proceed to the next filtration stage, subject to the treatment system&apos;s operating requirements and any additional required water tests.
          </div>
        </div>

        {/* Level 2 Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            qualityAssessment.level === 'LEVEL_2'
              ? 'bg-amber-950/40 border-amber-500/50 ring-2 ring-amber-500/30'
              : 'bg-slate-900 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              LEVEL 2 (Yellow/Orange)
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">MODERATE CONTAMINATION</h3>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            One or more parameters show moderate deviation from baseline.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-amber-300">
            <strong>System Recommendation:</strong> Proceed only if the configured pretreatment system is designed for these conditions. Inspect the water and filtration equipment.
          </div>
        </div>

        {/* Level 3 Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            qualityAssessment.level === 'LEVEL_3'
              ? 'bg-rose-950/40 border-rose-500/50 ring-2 ring-rose-500/30'
              : 'bg-slate-900 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              LEVEL 3 (Red)
            </span>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">HIGH CONTAMINATION</h3>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            One or more parameters exceed configured operational limits.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-rose-300">
            <strong>System Recommendation:</strong> Hold or divert inlet water for further assessment and appropriate pretreatment. Do not automatically declare water safe or unsafe for drinking based on these four sensors alone.
          </div>
        </div>
      </div>

      {/* Parameter Contribution Deep Dive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Parameter Weighting & Mathematical Contribution
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Composite Index: {qualityAssessment.score}/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qualityAssessment.parameterContributions.map((contrib) => {
            const isError = contrib.status === 'SENSOR_ERROR';
            return (
              <div
                key={contrib.key}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{contrib.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Weight: {contrib.weight}%
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isError
                        ? 'text-slate-400'
                        : contrib.status === 'CRITICAL'
                        ? 'text-rose-400'
                        : contrib.status === 'MODERATE'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {contrib.value !== null ? `${contrib.value} ${contrib.unit}` : 'DISCONNECTED'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Channel Screening Score:</span>
                    <span className="font-mono text-slate-200">
                      {isError ? 'Sensor Failure (0 pts)' : `${contrib.score} / 100`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isError
                          ? 'bg-slate-600'
                          : contrib.status === 'CRITICAL'
                          ? 'bg-rose-500'
                          : contrib.status === 'MODERATE'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${isError ? 0 : contrib.score}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">{contrib.message}</p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Configured screening target: {contrib.recommendedRange}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Quality Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-2">
          Historical Water Quality Tier Distribution (Past 24 Hours)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Percentage of runtime logged in each water contamination category based on {history.length} sensor readings.
        </p>

        <div className="w-full h-4 rounded-full bg-slate-950 flex overflow-hidden p-0.5 border border-slate-800">
          <div
            className="bg-emerald-500 h-full rounded-l-full transition-all"
            style={{ width: `${level1Pct}%` }}
            title={`Level 1: ${level1Pct}%`}
          />
          <div
            className="bg-amber-500 h-full transition-all"
            style={{ width: `${level2Pct}%` }}
            title={`Level 2: ${level2Pct}%`}
          />
          <div
            className="bg-rose-500 h-full rounded-r-full transition-all"
            style={{ width: `${level3Pct}%` }}
            title={`Level 3: ${level3Pct}%`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Level 1 (Low): {level1Pct}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Level 2 (Moderate): {level2Pct}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Level 3 (High): {level3Pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
