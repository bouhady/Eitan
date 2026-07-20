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
