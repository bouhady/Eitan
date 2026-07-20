import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Patient, HeartRateReading, HighHeartRateEvent } from '../types/patient';

export const HIGH_HEART_RATE_THRESHOLD = 100;

@Injectable()
export class DbService {
  private pool = new Pool(); // reads PGHOST/PGUSER/PGPASSWORD/PGDATABASE from env

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
}
