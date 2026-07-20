import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { Patient, HeartRateReading, HighHeartRateEvent, PatientRequestTracking } from '../types/patient';

export const HIGH_HEART_RATE_THRESHOLD = 100;

@Injectable()
export class DbService implements OnModuleDestroy {
  private pool = new Pool(); // reads PGHOST/PGUSER/PGPASSWORD/PGDATABASE from env

  onModuleDestroy() {
    return this.pool.end(); // lets jest/e2e and graceful shutdown close cleanly
  }

  async getPatients(): Promise<Patient[]> {
    const { rows } = await this.pool.query('SELECT * FROM patients');
    return rows as Patient[];
  }

  async getHeartRateReadings(): Promise<HeartRateReading[]> {
    const { rows } = await this.pool.query('SELECT * FROM "heartRateReadings"');
    return rows as HeartRateReading[];
  }

  async patientExists(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('SELECT 1 FROM patients WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async getHighHeartRateEvents(): Promise<HighHeartRateEvent[]> {
    const { rows } = await this.pool.query(
      'SELECT "patientId", timestamp, "heartRate" FROM "heartRateReadings" WHERE "heartRate" > $1 ORDER BY timestamp',
      [HIGH_HEART_RATE_THRESHOLD],
    );
    return rows as HighHeartRateEvent[];
  }

  async getPatientAnalytics(id: number, from: string, to: string) {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*)::int AS count,
              AVG("heartRate")::float AS avg,
              MIN("heartRate") AS min,
              MAX("heartRate") AS max
       FROM "heartRateReadings"
       WHERE "patientId" = $1 AND timestamp BETWEEN $2 AND $3`,
      [id, from, to],
    );
    return rows[0] as { count: number; avg: number | null; min: number | null; max: number | null };
  }

  async trackPatientRequest(id: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO "patientRequestsAnalytics" ("patientId", "requestCount", "lastRequestedAt")
       VALUES ($1, 1, now())
       ON CONFLICT ("patientId") DO UPDATE
       SET "requestCount" = "patientRequestsAnalytics"."requestCount" + 1,
           "lastRequestedAt" = now()`,
      [id],
    );
  }

  async getPatientTracking(id: number): Promise<PatientRequestTracking> {
    const { rows } = await this.pool.query(
      'SELECT "patientId", "requestCount", "lastRequestedAt" FROM "patientRequestsAnalytics" WHERE "patientId" = $1',
      [id],
    );
    return (rows[0] as PatientRequestTracking) ?? { patientId: id, requestCount: 0, lastRequestedAt: null };
  }
}
