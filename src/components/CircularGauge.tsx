import React from 'react';

interface CircularGaugeProps {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  optimalMin?: number;
  optimalMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  size?: number;
  strokeWidth?: number;
  colorScheme?: 'ph' | 'turbidity' | 'tds' | 'do' | 'temp';
  label?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  min,
  max,
  unit,
  optimalMin,
  optimalMax,
  criticalLow,
  criticalHigh,
  size = 140,
  strokeWidth = 10,
  label,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 240-degree gauge arc (from -210 deg to 30 deg)
  const arcDegree = 240;
  const arcLength = (arcDegree / 360) * circumference;

  const isValid = value !== null && value !== undefined && !isNaN(value);
  const clampedValue = isValid ? Math.min(max, Math.max(min, value!)) : min;
  const percentage = isValid ? (clampedValue - min) / (max - min) : 0;
  const strokeDashoffset = arcLength - percentage * arcLength;

  // Determine color based on thresholds
  let strokeColor = '#06b6d4'; // default cyan
  let statusBadge = 'Normal';

  if (!isValid) {
    strokeColor = '#64748b'; // slate/gray for error
    statusBadge = 'Disconnected';
  } else if (
    (criticalLow !== undefined && value! <= criticalLow) ||
    (criticalHigh !== undefined && value! >= criticalHigh)
  ) {
    strokeColor = '#ef4444'; // Red (Critical)
    statusBadge = 'Critical';
  } else if (
    (optimalMin !== undefined && value! < optimalMin) ||
    (optimalMax !== undefined && value! > optimalMax)
  ) {
    strokeColor = '#f59e0b'; // Amber (Moderate)
    statusBadge = 'Warning';
  } else {
    strokeColor = '#10b981'; // Green (Optimal)
    statusBadge = 'Optimal';
  }

  // Calculate rotation to start gauge arc cleanly
  const startAngle = 150; // degrees

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform"
      >
        <defs>
          <linearGradient id={`gauge-grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background Track Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
        />

        {/* Optimal Range Indicator (if provided) */}
        {optimalMin !== undefined && optimalMax !== undefined && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray={`${((optimalMax - optimalMin) / (max - min)) * arcLength} ${circumference}`}
            strokeDashoffset={-(((optimalMin - min) / (max - min)) * arcLength)}
            transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
            opacity={0.35}
          />
        )}

        {/* Active Value Arc */}
        {isValid && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#gauge-grad-${label})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      {/* Center Value Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        {isValid ? (
          <>
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : 'N/A'}
            </span>
            <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">{unit}</span>
          </>
        ) : (
          <>
            <span className="text-sm font-bold text-rose-400 uppercase tracking-wider">OFFLINE</span>
            <span className="text-[10px] text-slate-400">Sensor N/A</span>
          </>
        )}
      </div>

      {/* Min/Max subtle footer ticks */}
      <div className="absolute bottom-1 w-full px-4 flex justify-between text-[10px] font-mono text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
