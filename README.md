# Patients & Heart Rate Service

Full-stack home assignment: a NestJS + Postgres service managing patients and their
heart rate readings, with a small Angular UI to exercise the API.

## Quick start

```bash
docker compose up
```

| Service  | URL                    |
|----------|------------------------|
| backend  | http://localhost:3000  |
| frontend | http://localhost:4200  |
| postgres | localhost:5432 (`app`/`app`, db `patients`) |

Everything runs in watch mode with source mounted — edit locally, containers reload.
No local Node/Postgres install needed.

## Backend (NestJS + TypeScript)

```
backend/src/
  main.ts                       bootstrap (CORS enabled for the dev UI)
  app.module.ts                 wiring: controllers, providers, EventEmitterModule, middleware
  controllers/
    app.controller.ts           hello + /ping (mock 2s delay)
    patients.controller.ts      the assignment endpoints (under /api)
  services/
    app.service.ts
    tracking.service.ts         async event listener for request tracking
  db/
    db.service.ts               single data-access point: pg Pool + parameterized SQL
  middleware/
    logger.middleware.ts        logs every request
  types/
    patient.ts                  shared interfaces (Patient, readings, analytics, tracking)
```

### Assignment endpoints

Full spec with request/response shapes and error codes: [`docs/endpoints.md`](docs/endpoints.md).

1. **High Heart Rate Events** — `GET /api/high-heart-rate-events`
   All readings above 100 bpm (threshold is a named constant), filtered and ordered by SQL.
2. **Heart Rate Analytics** — `GET /api/patient/:id/analytics?from=&to=`
   `COUNT/AVG/MIN/MAX` computed by Postgres aggregates, not in JS. Validates dates (`400`),
   unknown patient (`404`), empty range returns `count: 0` with nulls.
3. **Patient Request Tracking** — `GET /api/patient/:id/tracking`
   Counts **analytics requests only** (not other endpoints): every call to
   `/api/patient/:id/analytics` emits a `patient.analytics.requested` event (NestJS EventEmitter);
   `TrackingService` handles it **asynchronously** and upserts a counter row — tracking never
   blocks or fails the request path. This endpoint reads the counter back.

### Design decisions

- **SQL does the work.** Filtering, aggregation, and the atomic tracking counter
  (`INSERT … ON CONFLICT … requestCount + 1`) live in Postgres. The Node layer stays thin
  and there are no read-modify-write races.
- **Raw `pg` over an ORM.** A handful of parameterized queries doesn't justify
  TypeORM/Prisma; `DbService` is the single seam where an ORM could later slot in.
- **Event-driven tracking** decouples the side effect from the request path: the analytics
  handler emits and returns; the listener catches and logs its own failures.
- **Validation at the boundary**: `ParseIntPipe` for ids, explicit ISO-date checks for the
  range — bad input fails fast with a clear `400`.

## Database (Postgres 16)

`db/init.sql` runs automatically on first container start (mounted into
`/docker-entrypoint-initdb.d`) and creates + seeds:

| Table                      | Purpose                                          |
|----------------------------|--------------------------------------------------|
| `patients`                 | profile data (seeded from `db/patients.json`)    |
| `heartRateReadings`        | timestamped readings, FK → patients — **partitioned by time range** (yearly + DEFAULT catch-all), `NOT NULL` + `CHECK (0 < heartRate <= 300)` constraints |
| `patientRequestsAnalytics` | per-patient `BIGINT` request counter + last-requested-at |

Data persists in the named `pgdata` volume; `docker compose down -v` resets to a fresh seed.

## Frontend (Angular + Material)

A minimal dev UI: one card per endpoint (patients, readings, high-heart-rate events,
analytics with id/date inputs, request tracking), each showing loading, data, and error
states. Structured as `components/`, `services/` (one typed `ApiService`), `types/`.

## Suggested improvements (given more time)

- Config via `.env` (DB credentials) instead of hardcoded compose values
- Migrations (e.g. node-pg-migrate) instead of a single init.sql
- Cursor pagination at deep offsets; partition automation (pg_partman) instead of the
  manual yearly partition; a real queue (Redis/Kafka) instead of in-process events
- Slow-query logging / statement timeouts / EXPLAIN ANALYZE in observability
- Production Dockerfiles (multi-stage build, nginx for the frontend)
