import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  update,
  Database,
  Unsubscribe,
  DatabaseReference,
} from 'firebase/database';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { FirebaseConfigState, SensorReading } from '../types/aquasense';

const STORAGE_KEY_FIREBASE_CONFIG = 'aquasense_firebase_config';

// Load default config from environment or default structure for "water quality monitoring"
export function getStoredFirebaseConfig(): FirebaseConfigState {
  const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'water-quality-monitoring.firebaseapp.com',
    databaseURL:
      import.meta.env.VITE_FIREBASE_DATABASE_URL ||
      'https://water-quality-monitoring-default-rtdb.firebaseio.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'water-quality-monitoring',
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'water-quality-monitoring.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

export function saveStoredFirebaseConfig(config: FirebaseConfigState) {
  localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
}

let firebaseApp: FirebaseApp | null = null;
let realtimeDb: Database | null = null;
let firebaseAuth: Auth | null = null;

export function initFirebase(config: FirebaseConfigState): {
  app: FirebaseApp | null;
  db: Database | null;
  auth: Auth | null;
  error: string | null;
} {
  try {
    if (!config.databaseURL || (!config.apiKey && !config.projectId)) {
      return {
        app: null,
        db: null,
        auth: null,
        error: 'Incomplete Firebase config: databaseURL or apiKey missing.',
      };
    }

    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(config);
    }

    realtimeDb = getDatabase(firebaseApp, config.databaseURL);
    firebaseAuth = getAuth(firebaseApp);

    // Optional anonymous sign-in if security rules require authenticated read/write
    signInAnonymously(firebaseAuth).catch((err) => {
      console.warn('Anonymous auth sign-in notice (rules may allow public read):', err.message);
    });

    return { app: firebaseApp, db: realtimeDb, auth: firebaseAuth, error: null };
  } catch (err: any) {
    console.error('Firebase initialization failed:', err);
    return { app: null, db: null, auth: null, error: err.message || 'Firebase initialization failed' };
  }
}

/**
 * Subscribe to ESP32 latest telemetry at /AQUASENSE/latest
 */
export function subscribeToLatestReadings(
  db: Database,
  onReading: (reading: SensorReading | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const latestRef: DatabaseReference = ref(db, 'AQUASENSE/latest');

  return onValue(
    latestRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        // Strict mapping according to ESP32 database structure:
        // { pH, tds, turbidity, dissolvedOxygen, temperature, uptime }
        const parsed: SensorReading = {
          pH: val.pH !== undefined && val.pH !== null ? Number(val.pH) : null,
          tds: val.tds !== undefined && val.tds !== null ? Number(val.tds) : null,
          turbidity: val.turbidity !== undefined && val.turbidity !== null ? Number(val.turbidity) : null,
          dissolvedOxygen:
            val.dissolvedOxygen !== undefined && val.dissolvedOxygen !== null
              ? Number(val.dissolvedOxygen)
              : null,
          temperature:
            val.temperature !== undefined && val.temperature !== null ? Number(val.temperature) : null,
          uptime: val.uptime !== undefined && val.uptime !== null ? Number(val.uptime) : null,
          timestamp: val.timestamp ? Number(val.timestamp) : Date.now(),
        };
        onReading(parsed);
      } else {
        onReading(null);
      }
    },
    (err) => {
      onError(err);
    }
  );
}

/**
 * Write sensor data to /AQUASENSE/latest (used for testing or ESP32 simulator)
 */
export async function pushSensorReadingToFirebase(
  db: Database,
  reading: Partial<SensorReading>
) {
  const latestRef = ref(db, 'AQUASENSE/latest');
  const payload = {
    ...reading,
    timestamp: Date.now(),
  };
  await set(latestRef, payload);

  // Also push to extensible history collection: AQUASENSE/history/
  try {
    const historyRef = ref(db, 'AQUASENSE/history');
    await push(historyRef, payload);
  } catch (e) {
    console.warn('History push notice:', e);
  }
}

/**
 * Write/Update maintenance record to /AQUASENSE/maintenanceRecords
 */
export async function syncMaintenanceRecordToFirebase(
  db: Database,
  record: any
) {
  const recordsRef = ref(db, `AQUASENSE/maintenanceRecords/${record.id}`);
  await set(recordsRef, record);
}

/**
 * Write filter management states to /AQUASENSE/filterManagement
 */
export async function syncFilterManagementToFirebase(
  db: Database,
  filters: any[]
) {
  const filtersRef = ref(db, 'AQUASENSE/filterManagement');
  await set(filtersRef, filters);
}
