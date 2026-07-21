import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';

export const SLOW_QUERY_MS = 200;

/**
 * Owns the connection concern — the single seam for connection pooling.
 * To move to an external pooler (PgBouncer, RDS Proxy) point PGHOST/PGPORT at it
 * here and adjust the options; nothing outside this file changes.
 */
@Injectable()
export class PoolService implements OnModuleDestroy {
  private readonly logger = new Logger(PoolService.name);
  // PGHOST/PGUSER/PGPASSWORD/PGDATABASE from env; statement_timeout kills runaway queries.
  // Pool size/timeouts tunable per environment.
  private pool = new Pool({
    statement_timeout: 5000,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT_MS ?? 30000),
    connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECT_TIMEOUT_MS ?? 5000),
  });

  onModuleDestroy() {
    return this.pool.end(); // lets jest/e2e and graceful shutdown close cleanly
  }

  /** All queries go through here: warns on anything slower than SLOW_QUERY_MS. */
  async query(sql: string, params: unknown[]): Promise<QueryResult> {
    const start = Date.now();
    const result = await this.pool.query(sql, params);
    const ms = Date.now() - start;
    if (ms > SLOW_QUERY_MS) {
      this.logger.warn(`slow query (${ms}ms): ${sql.replace(/\s+/g, ' ').trim()}`);
    }
    return result;
  }
}
