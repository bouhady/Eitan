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

export interface HeartRateAnalytics {
  patientId: number;
  from: string;
  to: string;
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
}
