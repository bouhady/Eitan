import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Patient, HeartRateReading, HighHeartRateEvent, HeartRateAnalytics, PatientRequestTracking } from '../types/patient';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000'; // ponytail: hardcoded dev URL, move to environment when deployed

  ping() {
    return this.http.get(`${this.base}/ping`, { responseType: 'text' });
  }

  getPatients() {
    return this.http.get<Patient[]>(`${this.base}/patients`);
  }

  getHeartRateReadings() {
    return this.http.get<HeartRateReading[]>(`${this.base}/heart-rate-readings`);
  }

  getHighHeartRateEvents() {
    return this.http.get<HighHeartRateEvent[]>(`${this.base}/api/high-heart-rate-events`);
  }

  getPatientAnalytics(id: number, from: string, to: string) {
    return this.http.get<HeartRateAnalytics>(`${this.base}/api/patient/${id}/analytics`, {
      params: { from, to },
    });
  }

  getPatientTracking(id: number) {
    return this.http.get<PatientRequestTracking>(`${this.base}/api/patient/${id}/tracking`);
  }
}
