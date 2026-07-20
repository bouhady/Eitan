import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { Patient, HeartRateReading, HighHeartRateEvent, PatientRequestTracking } from '../types/patient';

export const HIGH_HEART_RATE_THRESHOLD = 100;
export const SLOW_QUERY_MS = 200;

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  // PGHOST/PGUSER/PGPASSWORD/PGDATABASE from env; statement_timeout kills runaway queries
  private pool = new Pool({ statement_timeout: 5000 });

  onModuleDestroy() {
    return this.pool.end(); // lets jest/e2e and graceful shutdown close cleanly
  }

  /** All queries go through here: warns on anything slower than SLOW_QUERY_MS. */
  private async query(sql: string, params: unknown[]): Promise<QueryResult> {
    const start = Date.now();
    const result = await this.pool.query(sql, params);
    const ms = Date.now() - start;
    if (ms > SLOW_QUERY_MS) {
      this.logger.warn(`slow query (${ms}ms): ${sql.replace(/\s+/g, ' ').trim()}`);
    }
    return result;
  }

  async getPatients(limit: number, offset: number): Promise<Patient[]> {
    const { rows } = await this.query(
      'SELECT id, name, age, gender FROM patients ORDER BY id LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return rows as Patient[];
  }

  async getHeartRateReadings(limit: number, offset: number): Promise<HeartRateReading[]> {
    const { rows } = await this.query(
      'SELECT id, "patientId", timestamp, "heartRate" FROM "heartRateReadings" ORDER BY timestamp, id LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    // id is BIGINT (pg returns string); Number() is exact up to 2^53
    return (rows as (HeartRateReading & { id: string | number })[]).map((r) => ({ ...r, id: Number(r.id) }));
  }

  async patientExists(id: number): Promise<boolean> {
    const { rowCount } = await this.query('SELECT 1 FROM patients WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async getHighHeartRateEvents(
    threshold: number,
    limit: number,
    offset: number,
  ): Promise<HighHeartRateEvent[]> {
    const { rows } = await this.query(
      // ORDER BY timestamp, id keeps paging stable when timestamps collide
      'SELECT "patientId", timestamp, "heartRate" FROM "heartRateReadings" WHERE "heartRate" > $1 ORDER BY timestamp, id LIMIT $2 OFFSET $3',
      [threshold, limit, offset],
    );
    return rows as HighHeartRateEvent[];
  }

  async getPatientAnalytics(id: number, from: string, to: string) {
    const { rows } = await this.query(
      `SELECT COUNT(*) AS count,
              AVG("heartRate")::float AS avg,
              MIN("heartRate") AS min,
              MAX("heartRate") AS max
       FROM "heartRateReadings"
       WHERE "patientId" = $1 AND timestamp BETWEEN $2 AND $3`,
      [id, from, to],
    );
    const r = rows[0] as { count: string; avg: number | null; min: number | null; max: number | null };
    // COUNT(*) is bigint (pg returns it as string); Number() is exact up to 2^53 rows,
    // unlike the previous ::int cast which would overflow past ~2.1B
    return { count: Number(r.count), avg: r.avg, min: r.min, max: r.max };
  }

  async trackPatientRequest(id: number): Promise<void> {
    await this.query(
      `INSERT INTO "patientRequestsAnalytics" ("patientId", "requestCount", "lastRequestedAt")
       VALUES ($1, 1, now())
       ON CONFLICT ("patientId") DO UPDATE
       SET "requestCount" = "patientRequestsAnalytics"."requestCount" + 1,
           "lastRequestedAt" = now()`,
      [id],
    );
  }

  async getPatientTracking(id: number): Promise<PatientRequestTracking> {
    const { rows } = await this.query(
      'SELECT "patientId", "requestCount", "lastRequestedAt" FROM "patientRequestsAnalytics" WHERE "patientId" = $1',
      [id],
    );
    if (!rows[0]) return { patientId: id, requestCount: 0, lastRequestedAt: null };
    const r = rows[0] as { patientId: number; requestCount: string; lastRequestedAt: string | null };
    // requestCount is BIGINT (pg returns string); Number() is exact up to 2^53
    return { patientId: r.patientId, requestCount: Number(r.requestCount), lastRequestedAt: r.lastRequestedAt };
  }
}
