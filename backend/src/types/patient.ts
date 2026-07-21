export interface Paginated<T> {
  items: T[];
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
}

export interface HeartRateReading {
  id: number;
  patientId: number;
  timestamp: string;
  heartRate: number;
}

export interface HighHeartRateEvent {
  patientId: number;
  timestamp: string;
  heartRate: number;
}

export interface PatientRequestTracking {
  patientId: number;
  requestCount: number;
  lastRequestedAt: string | null;
}

export interface HeartRateAnalytics {
  patientId: number;
  from: string;
  to: string;
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
}
