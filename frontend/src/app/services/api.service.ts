import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Paginated,
  Patient,
  HeartRateReading,
  HighHeartRateEvent,
  HeartRateAnalytics,
  PatientRequestTracking,
} from '../types/patient';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  ping() {
    return this.http.get(`${this.base}/ping`, { responseType: 'text' });
  }

  getPatients(limit: number, offset: number) {
    return this.http.get<Paginated<Patient>>(`${this.base}/patients`, {
      params: { limit, offset },
    });
  }

  getHeartRateReadings(limit: number, offset: number) {
    return this.http.get<Paginated<HeartRateReading>>(`${this.base}/heart-rate-readings`, {
      params: { limit, offset },
    });
  }

  getHighHeartRateEvents(threshold: number, limit: number, offset: number) {
    return this.http.get<Paginated<HighHeartRateEvent>>(`${this.base}/api/high-heart-rate-events`, {
      params: { threshold, limit, offset },
    });
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
