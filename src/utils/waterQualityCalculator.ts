import {
  SensorReading,
  WaterQualityAssessment,
  ParameterContribution,
  ThresholdConfig,
} from '../types/aquasense';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  pH: {
    min: 6.5,
    max: 8.5,
    criticalMin: 6.0,
    criticalMax: 9.0,
  },
  turbidity: {
    ideal: 1.0,
    maxScreening: 5.0,
    critical: 10.0,
  },
  tds: {
    ideal: 300,
    maxScreening: 500,
    critical: 1000,
  },
  dissolvedOxygen: {
    ideal: 6.5,
    minScreening: 5.0,
    critical: 3.0,
  },
  temperature: {
    min: 10,
    max: 35,
  },
  esp32TimeoutSec: 60,
};

export const WATER_SAFETY_DISCLAIMER =
  'IMPORTANT OPERATIONAL DISCLAIMER: Sensor screening for pH, turbidity, TDS, and dissolved oxygen evaluates inlet water suitability for physical/chemical filtration systems. These four sensors do not detect pathogenic bacteria, viruses, heavy metals, or volatile organic compounds and DO NOT establish drinking-water microbiological or full chemical safety without certified laboratory validation.';

export function calculateWaterQuality(
  reading: SensorReading,
  previousReading?: SensorReading | null,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): WaterQualityAssessment {
  const contributions: ParameterContribution[] = [];
  let totalScore = 0;
  let activeWeights = 0;
  let hasCritical = false;
  let hasModerate = false;
  const criticalReasons: string[] = [];
  const moderateReasons: string[] = [];

  // 1. pH Evaluation (Weight 25%)
  const phWeight = 25;
  if (reading.pH !== null && reading.pH !== undefined && !isNaN(reading.pH)) {
    const ph = reading.pH;
    let phScore = 100;
    let phStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL' = 'OPTIMAL';
    let phMsg = 'pH is in optimal neutral-to-balanced screening range.';

    if (ph < thresholds.pH.criticalMin || ph > thresholds.pH.criticalMax) {
      phScore = 20;
      phStatus = 'CRITICAL';
      hasCritical = true;
      phMsg = ph < thresholds.pH.criticalMin
        ? `Critically acidic (pH ${ph.toFixed(2)} < ${thresholds.pH.criticalMin}). Severe pipe/membrane corrosion risk.`
        : `Critically alkaline (pH ${ph.toFixed(2)} > ${thresholds.pH.criticalMax}). Scale formation risk.`;
      criticalReasons.push(phMsg);
    } else if (ph < thresholds.pH.min || ph > thresholds.pH.max) {
      phScore = 60;
      phStatus = 'MODERATE';
      hasModerate = true;
      phMsg = ph < thresholds.pH.min
        ? `Mildly acidic (pH ${ph.toFixed(2)}). Pre-neutralization may be required.`
        : `Mildly alkaline (pH ${ph.toFixed(2)}). Near upper screening limit.`;
      moderateReasons.push(phMsg);
    }

    const deduction = ((100 - phScore) * (phWeight / 100));
    totalScore += phScore * (phWeight / 100);
    activeWeights += phWeight;

    contributions.push({
      name: 'pH Level',
      key: 'pH',
      value: ph,
      unit: 'pH',
      status: phStatus,
      score: phScore,
      weight: phWeight,
      deduction,
      message: phMsg,
      recommendedRange: `${thresholds.pH.min} - ${thresholds.pH.max} pH`,
    });
  } else {
    contributions.push({
      name: 'pH Level',
      key: 'pH',
      value: null,
      unit: 'pH',
      status: 'SENSOR_ERROR',
      score: 0,
      weight: phWeight,
      deduction: 0,
      message: 'pH sensor communication interrupted or probe disconnected.',
      recommendedRange: `${thresholds.pH.min} - ${thresholds.pH.max} pH`,
    });
  }

  // 2. Turbidity Evaluation (Weight 30%)
  const turbWeight = 30;
  if (reading.turbidity !== null && reading.turbidity !== undefined && !isNaN(reading.turbidity)) {
    const turb = reading.turbidity;
    let turbScore = 100;
    let turbStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL' = 'OPTIMAL';
    let turbMsg = 'Water clarity is excellent with low suspended particulate load.';

    if (turb >= thresholds.turbidity.critical) {
      turbScore = 15;
      turbStatus = 'CRITICAL';
      hasCritical = true;
      turbMsg = `High turbidity (${turb.toFixed(1)} NTU >= ${thresholds.turbidity.critical} NTU). Severe pre-filter fouling risk.`;
      criticalReasons.push(turbMsg);
    } else if (turb > thresholds.turbidity.maxScreening) {
      turbScore = 55;
      turbStatus = 'MODERATE';
      hasModerate = true;
      turbMsg = `Elevated turbidity (${turb.toFixed(1)} NTU > ${thresholds.turbidity.maxScreening} NTU). Pre-sedimentation required.`;
      moderateReasons.push(turbMsg);
    } else if (turb > thresholds.turbidity.ideal) {
      turbScore = 85;
      turbMsg = `Acceptable clarity (${turb.toFixed(1)} NTU), slightly above ideal standard.`;
    }

    const deduction = ((100 - turbScore) * (turbWeight / 100));
    totalScore += turbScore * (turbWeight / 100);
    activeWeights += turbWeight;

    contributions.push({
      name: 'Turbidity',
      key: 'turbidity',
      value: turb,
      unit: 'NTU',
      status: turbStatus,
      score: turbScore,
      weight: turbWeight,
      deduction,
      message: turbMsg,
      recommendedRange: `< ${thresholds.turbidity.maxScreening} NTU`,
    });
  } else {
    contributions.push({
      name: 'Turbidity',
      key: 'turbidity',
      value: null,
      unit: 'NTU',
      status: 'SENSOR_ERROR',
      score: 0,
      weight: turbWeight,
      deduction: 0,
      message: 'Turbidity optical probe offline or reading missing.',
      recommendedRange: `< ${thresholds.turbidity.maxScreening} NTU`,
    });
  }

  // 3. TDS Evaluation (Weight 25%)
  const tdsWeight = 25;
  if (reading.tds !== null && reading.tds !== undefined && !isNaN(reading.tds)) {
    const tds = reading.tds;
    let tdsScore = 100;
    let tdsStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL' = 'OPTIMAL';
    let tdsMsg = 'Total dissolved solids level is within desirable mineral baseline.';

    if (tds >= thresholds.tds.critical) {
      tdsScore = 20;
      tdsStatus = 'CRITICAL';
      hasCritical = true;
      tdsMsg = `High dissolved solids (${tds.toFixed(0)} ppm >= ${thresholds.tds.critical} ppm). Osmotic load high; RO membrane required.`;
      criticalReasons.push(tdsMsg);
    } else if (tds > thresholds.tds.maxScreening) {
      tdsScore = 60;
      tdsStatus = 'MODERATE';
      hasModerate = true;
      tdsMsg = `Moderately elevated TDS (${tds.toFixed(0)} ppm > ${thresholds.tds.maxScreening} ppm). Demineralization recommended.`;
      moderateReasons.push(tdsMsg);
    } else if (tds > thresholds.tds.ideal) {
      tdsScore = 85;
      tdsMsg = `Good dissolved solids balance (${tds.toFixed(0)} ppm).`;
    }

    const deduction = ((100 - tdsScore) * (tdsWeight / 100));
    totalScore += tdsScore * (tdsWeight / 100);
    activeWeights += tdsWeight;

    contributions.push({
      name: 'TDS (Dissolved Solids)',
      key: 'tds',
      value: tds,
      unit: 'ppm',
      status: tdsStatus,
      score: tdsScore,
      weight: tdsWeight,
      deduction,
      message: tdsMsg,
      recommendedRange: `< ${thresholds.tds.maxScreening} ppm`,
    });
  } else {
    contributions.push({
      name: 'TDS (Dissolved Solids)',
      key: 'tds',
      value: null,
      unit: 'ppm',
      status: 'SENSOR_ERROR',
      score: 0,
      weight: tdsWeight,
      deduction: 0,
      message: 'TDS sensor connection unavailable.',
      recommendedRange: `< ${thresholds.tds.maxScreening} ppm`,
    });
  }

  // 4. Dissolved Oxygen Evaluation (Weight 20%)
  const doWeight = 20;
  if (reading.dissolvedOxygen !== null && reading.dissolvedOxygen !== undefined && !isNaN(reading.dissolvedOxygen)) {
    const dO = reading.dissolvedOxygen;
    let doScore = 100;
    let doStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL' = 'OPTIMAL';
    let doMsg = 'Adequate dissolved oxygen indicates active aeration and freshness.';

    if (dO <= thresholds.dissolvedOxygen.critical) {
      doScore = 25;
      doStatus = 'CRITICAL';
      hasCritical = true;
      doMsg = `Critical low oxygen (${dO.toFixed(1)} mg/L <= ${thresholds.dissolvedOxygen.critical} mg/L). Stagnant water or high biological/organic load.`;
      criticalReasons.push(doMsg);
    } else if (dO < thresholds.dissolvedOxygen.minScreening) {
      doScore = 65;
      doStatus = 'MODERATE';
      hasModerate = true;
      doMsg = `Below recommended aeration (${dO.toFixed(1)} mg/L < ${thresholds.dissolvedOxygen.minScreening} mg/L). Aeration recommended.`;
      moderateReasons.push(doMsg);
    }

    const deduction = ((100 - doScore) * (doWeight / 100));
    totalScore += doScore * (doWeight / 100);
    activeWeights += doWeight;

    contributions.push({
      name: 'Dissolved Oxygen',
      key: 'dissolvedOxygen',
      value: dO,
      unit: 'mg/L',
      status: doStatus,
      score: doScore,
      weight: doWeight,
      deduction,
      message: doMsg,
      recommendedRange: `> ${thresholds.dissolvedOxygen.minScreening} mg/L`,
    });
  } else {
    contributions.push({
      name: 'Dissolved Oxygen',
      key: 'dissolvedOxygen',
      value: null,
      unit: 'mg/L',
      status: 'SENSOR_ERROR',
      score: 0,
      weight: doWeight,
      deduction: 0,
      message: 'DO galvanic/optical probe disconnected.',
      recommendedRange: `> ${thresholds.dissolvedOxygen.minScreening} mg/L`,
    });
  }

  // Normalize final score if some sensors are missing
  const finalScore = activeWeights > 0 ? Math.round((totalScore / activeWeights) * 100) : 0;

  // Determine Level and Recommendations according to Project Spec:
  let level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' = 'LEVEL_1';
  let title = 'LEVEL 1 – LOW CONTAMINATION';
  let summary = 'Water parameters are within the configured screening limits.';
  let recommendation =
    'Water can proceed to the next filtration stage, subject to the treatment system\'s operating requirements and any additional required water tests.';
  let primaryFactor = 'All four monitoring parameters satisfy operational screening standards.';
  let canProceedToFiltration = true;
  let requiresPretreatment = false;
  let holdOrDivert = false;

  if (hasCritical || finalScore < 55) {
    level = 'LEVEL_3';
    title = 'LEVEL 3 – HIGH CONTAMINATION';
    summary = 'One or more parameters exceed configured operational limits.';
    recommendation =
      'Hold or divert inlet water for further assessment and appropriate pretreatment. Do not automatically declare water safe or unsafe for drinking based on these four sensors alone.';
    primaryFactor = criticalReasons.join(' | ') || 'Overall composite screening score dropped below threshold (55/100).';
    canProceedToFiltration = false;
    requiresPretreatment = true;
    holdOrDivert = true;
  } else if (hasModerate || finalScore < 80) {
    level = 'LEVEL_2';
    title = 'LEVEL 2 – MODERATE CONTAMINATION';
    summary = 'One or more parameters show moderate deviation from baseline.';
    recommendation =
      'Proceed only if the configured pretreatment system is designed for these conditions. Inspect the water and filtration equipment.';
    primaryFactor = moderateReasons.join(' | ') || 'Moderate parameter variance observed during inlet cycle.';
    canProceedToFiltration = true;
    requiresPretreatment = true;
    holdOrDivert = false;
  }

  // Previous comparison
  let previousComparison: WaterQualityAssessment['previousComparison'] | undefined;
  if (previousReading) {
    const prevAssessment = calculateWaterQuality(previousReading, null, thresholds);
    const scoreDiff = finalScore - prevAssessment.score;
    let trend: 'improving' | 'stable' | 'deteriorating' = 'stable';
    if (scoreDiff >= 2) trend = 'improving';
    else if (scoreDiff <= -2) trend = 'deteriorating';

    previousComparison = {
      scoreDiff,
      trend,
    };
  }

  return {
    score: finalScore,
    level,
    title,
    summary,
    recommendation,
    primaryFactor,
    parameterContributions: contributions,
    canProceedToFiltration,
    requiresPretreatment,
    holdOrDivert,
    previousComparison,
  };
}
