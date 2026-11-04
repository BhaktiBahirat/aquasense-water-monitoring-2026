import React, { useState } from 'react';
import { WaterQualityAssessment } from '../types/aquasense';
import { WATER_SAFETY_DISCLAIMER } from '../utils/waterQualityCalculator';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface OverallAssessmentBannerProps {
  assessment: WaterQualityAssessment;
}

export const OverallAssessmentBanner: React.FC<OverallAssessmentBannerProps> = ({
  assessment,
}) => {
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Styling based on level
  let levelColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let badgeText = 'LEVEL 1 – LOW CONTAMINATION';
  let icon = <ShieldCheck className="w-8 h-8 text-emerald-400" />;
  let decisionBg = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
  let actionTitle = 'APPROVED FOR FILTRATION';

  if (assessment.level === 'LEVEL_3') {
    levelColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    badgeText = 'LEVEL 3 – HIGH CONTAMINATION';
    icon = <AlertOctagon className="w-8 h-8 text-rose-400" />;
    decisionBg = 'bg-rose-950/40 border-rose-500/30 text-rose-300';
    actionTitle = 'HOLD OR DIVERT INLET STREAM';
  } else if (assessment.level === 'LEVEL_2') {
    levelColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    badgeText = 'LEVEL 2 – MODERATE CONTAMINATION';
    icon = <AlertTriangle className="w-8 h-8 text-amber-400" />;
    decisionBg = 'bg-amber-950/40 border-amber-500/30 text-amber-300';
    actionTitle = 'PRETREATMENT / INSPECTION REQUIRED';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${
          assessment.level === 'LEVEL_1'
            ? 'bg-emerald-500'
            : assessment.level === 'LEVEL_2'
            ? 'bg-amber-500'
            : 'bg-rose-500'
        }`}
      />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Score & Level Header */}
        <div className="flex items-start sm:items-center space-x-5">
          <div className="relative flex items-center justify-center">
            {/* Score circle */}
            <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {assessment.score}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">/ 100 PTS</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${levelColor}`}
              >
                {icon}
                <span>{badgeText}</span>
              </span>

              {assessment.previousComparison && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {assessment.previousComparison.trend === 'improving' ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : assessment.previousComparison.trend === 'deteriorating' ? (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-400" />
                  )}
                  <span>
                    {assessment.previousComparison.scoreDiff > 0 ? '+' : ''}
                    {assessment.previousComparison.scoreDiff} pts vs prev
                  </span>
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-200">{assessment.summary}</p>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Primary Factor:</strong> {assessment.primaryFactor}
            </p>
          </div>
        </div>

        {/* Center: Recommended Filtration Action Callout */}
        <div className={`p-4 rounded-xl border flex-1 max-w-xl ${decisionBg}`}>
          <div className="flex items-center space-x-2 mb-1">
            {assessment.canProceedToFiltration && !assessment.requiresPretreatment ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-bold tracking-wider uppercase font-mono">
              {actionTitle}
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-95">{assessment.recommendation}</p>
        </div>

        {/* Right: Algorithm Transparency button */}
        <div className="flex flex-col space-y-2 shrink-0">
          <button
            onClick={() => setShowFormulaModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 rounded-lg transition-colors shadow-sm"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>View Scoring Formula</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Individual Parameter Contribution Progress Grid */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {assessment.parameterContributions.map((param) => {
          const isError = param.status === 'SENSOR_ERROR';
          const isCrit = param.status === 'CRITICAL';
          const isMod = param.status === 'MODERATE';

          let paramColor = 'bg-emerald-500';
          let textColor = 'text-emerald-400';
          if (isError) {
            paramColor = 'bg-slate-600';
            textColor = 'text-slate-400';
          } else if (isCrit) {
            paramColor = 'bg-rose-500';
            textColor = 'text-rose-400';
          } else if (isMod) {
            paramColor = 'bg-amber-500';
            textColor = 'text-amber-400';
          }

          return (
            <div key={param.key} className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">{param.name}</span>
                <span className={`font-mono font-bold ${textColor}`}>
                  {param.value !== null ? `${param.value} ${param.unit}` : 'OFFLINE'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${paramColor} transition-all duration-500`}
                  style={{ width: `${isError ? 0 : param.score}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Score: {isError ? 'N/A' : `${param.score}/100`}</span>
                <span>Wt: {param.weight}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Statutory Disclaimer Banner (Project Requirement Section 4) */}
      <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-slate-300">Regulatory Screening Notice:</strong> {WATER_SAFETY_DISCLAIMER}
        </span>
      </div>

      {/* Scoring Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>AQUASENSE Water Quality Scoring Model</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                The composite index calculates an engineering score (0-100) using a transparent weighted multi-parameter algorithm:
              </p>
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 space-y-1">
                <div>Score = (pH_Score * 0.25) + (Turbidity_Score * 0.30) + (TDS_Score * 0.25) + (DO_Score * 0.20)</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200">Screening Parameter Weights & Targets:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Turbidity (30% weight):</strong> Target &lt; 1.0 NTU (optimal), &lt; 5.0 NTU (acceptable screening), &ge; 10.0 NTU (critical fouling hazard).</li>
                  <li><strong>pH Level (25% weight):</strong> Target 6.5 - 8.5 pH. Critical outside 6.0 - 9.0.</li>
                  <li><strong>TDS (25% weight):</strong> Target &lt; 300 ppm (desirable), &lt; 500 ppm (screening baseline), &ge; 1000 ppm (critical mineral load).</li>
                  <li><strong>Dissolved Oxygen (20% weight):</strong> Target &gt; 6.0 mg/L (well-oxygenated), &gt; 5.0 mg/L (screening limit), &le; 3.0 mg/L (stagnation).</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200">Contamination Tier Classification:</h4>
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                    <strong>Level 1 (Score 80-100):</strong> Low Contamination. All sensors within screening limits. Inlet approved for normal filtration.
                  </div>
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-amber-300">
                    <strong>Level 2 (Score 55-79):</strong> Moderate Contamination. Moderate deviation. Pretreatment inspection required.
                  </div>
                  <div className="p-2 rounded bg-rose-950/30 border border-rose-500/20 text-rose-300">
                    <strong>Level 3 (Score &lt; 55 or Critical Sensor):</strong> High Contamination. Hold or divert inlet stream immediately.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
