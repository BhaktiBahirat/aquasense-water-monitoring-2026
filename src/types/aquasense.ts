export interface SensorReading {
  pH?: number | null;
  tds?: number | null;
  turbidity?: number | null;
  dissolvedOxygen?: number | null;
  temperature?: number | null;
  uptime?: number | null;
  timestamp: number;
}

export type ContaminationLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

export interface ParameterContribution {
  name: string;
  key: 'pH' | 'turbidity' | 'tds' | 'dissolvedOxygen';
  value: number | null;
  unit: string;
  status: 'OPTIMAL' | 'MODERATE' | 'CRITICAL' | 'SENSOR_ERROR';
  score: number; // 0-100 sub-score
  weight: number; // weight percentage in total score
  deduction: number;
  message: string;
  recommendedRange: string;
}

export interface WaterQualityAssessment {
  score: number; // 0 - 100
  level: ContaminationLevel;
  title: string;
  summary: string;
  recommendation: string;
  primaryFactor: string;
  parameterContributions: ParameterContribution[];
  canProceedToFiltration: boolean;
  requiresPretreatment: boolean;
  holdOrDivert: boolean;
  previousComparison?: {
    scoreDiff: number;
    trend: 'improving' | 'stable' | 'deteriorating';
  };
}

export type FilterStatus = 'NORMAL' | 'CLEANING_REQUIRED' | 'REPLACEMENT_APPROACHING' | 'REPLACEMENT_REQUIRED';

export interface FilterStage {
  id: string;
  name: string;
  type: 'sediment' | 'carbon' | 'ro' | 'post';
  stageNumber: number;
  status: FilterStatus;
  statusColor: string; // 'green' | 'yellow' | 'orange' | 'red'
  installDate: string;
  lastCleanedDate?: string;
  lastReplacementDate: string;
  operatingHours: number;
  maxOperatingHours: number;
  estimatedRemainingLifePct: number | null;
  hasThroughputData: boolean;
  throughputLiters?: number;
  differentialPressurePsi?: number;
  maintenanceAction: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sensorEvidence: string;
  suggestedProcedure: string;
  nextScheduledDate: string;
}

export type MaintenanceActionType = 'CLEANING' | 'REPLACEMENT' | 'INSPECTION' | 'CALIBRATION';
export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface MaintenanceRecord {
  id: string;
  filterId: string;
  filterName: string;
  actionType: MaintenanceActionType;
  status: MaintenanceStatus;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scheduledDate: string;
  completedDate?: string;
  technician?: string;
  notes: string;
  sensorTrigger?: string;
  createdAt: number;
}

export interface WaterManagementMetrics {
  flowRateLpm: number | null;
  flowRateStatus: 'NORMAL' | 'ABNORMAL' | 'LOW' | 'ZERO';
  totalProcessedTodayL: number;
  totalProcessedMonthL: number;
  tankLevelPct: number | null;
  tankCapacityL: number;
  availableLiters: number | null;
  hardwareConnected: boolean;
  hardwareNote: string;
  possibleLeakage: boolean;
}

export type AlertCategory = 'WATER_QUALITY' | 'FILTER_MAINTENANCE' | 'SYSTEM' | 'WATER_MANAGEMENT';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface NotificationItem {
  id: string;
  timestamp: number;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendedAction: string;
  acknowledged: boolean;
  resolved: boolean;
  code?: string;
}

export interface ThresholdConfig {
  pH: { min: number; max: number; criticalMin: number; criticalMax: number };
  turbidity: { ideal: number; maxScreening: number; critical: number };
  tds: { ideal: number; maxScreening: number; critical: number };
  dissolvedOxygen: { ideal: number; minScreening: number; critical: number };
  temperature: { min: number; max: number };
  esp32TimeoutSec: number;
}

export interface FirebaseConfigState {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type DataSourceMode = 'FIREBASE_LIVE' | 'DEMO_SIMULATION';

export interface SystemStatusState {
  firebaseConnected: boolean;
  firebaseConnecting: boolean;
  firebaseError: string | null;
  esp32Online: boolean;
  lastPacketTimestamp: number | null;
  secondsSinceLastPacket: number;
  dataSource: DataSourceMode;
  packetCount: number;
}
