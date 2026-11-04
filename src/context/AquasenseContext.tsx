import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  SensorReading,
  WaterQualityAssessment,
  FilterStage,
  MaintenanceRecord,
  WaterManagementMetrics,
  NotificationItem,
  ThresholdConfig,
  FirebaseConfigState,
  SystemStatusState,
  DataSourceMode,
} from '../types/aquasense';
import {
  calculateWaterQuality,
  DEFAULT_THRESHOLDS,
} from '../utils/waterQualityCalculator';
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  initFirebase,
  subscribeToLatestReadings,
  pushSensorReadingToFirebase,
  syncMaintenanceRecordToFirebase,
  syncFilterManagementToFirebase,
} from '../services/firebaseService';
import {
  generateInitialHistory,
  DEFAULT_FILTER_STAGES,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_WATER_METRICS,
  INITIAL_NOTIFICATIONS,
} from '../utils/mockDataGenerator';

interface AquasenseContextType {
  latestReading: SensorReading;
  previousReading: SensorReading | null;
  history: SensorReading[];
  systemStatus: SystemStatusState;
  qualityAssessment: WaterQualityAssessment;
  filterStages: FilterStage[];
  maintenanceRecords: MaintenanceRecord[];
  waterMetrics: WaterManagementMetrics;
  notifications: NotificationItem[];
  thresholds: ThresholdConfig;
  firebaseConfig: FirebaseConfigState;
  // Actions
  updateThresholds: (newThresholds: ThresholdConfig) => void;
  updateFirebaseConfig: (newConfig: FirebaseConfigState) => void;
  setDataSource: (mode: DataSourceMode) => void;
  acknowledgeNotification: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearResolvedNotifications: () => void;
  updateFilterStage: (stageId: string, updates: Partial<FilterStage>) => void;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => void;
  updateMaintenanceStatus: (recordId: string, status: MaintenanceRecord['status']) => void;
  injectSimulatedScenario: (scenario: 'normal' | 'turbidity_spike' | 'ph_acid' | 'tds_surge' | 'low_do' | 'disconnect_sensor' | 'esp32_offline') => void;
  reconnectFirebase: () => void;
}

const AquasenseContext = createContext<AquasenseContextType | undefined>(undefined);

export const AquasenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfigState>(getStoredFirebaseConfig());
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [dataSource, setDataSourceState] = useState<DataSourceMode>('FIREBASE_LIVE');

  // Initial sensor baseline
  const initialHistory = useRef(generateInitialHistory(24));
  const [history, setHistory] = useState<SensorReading[]>(initialHistory.current);
  const [latestReading, setLatestReading] = useState<SensorReading>(
    initialHistory.current[initialHistory.current.length - 1]
  );
  const [previousReading, setPreviousReading] = useState<SensorReading | null>(
    initialHistory.current[initialHistory.current.length - 2] || null
  );

  // System & Connection State
  const [systemStatus, setSystemStatus] = useState<SystemStatusState>({
    firebaseConnected: false,
    firebaseConnecting: true,
    firebaseError: null,
    esp32Online: true,
    lastPacketTimestamp: Date.now(),
    secondsSinceLastPacket: 0,
    dataSource: 'FIREBASE_LIVE',
    packetCount: 0,
  });

  // Filter Stages & Maintenance
  const [filterStages, setFilterStages] = useState<FilterStage[]>(DEFAULT_FILTER_STAGES);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE_RECORDS);
  const [waterMetrics, setWaterMetrics] = useState<WaterManagementMetrics>(INITIAL_WATER_METRICS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Reference to Firebase unsubscribe
  const firebaseUnsubRef = useRef<(() => void) | null>(null);
  const simulationIntervalRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);

  // Helper to add notification without duplicate spam
  const pushNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>) => {
    setNotifications((prev) => {
      // Check if an unacknowledged alert with the same title or code was created recently (< 5 minutes)
      const recent = prev.find(
        (n) =>
          !n.resolved &&
          (n.title === item.title || (item.code && n.code === item.code)) &&
          Date.now() - n.timestamp < 300000
      );
      if (recent) return prev; // Cooldown prevention

      const newItem: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        acknowledged: false,
        resolved: false,
      };
      return [newItem, ...prev.slice(0, 49)];
    });
  }, []);

  // Update packet and calculate water quality
  const handleNewReading = useCallback(
    (reading: SensorReading, isLivePacket = true) => {
      setPreviousReading((prev) => latestReading || prev);
      setLatestReading(reading);

      setHistory((prev) => {
        const updated = [...prev, reading];
        if (updated.length > 200) updated.shift();
        return updated;
      });

      if (isLivePacket) {
        setSystemStatus((prev) => ({
          ...prev,
          lastPacketTimestamp: reading.timestamp || Date.now(),
          packetCount: prev.packetCount + 1,
          esp32Online: true,
        }));
      }

      // Check for sensor-specific alerts
      if (reading.turbidity !== null && reading.turbidity !== undefined && reading.turbidity >= thresholds.turbidity.critical) {
        pushNotification({
          category: 'WATER_QUALITY',
          severity: 'CRITICAL',
          title: `High Turbidity Alert: ${reading.turbidity.toFixed(1)} NTU`,
          description: `Turbidity exceeded critical operational limit (${thresholds.turbidity.critical} NTU). Potential filter caking or upstream silt breakthrough.`,
          recommendedAction: 'Divert inlet water to waste or activate pre-sedimentation stage immediately.',
          code: 'TURB_CRIT',
        });
      }

      if (reading.pH !== null && reading.pH !== undefined) {
        if (reading.pH < thresholds.pH.criticalMin) {
          pushNotification({
            category: 'WATER_QUALITY',
            severity: 'CRITICAL',
            title: `Critical Acidic pH: ${reading.pH.toFixed(2)}`,
            description: `Inlet water pH is below safety limit (${thresholds.pH.criticalMin}). Aggressive corrosive characteristics.`,
            recommendedAction: 'Engage neutralizing dosing pump or divert feed stream.',
            code: 'PH_ACID_CRIT',
          });
        } else if (reading.pH > thresholds.pH.criticalMax) {
          pushNotification({
            category: 'WATER_QUALITY',
            severity: 'CRITICAL',
            title: `Critical Alkaline pH: ${reading.pH.toFixed(2)}`,
            description: `Inlet water pH is above safety limit (${thresholds.pH.criticalMax}). Scale precipitation hazard.`,
            recommendedAction: 'Inspect chemical dosing or source raw feed.',
            code: 'PH_ALK_CRIT',
          });
        }
      }

      if (reading.tds !== null && reading.tds !== undefined && reading.tds >= thresholds.tds.critical) {
        pushNotification({
          category: 'WATER_QUALITY',
          severity: 'WARNING',
          title: `High TDS Influx: ${reading.tds.toFixed(0)} ppm`,
          description: `Dissolved mineral solids exceed ${thresholds.tds.critical} ppm screening threshold.`,
          recommendedAction: 'Check RO membrane recovery ratio and feed pressure.',
          code: 'TDS_WARN',
        });
      }
    },
    [latestReading, pushNotification, thresholds]
  );

  // Setup Firebase Realtime Database connection
  const setupFirebaseSubscription = useCallback(() => {
    if (firebaseUnsubRef.current) {
      firebaseUnsubRef.current();
      firebaseUnsubRef.current = null;
    }

    setSystemStatus((prev) => ({
      ...prev,
      firebaseConnecting: true,
      firebaseError: null,
    }));

    const { db, error } = initFirebase(firebaseConfig);

    if (error || !db) {
      setSystemStatus((prev) => ({
        ...prev,
        firebaseConnected: false,
        firebaseConnecting: false,
        firebaseError: error || 'Firebase configuration incomplete',
        dataSource: 'DEMO_SIMULATION',
      }));

      pushNotification({
        category: 'SYSTEM',
        severity: 'INFO',
        title: 'Running in Demo / Simulated Mode',
        description: 'Firebase Realtime Database is not connected or credentials are not yet configured. Simulated ESP32 telemetry is active with clear demo labeling.',
        recommendedAction: 'To connect live hardware, enter your Firebase Realtime Database URL and API key in Settings.',
        code: 'SYS_DEMO_MODE',
      });
      return false;
    }

    try {
      const unsub = subscribeToLatestReadings(
        db,
        (reading) => {
          if (reading) {
            setSystemStatus((prev) => ({
              ...prev,
              firebaseConnected: true,
              firebaseConnecting: false,
              firebaseError: null,
              dataSource: 'FIREBASE_LIVE',
            }));
            handleNewReading(reading, true);
          } else {
            // Path AQUASENSE/latest exists but is empty
            setSystemStatus((prev) => ({
              ...prev,
              firebaseConnected: true,
              firebaseConnecting: false,
            }));
          }
        },
        (err) => {
          console.warn('Firebase RTDB subscription notice:', err.message);
          setSystemStatus((prev) => ({
            ...prev,
            firebaseConnected: false,
            firebaseConnecting: false,
            firebaseError: err.message,
            dataSource: 'DEMO_SIMULATION',
          }));
        }
      );

      firebaseUnsubRef.current = unsub;
      return true;
    } catch (e: any) {
      setSystemStatus((prev) => ({
        ...prev,
        firebaseConnected: false,
        firebaseConnecting: false,
        firebaseError: e.message,
        dataSource: 'DEMO_SIMULATION',
      }));
      return false;
    }
  }, [firebaseConfig, handleNewReading, pushNotification]);

  // Demo / Simulation engine: runs when in DEMO_SIMULATION mode
  useEffect(() => {
    if (systemStatus.dataSource === 'DEMO_SIMULATION') {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

      simulationIntervalRef.current = setInterval(() => {
        setLatestReading((current) => {
          // Subtle realistic noise
          const basePh = current.pH !== null && current.pH !== undefined ? current.pH : 7.2;
          const newPh = Number(Math.max(5.5, Math.min(9.5, basePh + (Math.random() - 0.5) * 0.08)).toFixed(2));

          const baseTurb = current.turbidity !== null && current.turbidity !== undefined ? current.turbidity : 1.8;
          const newTurb = Number(Math.max(0.4, Math.min(15.0, baseTurb + (Math.random() - 0.48) * 0.12)).toFixed(1));

          const baseTds = current.tds !== null && current.tds !== undefined ? current.tds : 245;
          const newTds = Math.round(Math.max(50, Math.min(850, baseTds + (Math.random() - 0.5) * 4)));

          const baseDo = current.dissolvedOxygen !== null && current.dissolvedOxygen !== undefined ? current.dissolvedOxygen : 7.8;
          const newDo = Number(Math.max(2.0, Math.min(11.0, baseDo + (Math.random() - 0.5) * 0.06)).toFixed(1));

          const baseTemp = current.temperature !== null && current.temperature !== undefined ? current.temperature : 23.8;
          const newTemp = Number((baseTemp + (Math.random() - 0.5) * 0.05).toFixed(1));

          const updatedReading: SensorReading = {
            pH: newPh,
            turbidity: newTurb,
            tds: newTds,
            dissolvedOxygen: newDo,
            temperature: newTemp,
            uptime: (current.uptime || 120000) + 3000,
            timestamp: Date.now(),
          };

          handleNewReading(updatedReading, true);
          return updatedReading;
        });

        // Slowly update flow and throughput
        setWaterMetrics((prev) => {
          const flowVariation = Number((18.2 + (Math.random() - 0.5) * 1.5).toFixed(1));
          return {
            ...prev,
            flowRateLpm: flowVariation,
            totalProcessedTodayL: prev.totalProcessedTodayL + Math.round((flowVariation * 3) / 60),
          };
        });
      }, 3000);
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [systemStatus.dataSource, handleNewReading]);

  // Heartbeat monitor: check if ESP32 stopped transmitting (> timeout sec)
  useEffect(() => {
    heartbeatTimerRef.current = setInterval(() => {
      setSystemStatus((prev) => {
        const lastTs = prev.lastPacketTimestamp || Date.now();
        const diffSec = Math.floor((Date.now() - lastTs) / 1000);
        const isOffline = diffSec > thresholds.esp32TimeoutSec;

        if (isOffline && prev.esp32Online) {
          pushNotification({
            category: 'SYSTEM',
            severity: 'CRITICAL',
            title: 'ESP32 IoT Node Disconnected',
            description: `No telemetry received for over ${diffSec} seconds (Timeout threshold: ${thresholds.esp32TimeoutSec}s). Check microcontroller power, Wi-Fi connectivity, and Firebase write stream.`,
            recommendedAction: 'Inspect ESP32 LED indicators, verify 5V power supply, and restart device.',
            code: 'ESP32_OFFLINE',
          });
        }

        return {
          ...prev,
          secondsSinceLastPacket: diffSec,
          esp32Online: !isOffline,
        };
      });
    }, 1000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [pushNotification, thresholds.esp32TimeoutSec]);

  // Initial connect
  useEffect(() => {
    setupFirebaseSubscription();
    return () => {
      if (firebaseUnsubRef.current) firebaseUnsubRef.current();
    };
  }, [setupFirebaseSubscription]);

  // Quality Assessment computation
  const qualityAssessment = calculateWaterQuality(
    latestReading,
    previousReading,
    thresholds
  );

  // Anomaly simulator for test and verification
  const injectSimulatedScenario = (
    scenario: 'normal' | 'turbidity_spike' | 'ph_acid' | 'tds_surge' | 'low_do' | 'disconnect_sensor' | 'esp32_offline'
  ) => {
    const now = Date.now();
    switch (scenario) {
      case 'normal':
        handleNewReading({
          pH: 7.24,
          turbidity: 1.4,
          tds: 230,
          dissolvedOxygen: 8.2,
          temperature: 23.4,
          uptime: (latestReading.uptime || 100000) + 5000,
          timestamp: now,
        });
        break;
      case 'turbidity_spike':
        handleNewReading({
          pH: 7.15,
          turbidity: 14.8, // Critical
          tds: 310,
          dissolvedOxygen: 7.1,
          temperature: 24.1,
          uptime: (latestReading.uptime || 100000) + 5000,
          timestamp: now,
        });
        break;
      case 'ph_acid':
        handleNewReading({
          pH: 5.4, // Critical acid
          turbidity: 2.1,
          tds: 280,
          dissolvedOxygen: 7.9,
          temperature: 23.0,
          uptime: (latestReading.uptime || 100000) + 5000,
          timestamp: now,
        });
        break;
      case 'tds_surge':
        handleNewReading({
          pH: 7.6,
          turbidity: 2.8,
          tds: 1150, // Critical TDS
          dissolvedOxygen: 6.8,
          temperature: 25.2,
          uptime: (latestReading.uptime || 100000) + 5000,
          timestamp: now,
        });
        break;
      case 'low_do':
        handleNewReading({
          pH: 6.9,
          turbidity: 4.2,
          tds: 390,
          dissolvedOxygen: 2.2, // Critical low DO
          temperature: 27.5,
          uptime: (latestReading.uptime || 100000) + 5000,
          timestamp: now,
        });
        break;
      case 'disconnect_sensor':
        // Turbidity sensor disconnected (null)
        handleNewReading({
          pH: 7.2,
          turbidity: null, // SENSOR_ERROR, NEVER replaced with 0
          tds: 240,
          dissolvedOxygen: 7.8,
          temperature: 23.5,
          uptime: (latestReading.uptime || 100000) + 5000,
          timestamp: now,
        });
        pushNotification({
          category: 'SYSTEM',
          severity: 'WARNING',
          title: 'Turbidity Sensor Disconnected',
          description: 'Analog/ADC reading returned NaN or probe communication timeout. Missing sensor value preserved as N/A without zero-substitution.',
          recommendedAction: 'Inspect optical turbidity probe wiring and ESP32 GPIO pin 34.',
          code: 'SENSOR_DISCONNECT_TURB',
        });
        break;
      case 'esp32_offline':
        // Fast-forward last packet timestamp by 70s to trigger offline status immediately
        setSystemStatus((prev) => ({
          ...prev,
          lastPacketTimestamp: Date.now() - 75000,
          esp32Online: false,
        }));
        pushNotification({
          category: 'SYSTEM',
          severity: 'CRITICAL',
          title: 'ESP32 Node Heartbeat Lost',
          description: 'Simulated ESP32 power failure or Wi-Fi disconnection triggered.',
          recommendedAction: 'Verify device power supply and router status.',
          code: 'ESP32_OFFLINE',
        });
        break;
    }
  };

  const updateThresholds = (newThresholds: ThresholdConfig) => {
    setThresholds(newThresholds);
  };

  const updateFirebaseConfig = (newConfig: FirebaseConfigState) => {
    setFirebaseConfig(newConfig);
    saveStoredFirebaseConfig(newConfig);
    setTimeout(() => {
      setupFirebaseSubscription();
    }, 100);
  };

  const setDataSource = (mode: DataSourceMode) => {
    setDataSourceState(mode);
    setSystemStatus((prev) => ({
      ...prev,
      dataSource: mode,
    }));
  };

  const acknowledgeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, acknowledged: true } : n))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearResolvedNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !n.resolved));
  };

  const updateFilterStage = (stageId: string, updates: Partial<FilterStage>) => {
    setFilterStages((prev) => {
      const next = prev.map((stage) =>
        stage.id === stageId ? { ...stage, ...updates } : stage
      );
      // If Firebase connected, sync
      const { db } = initFirebase(firebaseConfig);
      if (db) syncFilterManagementToFirebase(db, next).catch(() => {});
      return next;
    });
  };

  const addMaintenanceRecord = (record: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      createdAt: Date.now(),
    };
    setMaintenanceRecords((prev) => [newRecord, ...prev]);

    const { db } = initFirebase(firebaseConfig);
    if (db) syncMaintenanceRecordToFirebase(db, newRecord).catch(() => {});
  };

  const updateMaintenanceStatus = (recordId: string, status: MaintenanceRecord['status']) => {
    setMaintenanceRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status,
              completedDate: status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : r.completedDate,
            }
          : r
      )
    );
  };

  const reconnectFirebase = () => {
    setupFirebaseSubscription();
  };

  return (
    <AquasenseContext.Provider
      value={{
        latestReading,
        previousReading,
        history,
        systemStatus,
        qualityAssessment,
        filterStages,
        maintenanceRecords,
        waterMetrics,
        notifications,
        thresholds,
        firebaseConfig,
        updateThresholds,
        updateFirebaseConfig,
        setDataSource,
        acknowledgeNotification,
        dismissNotification,
        clearResolvedNotifications,
        updateFilterStage,
        addMaintenanceRecord,
        updateMaintenanceStatus,
        injectSimulatedScenario,
        reconnectFirebase,
      }}
    >
      {children}
    </AquasenseContext.Provider>
  );
};

export const useAquasense = () => {
  const context = useContext(AquasenseContext);
  if (!context) {
    throw new Error('useAquasense must be used within an AquasenseProvider');
  }
  return context;
};
