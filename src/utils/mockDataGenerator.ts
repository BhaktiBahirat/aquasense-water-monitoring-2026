import { SensorReading, FilterStage, MaintenanceRecord, WaterManagementMetrics, NotificationItem } from '../types/aquasense';

/**
 * Generate 24 hours of realistic baseline sensor readings (one per 15-30 minutes)
 */
export function generateInitialHistory(hours = 24): SensorReading[] {
  const points: SensorReading[] = [];
  const now = Date.now();
  const stepMs = (hours * 3600 * 1000) / 48; // 48 sample intervals

  for (let i = 48; i >= 0; i--) {
    const time = now - i * stepMs;
    // Base curves with gentle diurnal cycle
    const hourOfDay = new Date(time).getHours();
    const cycle = Math.sin((hourOfDay / 24) * Math.PI * 2);

    const pH = Number((7.2 + cycle * 0.35 + (Math.random() - 0.5) * 0.2).toFixed(2));
    const turbidity = Number((1.8 + Math.max(0, cycle * 1.2) + (Math.random() - 0.5) * 0.4).toFixed(1));
    const tds = Math.round(240 + cycle * 35 + (Math.random() - 0.5) * 15);
    const dissolvedOxygen = Number((7.8 - cycle * 0.6 + (Math.random() - 0.5) * 0.3).toFixed(1));
    const temperature = Number((23.5 + cycle * 2.5 + (Math.random() - 0.5) * 0.4).toFixed(1));
    const uptime = 86400000 - i * stepMs;

    points.push({
      pH,
      turbidity,
      tds,
      dissolvedOxygen,
      temperature,
      uptime,
      timestamp: time,
    });
  }

  return points;
}

/**
 * Default Filter Stages setup based on industrial water filtration systems
 */
export const DEFAULT_FILTER_STAGES: FilterStage[] = [
  {
    id: 'stage-1',
    name: 'Sediment / Pre-filter',
    type: 'sediment',
    stageNumber: 1,
    status: 'NORMAL',
    statusColor: 'green',
    installDate: '2026-08-10',
    lastCleanedDate: '2026-10-25',
    lastReplacementDate: '2026-08-10',
    operatingHours: 1420,
    maxOperatingHours: 2000,
    estimatedRemainingLifePct: 68,
    hasThroughputData: true,
    throughputLiters: 48500,
    differentialPressurePsi: 4.8,
    maintenanceAction: 'Routine visual inspection and flush',
    urgency: 'LOW',
    sensorEvidence: 'Inlet turbidity baseline is within normal operating limits (< 3.0 NTU).',
    suggestedProcedure: 'Isolate inlet valve, inspect filter housing for particulate cake, rinse cartridge or replace if delta-P > 10 psi.',
    nextScheduledDate: '2026-11-20',
  },
  {
    id: 'stage-2',
    name: 'Activated Carbon Filter',
    type: 'carbon',
    stageNumber: 2,
    status: 'CLEANING_REQUIRED',
    statusColor: 'yellow',
    installDate: '2026-06-15',
    lastCleanedDate: '2026-09-12',
    lastReplacementDate: '2026-06-15',
    operatingHours: 2950,
    maxOperatingHours: 3500,
    estimatedRemainingLifePct: 24,
    hasThroughputData: true,
    throughputLiters: 92400,
    differentialPressurePsi: 7.2,
    maintenanceAction: 'Backwash cycle recommended',
    urgency: 'MEDIUM',
    sensorEvidence: 'Cumulative throughput reaching 92 kL. Organic adsorption capacity tapering.',
    suggestedProcedure: 'Initiate 15-minute reverse backwash cycle to remove channeled particulates. Test free chlorine breakthrough.',
    nextScheduledDate: '2026-11-08',
  },
  {
    id: 'stage-3',
    name: 'RO Membrane Element',
    type: 'ro',
    stageNumber: 3,
    status: 'NORMAL',
    statusColor: 'green',
    installDate: '2026-01-20',
    lastCleanedDate: '2026-07-14',
    lastReplacementDate: '2026-01-20',
    operatingHours: 6100,
    maxOperatingHours: 10000,
    estimatedRemainingLifePct: 78,
    hasThroughputData: true,
    throughputLiters: 184000,
    differentialPressurePsi: 18.5,
    maintenanceAction: 'Chemical Cleaning-in-Place (CIP) scheduled in 60 days',
    urgency: 'LOW',
    sensorEvidence: 'Inlet TDS at 240 ppm, salt rejection efficiency remains > 97.4%.',
    suggestedProcedure: 'Monitor feed vs concentrate pressure. Record permeate conductivity.',
    nextScheduledDate: '2027-01-15',
  },
  {
    id: 'stage-4',
    name: 'Post-filter Mineral / Polishing Cartridge',
    type: 'post',
    stageNumber: 4,
    status: 'REPLACEMENT_APPROACHING',
    statusColor: 'orange',
    installDate: '2026-05-02',
    lastCleanedDate: undefined,
    lastReplacementDate: '2026-05-02',
    operatingHours: 3820,
    maxOperatingHours: 4000,
    estimatedRemainingLifePct: 12,
    hasThroughputData: true,
    throughputLiters: 74200,
    differentialPressurePsi: 3.1,
    maintenanceAction: 'Order replacement cartridge; swap in next 7-10 days',
    urgency: 'HIGH',
    sensorEvidence: 'Post-remineralization media nearing exhaustion based on runtime hours.',
    suggestedProcedure: 'Depressurize polishing housing, insert new remineralizing core, flush 50 L to drain before online service.',
    nextScheduledDate: '2026-11-12',
  },
];

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'rec-001',
    filterId: 'stage-1',
    filterName: 'Sediment / Pre-filter',
    actionType: 'CLEANING',
    status: 'COMPLETED',
    urgency: 'MEDIUM',
    scheduledDate: '2026-10-25',
    completedDate: '2026-10-25',
    technician: 'R. Davis (Lead Op)',
    notes: 'Removed 5-micron pre-filter. Cake buildup rinsed off; housing O-ring lubricated with food-grade silicone.',
    sensorTrigger: 'Differential pressure reached 8.2 psi; turbidity post-filter normal.',
    createdAt: Date.now() - 10 * 86400000,
  },
  {
    id: 'rec-002',
    filterId: 'stage-2',
    filterName: 'Activated Carbon Filter',
    actionType: 'INSPECTION',
    status: 'PENDING',
    urgency: 'MEDIUM',
    scheduledDate: '2026-11-08',
    technician: 'Unassigned',
    notes: 'Inspect bed channeling and measure differential pressure. Conduct backwash.',
    sensorTrigger: 'Cumulative volume reached 92,000 Liters milestone.',
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'rec-003',
    filterId: 'stage-4',
    filterName: 'Post-filter Mineral Cartridge',
    actionType: 'REPLACEMENT',
    status: 'IN_PROGRESS',
    urgency: 'HIGH',
    scheduledDate: '2026-11-12',
    technician: 'K. Patel (Maintenance)',
    notes: 'Replacement cartridge P/N AC-POL-2024 received in stock. Awaiting shutdown window.',
    sensorTrigger: 'Remaining service life estimated at 12% based on throughput model.',
    createdAt: Date.now() - 1 * 86400000,
  },
];

export const INITIAL_WATER_METRICS: WaterManagementMetrics = {
  flowRateLpm: 18.4,
  flowRateStatus: 'NORMAL',
  totalProcessedTodayL: 3840,
  totalProcessedMonthL: 94600,
  tankLevelPct: 82,
  tankCapacityL: 5000,
  availableLiters: 4100,
  hardwareConnected: true,
  hardwareNote: 'Connected via RS485 Modbus Turbine Flowmeter & Hydrostatic Tank Probe',
  possibleLeakage: false,
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    timestamp: Date.now() - 25 * 60 * 1000,
    category: 'FILTER_MAINTENANCE',
    severity: 'WARNING',
    title: 'Activated Carbon Bed Backwash Due',
    description: 'Stage 2 filter operating hours reached 2,950 hours (threshold: 3,000 hrs). Recommended backwash cycle to prevent media compaction.',
    recommendedAction: 'Schedule 15-minute backwash cycle via bypass manifold.',
    acknowledged: false,
    resolved: false,
    code: 'FLT-WARN-204',
  },
  {
    id: 'notif-2',
    timestamp: Date.now() - 3 * 3600 * 1000,
    category: 'WATER_QUALITY',
    severity: 'INFO',
    title: 'Inlet Quality Screening Baseline Nominal',
    description: 'All four IoT sensors (pH 7.15, Turbidity 1.6 NTU, TDS 248 ppm, DO 7.9 mg/L) are stable within screening limits.',
    recommendedAction: 'Inlet water approved to proceed through Stage 1 filtration.',
    acknowledged: true,
    resolved: true,
    code: 'WTR-INFO-101',
  },
];
