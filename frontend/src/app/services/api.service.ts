import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Patient, HeartRateReading } from '../types/patient';

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
}
